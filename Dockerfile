# Multi-stage build for Aether Link (Asterisk + Next.js Client)
FROM ubuntu:22.04 AS base

# Environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=20
ENV ASTERISK_VERSION=20

# ============================================================================
# STAGE 1: Build Asterisk
# ============================================================================
FROM base AS asterisk-builder

# Install Asterisk build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    autoconf \
    automake \
    libtool \
    libncurses5-dev \
    libssl-dev \
    libxml2-dev \
    libsqlite3-dev \
    uuid-dev \
    libjansson-dev \
    libcurl4-openssl-dev \
    libogg-dev \
    libvorbis-dev \
    libspeex-dev \
    libspeexdsp-dev \
    libsrtp2-dev \
    libopus-dev \
    libpq-dev \
    libmysqlclient-dev \
    libunbound-dev \
    libedit-dev \
    liblua5.3-dev \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set working directory for Asterisk build
WORKDIR /usr/src/asterisk

# Copy Asterisk source code
COPY . .

# Configure and build Asterisk
RUN ./configure \
    --with-pjproject-bundled \
    --with-crypto \
    --with-ssl \
    --with-srtp \
    --with-unbound \
    --with-jansson \
    --with-sqlite3 \
    --with-pgsql \
    --with-mysqlclient \
    --with-lua \
    --with-curl \
    --with-ogg \
    --with-vorbis \
    --with-speex \
    --with-speexdsp \
    --with-opus \
    --with-libedit

RUN make -j$(nproc)
RUN make install
RUN make samples

# ============================================================================
# STAGE 2: Build Next.js Client
# ============================================================================
FROM base AS client-builder

# Install Node.js and build dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    build-essential \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs

# Set working directory for client build
WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci --only=production

# Copy client source code
COPY client/ ./

# Build the Next.js application
RUN npm run build

# ============================================================================
# STAGE 3: Runtime Container
# ============================================================================
FROM base AS runtime

# Install runtime dependencies for both Asterisk and Node.js
RUN apt-get update && apt-get install -y \
    # Asterisk runtime dependencies
    libncurses5 \
    libssl3 \
    libxml2 \
    libsqlite3-0 \
    uuid-runtime \
    libjansson4 \
    libcurl4 \
    libogg0 \
    libvorbis0a \
    libspeex1 \
    libspeexdsp1 \
    libsrtp2-1 \
    libopus0 \
    libpq5 \
    libmysqlclient21 \
    libunbound8 \
    libedit2 \
    liblua5.3-0 \
    libpjsip2 \
    libpjproject \
    # Node.js runtime dependencies
    curl \
    gnupg \
    ca-certificates \
    # Process management
    supervisor \
    # Utilities
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs

# Create asterisk user
RUN useradd -m -s /bin/bash asterisk

# Copy compiled Asterisk files from builder stage
COPY --from=asterisk-builder /usr/lib/asterisk/ /usr/lib/asterisk/
COPY --from=asterisk-builder /usr/sbin/asterisk /usr/sbin/asterisk
COPY --from=asterisk-builder /usr/share/asterisk/ /usr/share/asterisk/
COPY --from=asterisk-builder /etc/asterisk/ /etc/asterisk/
COPY --from=asterisk-builder /var/lib/asterisk/ /var/lib/asterisk/
COPY --from=asterisk-builder /var/spool/asterisk/ /var/spool/asterisk/
COPY --from=asterisk-builder /var/log/asterisk/ /var/log/asterisk/
COPY --from=asterisk-builder /var/run/asterisk/ /var/run/asterisk/

# Copy built Next.js application
COPY --from=client-builder /app/client/.next/ /var/www/aether-link/.next/
COPY --from=client-builder /app/client/public/ /var/www/aether-link/public/
COPY --from=client-builder /app/client/package*.json /var/www/aether-link/
COPY --from=client-builder /app/client/next.config.ts /var/www/aether-link/

# Install Next.js production dependencies
WORKDIR /var/www/aether-link
RUN npm ci --only=production

# Create directories and set permissions
RUN mkdir -p /var/log/supervisor \
    && chown -R asterisk:asterisk /etc/asterisk \
    && chown -R asterisk:asterisk /var/lib/asterisk \
    && chown -R asterisk:asterisk /var/spool/asterisk \
    && chown -R asterisk:asterisk /var/log/asterisk \
    && chown -R asterisk:asterisk /var/run/asterisk \
    && chown -R asterisk:asterisk /var/www/aether-link

# Copy configuration files
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/asterisk.conf /etc/supervisor/conf.d/asterisk.conf
COPY docker/nextjs.conf /etc/supervisor/conf.d/nextjs.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# Make entrypoint script executable
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose ports
EXPOSE 5060/udp 5060/tcp 5061/udp 5061/tcp 10000-20000/udp 3000/tcp 8080/tcp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Set working directory
WORKDIR /var/www/aether-link

# Start services with supervisor
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]