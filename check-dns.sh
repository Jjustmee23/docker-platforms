#!/bin/bash

# DNS Configuration Check Script
# This script helps verify domain configuration for SSL setup

echo "🔍 DNS Configuration Check for SSL Setup"
echo "========================================"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
echo "🌐 Your server IP: $SERVER_IP"
echo ""

# Check domain DNS
echo "📡 Checking DNS configuration..."
DOMAIN_IP=$(dig +short soft.nexonsolutions.be 2>/dev/null | head -1)

if [ -z "$DOMAIN_IP" ]; then
    echo "❌ Domain soft.nexonsolutions.be has no DNS A record"
    echo "📋 You need to create an A record:"
    echo "   Type: A"
    echo "   Name: soft"
    echo "   Value: $SERVER_IP"
    echo "   TTL: 300 (or default)"
else
    echo "✅ Domain resolves to: $DOMAIN_IP"
    
    if [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
        echo "✅ DNS A record points to correct server IP"
    else
        echo "❌ DNS A record points to wrong IP ($DOMAIN_IP)"
        echo "📋 Update A record to point to: $SERVER_IP"
    fi
fi

echo ""

# Check if port 80 is open
echo "🔒 Checking firewall (port 80)..."
if ufw status | grep -q "80.*ALLOW"; then
    echo "✅ Port 80 is open in firewall"
else
    echo "❌ Port 80 is not open in firewall"
    echo "📋 Run: ufw allow 80"
fi

echo ""

# Test domain accessibility
echo "🌐 Testing domain accessibility..."
DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://soft.nexonsolutions.be 2>/dev/null || echo "000")

if [ "$DOMAIN_STATUS" = "000" ]; then
    echo "❌ Domain is not accessible from internet"
    echo "📋 Possible issues:"
    echo "   1. DNS not propagated yet (wait 5-30 minutes)"
    echo "   2. Firewall blocking port 80"
    echo "   3. Nginx not running"
else
    echo "✅ Domain is accessible (HTTP $DOMAIN_STATUS)"
fi

echo ""

# Check if nginx is running
echo "🐳 Checking Docker services..."
if docker-compose ps nginx | grep -q "Up"; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    echo "📋 Run: docker-compose up -d"
fi

echo ""
echo "🔧 Next steps:"
echo "   1. If DNS is wrong: Update your domain's A record"
echo "   2. If firewall is closed: Run: ufw allow 80"
echo "   3. Wait for DNS propagation (5-30 minutes)"
echo "   4. Run SSL setup: ./setup-ssl-vps.sh" 