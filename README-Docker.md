# 🚀 Aether Link - Dockerized PBX + Web Interface

A modern telecommunications platform combining Asterisk PBX with a Next.js web client, containerized for easy deployment and development.

## 📋 Features

- **Asterisk PBX**: Full-featured telephony system
- **Next.js Client**: Modern web interface for management
- **Multi-container Architecture**: Asterisk + Web Client + Database
- **Hot Reload**: Development-friendly with live updates
- **Persistent Data**: PostgreSQL + Redis for data storage
- **Easy Deployment**: Docker Compose with single command

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Asterisk PBX  │    │  Next.js Client │    │   PostgreSQL    │
│   (SIP/RTP)     │    │   (Web UI)      │    │   (Database)    │
│                 │    │                 │    │                 │
│ Port: 5060      │    │ Port: 3000      │    │ Port: 5432      │
│ RTP: 10000-20000│    │ API: 8080       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │      Redis      │
                    │   (Cache/Sessions)│
                    │                 │
                    │ Port: 6379      │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Make (optional, for convenience commands)

### Production Deployment

```bash
# Clone and navigate to the project
git clone <repository-url>
cd aether-link

# Start all services
make up

# Or without make
docker-compose up -d

# Check service health
make health
```

### Development Setup

```bash
# Start development environment with hot reload
make dev

# Or without make
docker-compose -f docker-compose.dev.yml up --build
```

## 🌐 Access Points

Once started, you can access:

- **Web Interface**: http://localhost:3000
- **API Endpoints**: http://localhost:3000/api
- **pgAdmin** (dev): http://localhost:5050
- **Asterisk CLI**: `make asterisk`

## 📱 Default Credentials

- **Web Admin**: 
  - Username: `admin`
  - Password: `admin123`
- **PostgreSQL**:
  - User: `aether`
  - Password: `aether123`
- **pgAdmin**:
  - Email: `admin@aether-link.local`
  - Password: `admin123`

## 🛠️ Management Commands

### Using Make (Recommended)

```bash
# Service Management
make up          # Start production
make down        # Stop services
make restart     # Restart services
make dev         # Start development

# Monitoring
make logs        # View all logs
make health      # Check service health
make monitor     # Real-time monitoring

# Access
make shell       # Container shell
make asterisk    # Asterisk CLI
make db-shell    # PostgreSQL shell

# Database
make db-backup   # Backup database
make db-restore  # Restore database

# Cleanup
make clean       # Clean containers and images
```

### Manual Docker Commands

```bash
# View logs
docker-compose logs -f

# Access container
docker-compose exec aether-link /bin/bash

# Asterisk CLI
docker-compose exec aether-link asterisk -rvvv

# Database access
docker-compose exec postgres psql -U aether -d aether_link
```

## 📁 Directory Structure

```
aether-link/
├── client/                 # Next.js web application
│   ├── src/               # React components and pages
│   ├── public/            # Static assets
│   └── package.json       # Node.js dependencies
├── docker/                # Docker configuration files
│   ├── supervisord.conf   # Process supervisor config
│   ├── asterisk.conf      # Asterisk service config
│   ├── nextjs.conf        # Next.js service config
│   └── entrypoint.sh      # Container startup script
├── config/                # Persistent configuration
│   └── asterisk/          # Asterisk configuration files
├── data/                  # Persistent data
│   └── asterisk/          # Asterisk runtime data
├── logs/                  # Log files
│   ├── asterisk/          # Asterisk logs
│   └── supervisor/        # Supervisor logs
├── init-scripts/          # Database initialization
├── docker-compose.yml     # Production compose file
├── docker-compose.dev.yml # Development compose file
├── Dockerfile            # Production image
├── Dockerfile.dev        # Development image
└── Makefile              # Convenience commands
```

## 🔧 Configuration

### Environment Variables

Key environment variables in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - NEXT_PUBLIC_AETHER_LINK_PROTOCOL=http
  - NEXT_PUBLIC_AETHER_LINK_HOST=localhost
  - NEXT_PUBLIC_AETHER_LINK_PORT=8080
  - NEXT_PUBLIC_AETHER_LINK_WS_PROTOCOL=ws
  - NEXT_PUBLIC_AETHER_LINK_WS_PORT=8080
```

### Asterisk Configuration

Asterisk configuration files are mounted from `./config/asterisk/`:

- `sip.conf` - SIP endpoint configuration
- `extensions.conf` - Dialplan rules
- `pjsip.conf` - PJSIP configuration
- `cdr.conf` - Call detail records

### Database Configuration

PostgreSQL initialization scripts in `./init-scripts/`:

- `01-init-database.sql` - Database schema and initial data

## 🔄 Development Workflow

### 1. Making Changes to Web Client

```bash
# Start development environment
make dev

# Make changes to files in client/
# Changes will be hot-reloaded automatically
```

### 2. Modifying Asterisk Configuration

```bash
# Edit configuration files
vim config/asterisk/sip.conf

# Reload Asterisk configuration
make asterisk
> dialplan reload
> sip reload
```

### 3. Database Changes

```bash
# Create new migration script
vim init-scripts/02-new-feature.sql

# Recreate database (WARNING: This deletes data)
docker-compose down -v
docker-compose up -d
```

## 📊 Monitoring

### Health Checks

```bash
# Check all services
make health

# Individual service checks
curl http://localhost:3000/api/health
docker-compose exec aether-link asterisk -rx "core show status"
```

### Logs

```bash
# All logs
make logs

# Specific service logs
make logs-asterisk
make logs-web

# Real-time monitoring
make monitor
```

## 🔒 Security Considerations

### Production Deployment

1. **Change Default Passwords**: Update all default credentials
2. **Network Security**: Use firewall rules to restrict access
3. **SSL/TLS**: Configure HTTPS for web interface
4. **SIP Security**: Use SRTP and secure SIP protocols
5. **Database Security**: Limit database network exposure

### Environment Variables

```bash
# Set strong passwords
POSTGRES_PASSWORD=your-secure-password
REDIS_PASSWORD=your-redis-password

# Use secure protocols
NEXT_PUBLIC_AETHER_LINK_PROTOCOL=https
NEXT_PUBLIC_AETHER_LINK_WS_PROTOCOL=wss
```

## 🚀 Scaling

### Horizontal Scaling

```yaml
# In docker-compose.yml
services:
  aether-link:
    deploy:
      replicas: 3
    # Add load balancer configuration
```

### Resource Limits

```yaml
services:
  aether-link:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 5060, 3000, 5432 are available
2. **Permission Issues**: Check file permissions in mounted volumes
3. **Database Connection**: Verify PostgreSQL is running and accessible
4. **Asterisk Not Starting**: Check configuration files in `config/asterisk/`

### Debug Commands

```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs aether-link

# Access container for debugging
make shell

# Check Asterisk status
asterisk -rx "core show version"
asterisk -rx "sip show peers"
```

## 📚 Additional Resources

- [Asterisk Documentation](https://docs.asterisk.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `make test`
5. Submit a pull request

## 📄 License

This project is licensed under the same terms as Asterisk - see the LICENSE file for details.