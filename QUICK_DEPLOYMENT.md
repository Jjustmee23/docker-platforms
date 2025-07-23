# 🚀 Quick Deployment Guide - Docker Platform

## VPS Setup Commands (Kopieer en plak)

### 1. Verbind met je VPS
```bash
ssh root@45.154.238.100
```

### 2. Download en voer setup script uit
```bash
# Download setup script
wget https://raw.githubusercontent.com/Jjustmee23/docker-platforms/main/setup-vps.sh

# Maak uitvoerbaar
chmod +x setup-vps.sh

# Voer uit
./setup-vps.sh
```

### 3. Test externe database connectie
```bash
# Test database connectie
apt install -y postgresql-client netcat
nc -zv 45.154.238.111 5432
PGPASSWORD=Jjustmee12773 psql -h 45.154.238.111 -U danny -d docker_platform -c "SELECT version();"
```

### 4. Als database connectie OK is, deploy de applicatie
```bash
# Ga naar applicatie directory
cd /opt/docker-platform

# Deploy de applicatie
./deploy.sh
```

## GitHub Repository Secrets

Voeg deze secrets toe aan je GitHub repository (https://github.com/Jjustmee23/docker-platforms/settings/secrets/actions):

- **VPS_HOST**: `45.154.238.100`
- **VPS_USERNAME**: `root`
- **VPS_SSH_KEY**: Je private SSH key (inhoud van `~/.ssh/id_rsa`)
- **VPS_PORT**: `22`
- **DOMAIN**: `soft.nexonsolutions.be`

## GitHub Webhook Setup

1. Ga naar: https://github.com/Jjustmee23/docker-platforms/settings/webhooks
2. Klik "Add webhook"
3. Vul in:
   - **Payload URL**: `https://soft.nexonsolutions.be/webhook`
   - **Content type**: `application/json`
   - **Secret**: Gebruik de waarde uit `/opt/docker-platform/.env` (GITHUB_WEBHOOK_SECRET)
   - **Events**: Just the push event
   - **Active**: ✓

## SSH Key Genereren (op je lokale machine)

```bash
# Genereer SSH key
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Kopieer naar VPS
ssh-copy-id root@45.154.238.100
```

## Toegang tot je applicatie

Na deployment kun je toegang krijgen tot:

- **Hoofdapplicatie**: https://soft.nexonsolutions.be
- **Grafana Dashboard**: https://soft.nexonsolutions.be/grafana (admin/admin)
- **Prometheus**: https://soft.nexonsolutions.be/prometheus
- **API**: https://soft.nexonsolutions.be/api

## Automatische Deployment

Vanaf nu zal elke push naar de `main` branch automatisch:
1. Tests uitvoeren via GitHub Actions
2. Deployen naar je VPS via SSH
3. Containers herstarten met nieuwe code

## Troubleshooting

### Als setup script faalt:
```bash
# Check logs
tail -f /var/log/syslog

# Handmatige installatie
apt update && apt upgrade -y
apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx
```

### Als deployment faalt:
```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs -f

# Handmatige deployment
cd /opt/docker-platform
git pull origin main
docker-compose down
docker-compose up -d
```

### SSL certificaat problemen:
```bash
# Handmatige SSL setup
certbot --nginx -d soft.nexonsolutions.be -d www.soft.nexonsolutions.be --non-interactive --agree-tos --email admin@soft.nexonsolutions.be
```

## Status Check

```bash
# Check of alles draait
docker-compose ps

# Check nginx status
systemctl status nginx

# Check SSL certificaat
certbot certificates

# Test webhook
curl -X POST https://soft.nexonsolutions.be/webhook
```

## 🎉 Klaar!

Je Docker platform is nu volledig geautomatiseerd:
- ✅ VPS setup geautomatiseerd
- ✅ GitHub Actions voor CI/CD
- ✅ Webhook voor automatische deployment
- ✅ SSL certificaten automatisch
- ✅ Monitoring en backups geconfigureerd 