# SSL Setup Guide for soft.nexonsolutions.be

This guide will help you set up SSL certificates using Let's Encrypt for your Docker platform.

## Prerequisites

1. **Domain Configuration**: Ensure `soft.nexonsolutions.be` points to your server's IP address
2. **Port 80 Access**: Port 80 must be accessible from the internet for Let's Encrypt verification
3. **Firewall**: Allow incoming connections on ports 80 and 443

## Quick Setup

### Step 1: Prepare the Environment

```bash
# Make scripts executable
chmod +x init-ssl.sh
chmod +x renew-ssl.sh

# Ensure directories exist
mkdir -p letsencrypt certbot/www
```

### Step 2: Generate SSL Certificates

```bash
# Run the SSL initialization script
./init-ssl.sh
```

This script will:
- Stop nginx temporarily
- Create a temporary nginx configuration
- Generate SSL certificates using Let's Encrypt
- Restore the original configuration
- Start all services with SSL enabled

### Step 3: Verify SSL Setup

After successful completion, your site will be available at:
- **HTTPS**: https://soft.nexonsolutions.be
- **HTTP**: http://soft.nexonsolutions.be (redirects to HTTPS)

## Automatic Certificate Renewal

Let's Encrypt certificates expire after 90 days. Set up automatic renewal:

### Option 1: Cron Job (Recommended)

```bash
# Add to crontab (runs twice daily)
echo "0 12 * * * /path/to/your/docker-platform/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1" | crontab -
```

### Option 2: Manual Renewal

```bash
# Run manually when needed
./renew-ssl.sh
```

## Troubleshooting

### Certificate Generation Fails

1. **Check Domain DNS**: Ensure `soft.nexonsolutions.be` points to your server
2. **Check Port 80**: Verify port 80 is accessible from the internet
3. **Check Firewall**: Ensure firewall allows incoming connections on port 80
4. **Check Logs**: Review certbot logs for specific errors

```bash
# Check certbot logs
docker-compose logs certbot

# Test domain resolution
nslookup soft.nexonsolutions.be

# Test port accessibility
curl -I http://soft.nexonsolutions.be
```

### Nginx SSL Errors

1. **Check Certificate Path**: Ensure certificates exist in `letsencrypt/live/soft.nexonsolutions.be/`
2. **Check Permissions**: Ensure nginx can read the certificate files
3. **Check Configuration**: Verify nginx configuration syntax

```bash
# Check certificate files
ls -la letsencrypt/live/soft.nexonsolutions.be/

# Test nginx configuration
docker-compose exec nginx nginx -t

# Check nginx logs
docker-compose logs nginx
```

### Certificate Renewal Fails

1. **Check Certbot Logs**: Review renewal logs for errors
2. **Manual Renewal**: Try running the renewal script manually
3. **Force Renewal**: Use `--force-renewal` flag if needed

```bash
# Force certificate renewal
docker-compose run --rm certbot renew --force-renewal
```

## Security Features

The SSL configuration includes:

- **TLS 1.2 and 1.3**: Modern, secure protocols
- **Strong Ciphers**: ECDHE-RSA with AES-GCM
- **HSTS**: HTTP Strict Transport Security
- **Security Headers**: X-Frame-Options, X-XSS-Protection, etc.
- **Automatic HTTP to HTTPS Redirect**: All HTTP traffic redirects to HTTPS

## File Structure

```
docker-platform/
├── letsencrypt/                    # SSL certificates
│   └── live/
│       └── soft.nexonsolutions.be/
│           ├── fullchain.pem
│           └── privkey.pem
├── certbot/
│   └── www/                       # ACME challenge files
├── nginx/
│   └── nginx.conf                 # SSL-enabled nginx config
├── init-ssl.sh                    # Initial SSL setup script
├── renew-ssl.sh                   # Certificate renewal script
└── docker-compose.yml             # Updated with SSL services
```

## Monitoring

Monitor SSL certificate status:

```bash
# Check certificate expiration
openssl x509 -in letsencrypt/live/soft.nexonsolutions.be/fullchain.pem -text -noout | grep "Not After"

# Check SSL configuration
curl -I https://soft.nexonsolutions.be
```

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs nginx certbot`
2. Verify domain configuration
3. Ensure ports are accessible
4. Review this guide for troubleshooting steps

Your Docker platform is now secured with SSL! 🎉 