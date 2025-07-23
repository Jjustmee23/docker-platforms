# VPS Setup Guide - Docker Platform

## Server Information
- **Domain**: soft.nexonsolutions.be
- **Main IP**: 45.154.238.100
- **Extra IPs**: 45.154.238.103, 45.154.238.105, 45.154.238.106, 45.154.238.115, 45.154.238.117, 45.154.238.119, 45.154.238.120, 45.154.238.121, 45.154.238.122
- **OS**: Ubuntu Server 24.04 LTS (Noble Numbat)

## Quick Setup Commands

### 1. Initial Server Setup

```bash
# Connect to your VPS
ssh root@45.154.238.100

# Download and run the setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

### 2. Manual Setup (if script fails)

```bash
# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release ufw fail2ban htop nano vim tree net-tools nginx certbot python3-certbot-nginx

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Configure PostgreSQL
sudo -u postgres psql -c "CREATE USER danny WITH PASSWORD 'Jjustmee12773';"
sudo -u postgres psql -c "CREATE DATABASE docker_platform OWNER danny;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE docker_platform TO danny;"

# Configure firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable

# Configure fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF

systemctl restart fail2ban
systemctl enable fail2ban
```

### 3. Deploy Application

```bash
# Create application directory
mkdir -p /opt/docker-platform
cd /opt/docker-platform

# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Create environment file
cp env.example .env

# Edit environment file with your values
nano .env

# Deploy the application
./deploy.sh
```

### 4. SSL Certificate Setup

```bash
# Get SSL certificate
certbot --nginx -d soft.nexonsolutions.be -d www.soft.nexonsolutions.be --non-interactive --agree-tos --email admin@soft.nexonsolutions.be

# Test auto-renewal
certbot renew --dry-run
```

## GitHub Integration Setup

### 1. GitHub Repository Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

- `VPS_HOST`: 45.154.238.100
- `VPS_USERNAME`: root (or your username)
- `VPS_SSH_KEY`: Your private SSH key
- `VPS_PORT`: 22
- `DOMAIN`: soft.nexonsolutions.be

### 2. GitHub Webhook Setup

1. Go to your GitHub repository
2. Settings > Webhooks
3. Add webhook:
   - **Payload URL**: `https://soft.nexonsolutions.be/webhook`
   - **Content type**: `application/json`
   - **Secret**: Use the value from your `.env` file (`GITHUB_WEBHOOK_SECRET`)
   - **Events**: Just the push event
   - **Active**: ✓

### 3. SSH Key Setup

```bash
# Generate SSH key on your local machine
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to VPS
ssh-copy-id root@45.154.238.100

# Or manually add to authorized_keys
cat ~/.ssh/id_rsa.pub | ssh root@45.154.238.100 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

## Application Access

After deployment, you can access:

- **Main Application**: https://soft.nexonsolutions.be
- **Grafana Dashboard**: https://soft.nexonsolutions.be/grafana
- **Prometheus Monitoring**: https://soft.nexonsolutions.be/prometheus
- **API Documentation**: https://soft.nexonsolutions.be/api

## Default Credentials

- **Grafana**: admin / admin
- **PostgreSQL**: danny / Jjustmee12773

## Monitoring and Maintenance

### Check Application Status

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Backup Database

```bash
# Manual backup
cd /opt/docker-platform
./backup.sh

# Check backup files
ls -la /opt/backups/
```

### Update Application

```bash
# Manual update
cd /opt/docker-platform
git pull origin main
./deploy.sh

# Or trigger via webhook (automatic when pushing to main branch)
```

### SSL Certificate Renewal

```bash
# Manual renewal
certbot renew

# Check renewal status
systemctl status certbot-renew.timer
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :80
   # Kill the process
   kill -9 <PID>
   ```

2. **Docker permission issues**:
   ```bash
   # Add user to docker group
   usermod -aG docker $USER
   # Log out and back in
   ```

3. **SSL certificate issues**:
   ```bash
   # Check certificate status
   certbot certificates
   # Renew manually
   certbot renew --force-renewal
   ```

4. **Webhook not working**:
   ```bash
   # Check webhook logs
   docker-compose logs -f webhook
   # Test webhook manually
   curl -X POST https://soft.nexonsolutions.be/webhook
   ```

### Log Locations

- **Application logs**: `/opt/docker-platform/backend/logs/`
- **Nginx logs**: `/var/log/nginx/`
- **Docker logs**: `docker-compose logs`
- **Webhook logs**: `/opt/docker-platform/webhook.log`

## Security Notes

1. **Change default passwords** in the `.env` file
2. **Update JWT_SECRET** with a strong random string
3. **Configure firewall** properly (already done in setup)
4. **Enable fail2ban** (already configured)
5. **Regular updates**: `apt update && apt upgrade`
6. **Monitor logs** for suspicious activity

## Performance Optimization

1. **Enable gzip compression** (already configured in nginx)
2. **Set up caching** (already configured)
3. **Monitor resource usage**:
   ```bash
   htop
   docker stats
   ```

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify configuration: `nginx -t`
3. Test connectivity: `curl -I https://soft.nexonsolutions.be`
4. Check system resources: `htop`, `df -h`, `free -h` 