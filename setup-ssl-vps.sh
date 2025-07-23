#!/bin/bash

# Automated SSL Setup for VPS
# This script will set up SSL certificates for soft.nexonsolutions.be

echo "🔐 Setting up SSL certificates for VPS..."

# Check if domain is accessible
echo "🌐 Checking domain accessibility..."
if ! curl -s -o /dev/null -w "%{http_code}" http://soft.nexonsolutions.be | grep -q "200\|301\|302"; then
    echo "❌ Domain soft.nexonsolutions.be is not accessible from the internet"
    echo "📋 Please ensure:"
    echo "   1. DNS A record points to this server's IP"
    echo "   2. Port 80 is open in firewall"
    echo "   3. Domain is accessible from internet"
    exit 1
fi

echo "✅ Domain is accessible"

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
    echo "🔍 Please check:"
    echo "   1. Domain DNS configuration"
    echo "   2. Firewall settings (port 80)"
    echo "   3. Server accessibility"
    
    # Cleanup
    docker-compose stop nginx
    sed -i 's|./nginx/nginx-temp.conf:/etc/nginx/nginx.conf:ro|./nginx/nginx.conf:/etc/nginx/nginx.conf:ro|g' docker-compose.yml
    rm -f nginx/nginx-temp.conf
    exit 1
fi 