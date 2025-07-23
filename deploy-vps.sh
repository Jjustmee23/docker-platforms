#!/bin/bash

# Complete VPS Deployment Script
# This script will deploy the entire Docker platform on VPS

echo "🚀 Starting VPS deployment..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt-get install -y curl wget git docker.io docker-compose

# Start and enable Docker
echo "🐳 Starting Docker service..."
systemctl start docker
systemctl enable docker

# Create project directory
echo "📁 Setting up project directory..."
mkdir -p /opt/docker-platform
cd /opt/docker-platform

# Clone or pull the repository
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull
else
    echo "📥 Cloning repository..."
    git clone https://github.com/your-username/docker-platform.git .
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p letsencrypt certbot/www logs

# Set proper permissions
echo "🔒 Setting permissions..."
chmod +x *.sh
chmod -R 755 letsencrypt/

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Test basic functionality
echo "🧪 Testing basic functionality..."
if curl -s http://localhost/api/containers > /dev/null; then
    echo "✅ API is responding"
else
    echo "⚠️  API not responding yet (this is normal during startup)"
fi

# Setup SSL if domain is configured
echo "🔐 Checking SSL setup..."
if curl -s -o /dev/null -w "%{http_code}" http://soft.nexonsolutions.be | grep -q "200\|301\|302"; then
    echo "🌐 Domain is accessible, setting up SSL..."
    ./setup-ssl-vps.sh
else
    echo "⚠️  Domain not accessible, SSL setup skipped"
    echo "📋 To enable SSL later:"
    echo "   1. Configure DNS A record for soft.nexonsolutions.be"
    echo "   2. Open port 80 in firewall"
    echo "   3. Run: ./setup-ssl-vps.sh"
fi

# Setup automatic SSL renewal
echo "🔄 Setting up automatic SSL renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * cd /opt/docker-platform && ./renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -

# Setup log rotation
echo "📋 Setting up log rotation..."
cat > /etc/logrotate.d/docker-platform << 'EOF'
/opt/docker-platform/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

# Final status check
echo "🎯 Final status check..."
docker-compose ps

echo "🎉 Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Access your platform at: http://localhost"
echo "   2. If SSL is configured: https://soft.nexonsolutions.be"
echo "   3. Grafana: http://localhost/grafana/ (admin/admin)"
echo "   4. Prometheus: http://localhost/prometheus/"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Restart services: docker-compose restart"
echo "   - Update: git pull && docker-compose up -d --build"
echo "   - SSL renewal: ./renew-ssl.sh" 