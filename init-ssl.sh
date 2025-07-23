#!/bin/bash

# SSL Certificate Initialization Script
# This script sets up SSL certificates for soft.nexonsolutions.be

echo "🔐 Initializing SSL certificates for soft.nexonsolutions.be..."

# Stop nginx temporarily to free up port 80
echo "📦 Stopping nginx container..."
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

# Start nginx with temporary config
echo "🚀 Starting nginx with temporary configuration..."
docker-compose up -d nginx

# Wait for nginx to be ready
echo "⏳ Waiting for nginx to be ready..."
sleep 10

# Generate SSL certificates
echo "🔑 Generating SSL certificates with Let's Encrypt..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@nexonsolutions.be \
    --agree-tos \
    --no-eff-email \
    -d soft.nexonsolutions.be

# Check if certificates were generated successfully
if [ -d "letsencrypt/live/soft.nexonsolutions.be" ]; then
    echo "✅ SSL certificates generated successfully!"
    
    # Set proper permissions
    echo "🔒 Setting proper permissions..."
    chmod -R 755 letsencrypt/
    
    # Stop nginx
    echo "🛑 Stopping nginx..."
    docker-compose stop nginx
    
    # Restore original nginx config
    echo "🔄 Restoring original nginx configuration..."
    rm nginx/nginx-temp.conf
    
    # Start all services
    echo "🚀 Starting all services with SSL..."
    docker-compose up -d
    
    echo "🎉 SSL setup completed successfully!"
    echo "🌐 Your site is now available at: https://soft.nexonsolutions.be"
    
else
    echo "❌ Failed to generate SSL certificates!"
    echo "🔍 Please check the logs and ensure:"
    echo "   1. Domain soft.nexonsolutions.be points to this server"
    echo "   2. Port 80 is accessible from the internet"
    echo "   3. Firewall allows incoming connections on port 80"
    
    # Cleanup
    docker-compose stop nginx
    rm nginx/nginx-temp.conf
    exit 1
fi 