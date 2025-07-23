# 🚀 VPS Quick Start Guide

## Prerequisites
- Ubuntu/Debian VPS
- Root access
- Domain name (optional for SSL)

## Quick Deployment

### 1. Connect to your VPS
```bash
ssh root@your-vps-ip
```

### 2. Download and run the deployment script
```bash
wget https://raw.githubusercontent.com/your-username/docker-platform/main/deploy-vps.sh
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### 3. Access your platform
- **Main Platform**: http://your-vps-ip
- **Grafana**: http://your-vps-ip/grafana/ (admin/admin)
- **Prometheus**: http://your-vps-ip/prometheus/

## Manual Deployment

### 1. Install dependencies
```bash
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git docker.io docker-compose
systemctl start docker && systemctl enable docker
```

### 2. Clone repository
```bash
cd /opt
git clone https://github.com/your-username/docker-platform.git
cd docker-platform
```

### 3. Start services
```bash
chmod +x *.sh
docker-compose up -d --build
```

### 4. Setup SSL (optional)
```bash
./setup-ssl-vps.sh
```

## Domain Configuration

### 1. DNS Setup
Add an A record pointing to your VPS IP:
```
soft.nexonsolutions.be  A  your-vps-ip
```

### 2. Firewall Configuration
```bash
# Allow HTTP and HTTPS
ufw allow 80
ufw allow 443
ufw enable
```

### 3. SSL Setup
```bash
./setup-ssl-vps.sh
```

## Management Commands

### View logs
```bash
docker-compose logs -f
```

### Restart services
```bash
docker-compose restart
```

### Update platform
```bash
git pull
docker-compose up -d --build
```

### SSL renewal
```bash
./renew-ssl.sh
```

### Stop all services
```bash
docker-compose down
```

## Troubleshooting

### Check service status
```bash
docker-compose ps
```

### View specific service logs
```bash
docker-compose logs nginx
docker-compose logs backend
docker-compose logs frontend
```

### Test API
```bash
curl http://localhost/api/containers
```

### Check SSL certificates
```bash
ls -la letsencrypt/live/soft.nexonsolutions.be/
```

## Security Notes

1. **Change default passwords** in Grafana
2. **Update JWT secret** in docker-compose.yml
3. **Configure firewall** properly
4. **Keep system updated** regularly

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify DNS configuration
3. Check firewall settings
4. Review this guide

Your Docker platform is now ready! 🎉 