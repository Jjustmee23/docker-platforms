#!/bin/bash

# Automated SSL Setup for VPS
# This script will set up SSL certificates for soft.nexonsolutions.be

echo "🔐 Setting up SSL certificates for VPS..."

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
echo "🌐 Server IP: $SERVER_IP"

# Check if domain is accessible (but don't fail if it's not)
echo "🌐 Checking domain accessibility..."
DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://soft.nexonsolutions.be 2>/dev/null || echo "000")

if [ "$DOMAIN_STATUS" = "000" ] || [ "$DOMAIN_STATUS" = "000" ]; then
    echo "⚠️  Domain soft.nexonsolutions.be is not accessible from the internet"
    echo "📋 This might be due to:"
    echo "   1. DNS A record not pointing to $SERVER_IP"
    echo "   2. Port 80 not open in firewall"
    echo "   3. Domain not propagated yet"
    echo ""
    echo "🔧 Attempting SSL setup anyway (this may work if DNS is configured)..."
    echo ""
else
    echo "✅ Domain is accessible (HTTP $DOMAIN_STATUS)"
fi

# Stop nginx temporarily
echo "🛑 Stopping nginx..."
docker-compose stop nginx

# Create temporary nginx config for certificate generation
echo "⚙️  Creating temporary nginx configuration..."
cat > nginx/nginx-temp.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name soft.nexonsolutions.be;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 200 "Certificate generation in progress...";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Update docker-compose to use temp config
sed -i 's|./nginx/nginx.conf:/etc/nginx/nginx.conf:ro|./nginx/nginx-temp.conf:/etc/nginx/nginx.conf:ro|g' docker-compose.yml

# Start nginx with temporary config
echo "🚀 Starting nginx with temporary configuration..."
docker-compose up -d nginx

# Wait for nginx to be ready
echo "⏳ Waiting for nginx to be ready..."
sleep 10

# Generate SSL certificates
echo "🔑 Generating SSL certificates..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@nexonsolutions.be \
    --agree-tos \
    --no-eff-email \
    -d soft.nexonsolutions.be

# Check if certificates were generated
if [ -d "letsencrypt/live/soft.nexonsolutions.be" ]; then
    echo "✅ SSL certificates generated successfully!"
    
    # Set proper permissions
    chmod -R 755 letsencrypt/
    
    # Stop nginx
    echo "🛑 Stopping nginx..."
    docker-compose stop nginx
    
    # Restore original nginx config
    echo "🔄 Restoring original nginx configuration..."
    sed -i 's|./nginx/nginx-temp.conf:/etc/nginx/nginx.conf:ro|./nginx/nginx.conf:/etc/nginx/nginx.conf:ro|g' docker-compose.yml
    rm nginx/nginx-temp.conf
    
    # Start all services
    echo "🚀 Starting all services with SSL..."
    docker-compose up -d
    
    echo "🎉 SSL setup completed successfully!"
    echo "🌐 Your site is now available at: https://soft.nexonsolutions.be"
    
else
    echo "❌ Failed to generate SSL certificates!"
    echo "🔍 Troubleshooting steps:"
    echo "   1. Ensure DNS A record for soft.nexonsolutions.be points to: $SERVER_IP"
    echo "   2. Open port 80 in firewall: ufw allow 80"
    echo "   3. Wait for DNS propagation (can take up to 24 hours)"
    echo "   4. Check if domain is accessible: curl -I http://soft.nexonsolutions.be"
    
    # Cleanup
    docker-compose stop nginx
    sed -i 's|./nginx/nginx-temp.conf:/etc/nginx/nginx.conf:ro|./nginx/nginx.conf:/etc/nginx/nginx.conf:ro|g' docker-compose.yml
    rm -f nginx/nginx-temp.conf
    
    echo ""
    echo "🔄 Restarting services without SSL..."
    docker-compose up -d
    exit 1
fi 