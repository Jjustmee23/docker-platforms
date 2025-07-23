#!/bin/bash

# Docker Platform Installation Script for Ubuntu 24.04
# This script installs and configures the complete Docker management platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check Ubuntu version
UBUNTU_VERSION=$(lsb_release -rs)
if [[ "$UBUNTU_VERSION" != "24.04" ]]; then
    print_warning "This script is designed for Ubuntu 24.04. You are running Ubuntu $UBUNTU_VERSION"
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_status "Starting Docker Platform installation..."

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y \
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
    vim \
    nano

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add user to docker group
    sudo usermod -aG docker $USER
    print_success "Docker installed successfully"
else
    print_status "Docker is already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_status "Docker Compose is already installed"
fi

# Install Node.js (for development)
print_status "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js installed successfully"
else
    print_status "Node.js is already installed"
fi

# Configure firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 5432/tcp
sudo ufw allow 6379/tcp
sudo ufw allow 9090/tcp
sudo ufw allow 3001/tcp

# Configure fail2ban
print_status "Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create application directory
print_status "Creating application directory..."
APP_DIR="/opt/docker-platform"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy application files
print_status "Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs nginx/conf.d ssl monitoring/grafana/provisioning

# Set up environment file
print_status "Setting up environment configuration..."
if [ ! -f .env ]; then
    cp env.example .env
    print_warning "Please edit .env file with your configuration before starting the platform"
fi

# Setup external database
print_status "Setting up external PostgreSQL database..."
if command -v node &> /dev/null; then
    npm install
    npm run setup-db
    print_success "Database setup completed"
else
    print_warning "Node.js not found. Please run database setup manually:"
    echo "npm install && npm run setup-db"
fi

# Set proper permissions
print_status "Setting proper permissions..."
sudo chown -R $USER:$USER $APP_DIR
chmod +x install.sh

# Create systemd service for auto-start
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/docker-platform.service > /dev/null <<EOF
[Unit]
Description=Docker Platform
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable docker-platform

# Create backup script
print_status "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash
# Backup script for Docker Platform

BACKUP_DIR="/opt/backups/docker-platform"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="docker-platform-backup-$DATE.tar.gz"

mkdir -p $BACKUP_DIR

echo "Creating backup: $BACKUP_NAME"

# Stop the platform
docker-compose down

# Create backup
tar -czf $BACKUP_DIR/$BACKUP_NAME \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=logs \
    --exclude=backups \
    .

# Start the platform
docker-compose up -d

echo "Backup created: $BACKUP_DIR/$BACKUP_NAME"

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "docker-platform-backup-*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Create update script
print_status "Creating update script..."
cat > update.sh << 'EOF'
#!/bin/bash
# Update script for Docker Platform

echo "Updating Docker Platform..."

# Backup current installation
./backup.sh

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "Update completed successfully!"
EOF

chmod +x update.sh

# Create monitoring script
print_status "Creating monitoring script..."
cat > monitor.sh << 'EOF'
#!/bin/bash
# Monitoring script for Docker Platform

echo "=== Docker Platform Status ==="
echo

echo "Container Status:"
docker-compose ps
echo

echo "Resource Usage:"
docker stats --no-stream
echo

echo "Disk Usage:"
df -h /
echo

echo "Memory Usage:"
free -h
echo

echo "Load Average:"
uptime
echo
EOF

chmod +x monitor.sh

# Print installation summary
print_success "Installation completed successfully!"
echo
echo "=== Installation Summary ==="
echo "Application directory: $APP_DIR"
echo "Configuration file: $APP_DIR/.env"
echo "Service name: docker-platform"
echo
echo "=== Next Steps ==="
echo "1. Edit the .env file with your configuration:"
echo "   nano $APP_DIR/.env"
echo
echo "2. Start the platform:"
echo "   cd $APP_DIR"
echo "   docker-compose up -d"
echo
echo "3. Or use the systemd service:"
echo "   sudo systemctl start docker-platform"
echo
echo "4. Access the platform:"
echo "   http://localhost:3000"
echo
echo "=== Useful Commands ==="
echo "Start platform: sudo systemctl start docker-platform"
echo "Stop platform: sudo systemctl stop docker-platform"
echo "View logs: docker-compose logs -f"
echo "Backup: ./backup.sh"
echo "Update: ./update.sh"
echo "Monitor: ./monitor.sh"
echo
echo "=== Security Notes ==="
echo "- Change default passwords in .env file"
echo "- Configure SSL certificates for production"
echo "- Set up proper firewall rules"
echo "- Regular backups are recommended"
echo
print_success "Docker Platform is ready to use!" 