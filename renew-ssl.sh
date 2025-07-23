#!/bin/bash

# SSL Certificate Renewal Script
# This script renews SSL certificates for soft.nexonsolutions.be

echo "🔄 Renewing SSL certificates for soft.nexonsolutions.be..."

# Renew certificates
docker-compose run --rm certbot renew

# Check if renewal was successful
if [ $? -eq 0 ]; then
    echo "✅ SSL certificates renewed successfully!"
    
    # Reload nginx to use new certificates
    echo "🔄 Reloading nginx configuration..."
    docker-compose exec nginx nginx -s reload
    
    echo "🎉 SSL renewal completed successfully!"
else
    echo "❌ Failed to renew SSL certificates!"
    echo "🔍 Please check the logs for more details."
    exit 1
fi 