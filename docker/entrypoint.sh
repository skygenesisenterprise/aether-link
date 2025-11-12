#!/bin/bash

# Aether Link Entrypoint Script
# This script prepares the environment and starts services

set -e

echo "🚀 Starting Aether Link (Asterisk + Next.js)..."

# Function to wait for a service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    local timeout=${4:-30}
    
    echo "⏳ Waiting for $service to be ready on $host:$port..."
    
    for i in $(seq 1 $timeout); do
        if nc -z $host $port; then
            echo "✅ $service is ready!"
            return 0
        fi
        echo "   Attempt $i/$timeout..."
        sleep 1
    done
    
    echo "❌ $service failed to start within $timeout seconds"
    return 1
}

# Function to check if Asterisk is responsive
check_asterisk() {
    echo "🔍 Checking Asterisk status..."
    if asterisk -rx "core show version" > /dev/null 2>&1; then
        echo "✅ Asterisk is running and responsive"
        return 0
    else
        echo "❌ Asterisk is not responding"
        return 1
    fi
}

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p /var/log/asterisk
mkdir -p /var/run/asterisk
mkdir -p /var/log/supervisor

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R asterisk:asterisk /var/log/asterisk
chown -R asterisk:asterisk /var/run/asterisk
chown -R asterisk:asterisk /var/www/aether-link

# Generate basic Asterisk configuration if not exists
if [ ! -f /etc/asterisk/sip.conf ]; then
    echo "📝 Generating basic Asterisk configuration..."
    cat > /etc/asterisk/sip.conf << 'EOF'
[general]
context=default
bindaddr=0.0.0.0
bindport=5060
tcpenable=yes
tcpbindaddr=0.0.0.0
tcpbindport=5060

[1001]
type=friend
host=dynamic
secret=password1001
context=default
EOF
    chown asterisk:asterisk /etc/asterisk/sip.conf
fi

if [ ! -f /etc/asterisk/extensions.conf ]; then
    echo "📝 Generating basic dialplan..."
    cat > /etc/asterisk/extensions.conf << 'EOF'
[general]
static=yes
writeprotect=no

[default]
exten => 1001,1,Dial(SIP/1001,30)
exten => 1001,n,Hangup()

exten => _X.,1,NoOp(Call from ${CALLERID(all)} to ${EXTEN})
exten => _X.,n,Answer()
exten => _X.,n,Playback(hello-world)
exten => _X.,n,Hangup()
EOF
    chown asterisk:asterisk /etc/asterisk/extensions.conf
fi

# Create health check endpoint for Next.js
echo "🏥 Creating health check endpoint..."
mkdir -p /var/www/aether-link/app/api/health
cat > /var/www/aether-link/app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'aether-link-client'
  });
}
EOF
chown asterisk:asterisk /var/www/aether-link/app/api/health/route.ts

# Display service information
echo ""
echo "🌟 Aether Link Services:"
echo "   • Asterisk PBX: SIP on 5060/udp, RTP on 10000-20000/udp"
echo "   • Next.js Client: http://localhost:3000"
echo "   • API Endpoints: http://localhost:3000/api"
echo "   • Logs: /var/log/supervisor/"
echo ""
echo "📋 Useful Commands:"
echo "   • Asterisk CLI: docker exec -it <container> asterisk -rvvv"
echo "   • Supervisor status: docker exec -it <container> supervisorctl status"
echo "   • View logs: docker exec -it <container> tail -f /var/log/supervisor/*.log"
echo ""

# Start supervisor
echo "🎯 Starting services with Supervisor..."
exec "$@"