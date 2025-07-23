#!/bin/bash

# Docker Platform VPS Setup Script
# For Ubuntu Server 24.04 LTS (Noble Numbat)
# Domain: soft.nexonsolutions.be
# Main IP: 45.154.238.100

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Configuration
DOMAIN="soft.nexonsolutions.be"
MAIN_IP="45.154.238.100"
EXTRA_IPS=(
    "45.154.238.103"
    "45.154.238.105"
    "45.154.238.106"
    "45.154.238.115"
    "45.154.238.117"
    "45.154.238.119"
    "45.154.238.120"
    "45.154.238.121"
    "45.154.238.122"
)

log "Starting Docker Platform VPS Setup for $DOMAIN"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root"
   exit 1
fi

# Update system
log "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
log "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    nano \
    vim \
    tree \
    net-tools \
    nginx \
    certbot \
    python3-certbot-nginx

# Install Docker
log "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
log "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create docker group and add user
usermod -aG docker $SUDO_USER

# Install Node.js and npm (for potential manual builds)
log "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL (if not using external database)
log "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Configure PostgreSQL
sudo -u postgres psql -c "CREATE USER danny WITH PASSWORD 'Jjustmee12773';"
sudo -u postgres psql -c "CREATE DATABASE docker_platform OWNER danny;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE docker_platform TO danny;"

# Configure firewall
log "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable

# Configure fail2ban
log "Configuring fail2ban..."
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

# Create application directory
log "Creating application directory..."
mkdir -p /opt/docker-platform
cd /opt/docker-platform

# Clone the repository (you'll need to provide the repository URL)
log "Please provide your GitHub repository URL:"
read -p "GitHub repository URL: " REPO_URL

if [ -n "$REPO_URL" ]; then
    git clone $REPO_URL .
else
    log "No repository URL provided. Please clone your repository manually to /opt/docker-platform"
fi

# Create environment file
log "Creating environment configuration..."
cat > .env << EOF
# Application Configuration
NODE_ENV=production
PORT=8000

# Database Configuration
DATABASE_URL=postgresql://danny:Jjustmee12773@localhost:5432/docker_platform
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# GitHub Integration
GITHUB_TOKEN=your-github-personal-access-token
GITHUB_WEBHOOK_SECRET=$(openssl rand -base64 32)

# Domain Configuration
DOMAIN=$DOMAIN
ACME_EMAIL=admin@$DOMAIN

# Docker Configuration
DOCKER_SOCKET=/var/run/docker.sock
DOCKER_REGISTRY_URL=localhost:5000

# Monitoring
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000

# SSL Configuration
SSL_EMAIL=admin@$DOMAIN
SSL_DOMAIN=$DOMAIN

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Backup Configuration
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE=0 2 * * *

# Load Balancer Configuration
LOAD_BALANCER_ENABLED=true
LOAD_BALANCER_ALGORITHM=round_robin

# Auto Scaling Configuration
AUTO_SCALE_ENABLED=true
AUTO_SCALE_MIN_INSTANCES=1
AUTO_SCALE_MAX_INSTANCES=10
AUTO_SCALE_CPU_THRESHOLD=80
AUTO_SCALE_MEMORY_THRESHOLD=80
EOF

# Configure nginx for the domain
log "Configuring nginx for domain $DOMAIN..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx

# Create SSL certificate
log "Setting up SSL certificate..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Create systemd service for auto-renewal
cat > /etc/systemd/system/certbot-renew.service << EOF
[Unit]
Description=Certbot Renewal Service
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --agree-tos
ExecStartPost=/bin/systemctl reload nginx

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/certbot-renew.timer << EOF
[Unit]
Description=Certbot Renewal Timer
Requires=certbot-renew.service

[Timer]
OnCalendar=*-*-* 02:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl enable certbot-renew.timer
systemctl start certbot-renew.timer

# Create deployment script
log "Creating deployment script..."
cat > /opt/docker-platform/deploy.sh << 'EOF'
#!/bin/bash

set -e

cd /opt/docker-platform

# Pull latest changes
git pull origin main

# Build and start containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Clean up old images
docker image prune -f

echo "Deployment completed successfully!"
EOF

chmod +x /opt/docker-platform/deploy.sh

# Create GitHub webhook script
log "Creating GitHub webhook script..."
cat > /opt/docker-platform/webhook.sh << 'EOF'
#!/bin/bash

# GitHub webhook handler
WEBHOOK_SECRET="$(grep GITHUB_WEBHOOK_SECRET .env | cut -d'=' -f2)"

# Verify webhook signature
SIGNATURE=$(echo "$HTTP_X_HUB_SIGNATURE_256" | sed 's/sha256=//')
PAYLOAD=$(cat)
EXPECTED_SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

if [ "$SIGNATURE" != "$EXPECTED_SIGNATURE" ]; then
    echo "HTTP/1.1 401 Unauthorized"
    echo "Content-Type: text/plain"
    echo ""
    echo "Invalid signature"
    exit 1
fi

# Trigger deployment
cd /opt/docker-platform
./deploy.sh

echo "HTTP/1.1 200 OK"
echo "Content-Type: text/plain"
echo ""
echo "Deployment triggered"
EOF

chmod +x /opt/docker-platform/webhook.sh

# Create backup script
log "Creating backup script..."
cat > /opt/docker-platform/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump -h localhost -U danny docker_platform > $BACKUP_DIR/db_backup_$DATE.sql

# Backup Docker volumes
docker run --rm -v docker-platform_redis_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/redis_backup_$DATE.tar.gz -C /data .

# Clean up old backups
find $BACKUP_DIR -name "*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/docker-platform/backup.sh

# Add backup to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/docker-platform/backup.sh") | crontab -

# Set proper permissions
chown -R $SUDO_USER:$SUDO_USER /opt/docker-platform

# Create monitoring dashboard
log "Setting up monitoring..."
mkdir -p /opt/docker-platform/monitoring/grafana/dashboards
mkdir -p /opt/docker-platform/monitoring/grafana/datasources

# Final instructions
log "Setup completed successfully!"
echo ""
echo -e "${BLUE}=== NEXT STEPS ===${NC}"
echo "1. Update the .env file with your actual values:"
echo "   - GITHUB_TOKEN"
echo "   - SMTP credentials"
echo "   - Other sensitive information"
echo ""
echo "2. Deploy the application:"
echo "   cd /opt/docker-platform"
echo "   ./deploy.sh"
echo ""
echo "3. Set up GitHub webhook:"
echo "   - Go to your GitHub repository settings"
echo "   - Add webhook: https://$DOMAIN/webhook"
echo "   - Use the webhook secret from .env file"
echo ""
echo "4. Access your application:"
echo "   - Main app: https://$DOMAIN"
echo "   - Grafana: https://$DOMAIN/grafana"
echo "   - Prometheus: https://$DOMAIN/prometheus"
echo ""
echo -e "${GREEN}Setup completed! Your Docker platform is ready for deployment.${NC}" 