# Docker Platform - Quick Start Guide

## 🚀 Quick Installation

### Prerequisites
- Ubuntu 24.04 (recommended) or Ubuntu 22.04
- At least 4GB RAM
- At least 20GB free disk space
- Internet connection

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd docker-platforms
```

### 2. Run Installation Script
```bash
chmod +x install.sh
./install.sh
```

### 3. Configure Environment
```bash
nano .env
```

**Required Configuration:**
```env
# GitHub Integration
GITHUB_TOKEN=your-github-personal-access-token
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# Domain Configuration
DOMAIN=your-domain.com
ACME_EMAIL=admin@your-domain.com

# Security
JWT_SECRET=your-super-secret-jwt-key
```

### 4. Start the Platform
```bash
docker-compose up -d
```

### 5. Access the Dashboard
Open your browser and go to: `http://localhost:3000`

Default credentials:
- Username: `admin`
- Password: `admin` (change this immediately!)

## 🐳 Features Overview

### Dashboard
- **Container Overview**: See all your Docker containers in a grid layout
- **Real-time Monitoring**: CPU, memory, and network usage for each container
- **Quick Actions**: Start, stop, restart, and scale containers with one click
- **Resource Statistics**: System-wide resource usage overview

### Container Management
- **Container Cards**: Each container displayed as a card with:
  - Container name and image
  - Current status (running/stopped)
  - Real-time resource usage
  - Quick action buttons
  - Expandable details section

### GitHub Integration
- **Repository List**: View all your GitHub repositories
- **Auto-Deployment**: Deploy repositories with Dockerfile or docker-compose.yml
- **Auto-Updates**: Automatic updates when you push to GitHub
- **Branch Selection**: Deploy from any branch

### Scaling
- **One-Click Scaling**: Scale containers horizontally with a single click
- **Load Balancing**: Automatic load balancing for scaled containers
- **Resource Management**: Monitor resource usage across scaled instances

### Domain Management
- **Automatic Domains**: Each container gets its own subdomain
- **SSL Certificates**: Automatic Let's Encrypt SSL certificates
- **Custom Domains**: Support for custom domain names

### Server Management
- **Multi-Server Support**: Manage multiple servers from one dashboard
- **Server Monitoring**: Monitor server resources and health
- **Remote Management**: Manage remote servers via SSH

## 🔧 Configuration

### GitHub Token Setup
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `repo` and `admin:repo_hook` permissions
3. Add the token to your `.env` file

### Domain Configuration
1. Point your domain to your server's IP address
2. Update the `DOMAIN` variable in `.env`
3. Set your email for SSL certificates

### SSL Certificates
The platform automatically handles SSL certificates via Let's Encrypt. Just ensure:
- Your domain points to the server
- Port 80 and 443 are open
- Email is configured in `.env`

## 📊 Monitoring

### Built-in Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboard (http://localhost:3001)
- **Real-time Updates**: Live container statistics
- **Resource Alerts**: CPU and memory usage alerts

### Access Monitoring
- Grafana: `http://localhost:3001` (admin/admin)
- Prometheus: `http://localhost:9090`

## 🔒 Security

### Default Security Features
- **Firewall**: UFW configured with necessary ports
- **Fail2ban**: Protection against brute force attacks
- **Rate Limiting**: API rate limiting to prevent abuse
- **SSL/TLS**: Automatic HTTPS with Let's Encrypt
- **Security Headers**: XSS protection, CSRF protection, etc.

### Security Recommendations
1. **Change Default Passwords**: Update admin password immediately
2. **Use Strong JWT Secret**: Generate a strong JWT secret
3. **Restrict Access**: Use firewall rules to restrict access
4. **Regular Updates**: Keep the platform updated
5. **Backup Regularly**: Use the built-in backup script

## 🛠️ Maintenance

### Backup
```bash
./backup.sh
```
Creates a complete backup of your platform configuration and data.

### Update
```bash
./update.sh
```
Updates the platform to the latest version with automatic backup.

### Monitoring
```bash
./monitor.sh
```
Shows current system status and resource usage.

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🚨 Troubleshooting

### Common Issues

**Platform won't start:**
```bash
# Check Docker status
sudo systemctl status docker

# Check logs
docker-compose logs

# Restart Docker
sudo systemctl restart docker
```

**Can't access dashboard:**
```bash
# Check if containers are running
docker-compose ps

# Check port availability
sudo netstat -tlnp | grep :3000

# Restart platform
docker-compose restart
```

**GitHub integration not working:**
- Verify GitHub token has correct permissions
- Check webhook configuration
- Review GitHub API rate limits

**SSL certificate issues:**
- Ensure domain points to server
- Check port 80 and 443 are open
- Verify email configuration

### Getting Help
1. Check the logs: `docker-compose logs -f`
2. Verify configuration in `.env`
3. Check system resources: `./monitor.sh`
4. Review firewall settings: `sudo ufw status`

## 📈 Scaling

### Horizontal Scaling
1. Click the scale button on any container card
2. Enter the number of replicas
3. The platform automatically creates load-balanced instances

### Vertical Scaling
1. Edit container configuration
2. Update resource limits
3. Restart container

### Multi-Server Setup
1. Add servers in the Servers section
2. Configure SSH access
3. Deploy containers across multiple servers

## 🔄 Auto-Updates

### GitHub Webhooks
- Automatic deployment on push to configured branches
- Configurable per repository
- Rollback capability

### Configuration
1. Enable auto-update for a container
2. Configure webhook in GitHub
3. Push changes to trigger deployment

## 📝 API Documentation

The platform provides a RESTful API for automation:

### Authentication
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Container Management
```bash
# List containers
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/containers

# Start container
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/containers/<id>/start
```

## 🎯 Next Steps

1. **Explore the Dashboard**: Familiarize yourself with the interface
2. **Add Your First Container**: Deploy a simple application
3. **Configure GitHub**: Set up repository integration
4. **Set Up Domains**: Configure custom domains for your containers
5. **Monitor Performance**: Use Grafana to monitor system performance
6. **Set Up Backups**: Configure regular backup schedules
7. **Security Hardening**: Review and improve security settings

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs and error messages
3. Verify configuration settings
4. Check system resources

---

**Happy Container Management! 🐳** 