# 🐳 Docker Platform

Een complete Docker management platform met monitoring, SSL ondersteuning en automatische deployment.

## 🚀 Quick Start

### VPS Deployment (Aanbevolen)

```bash
# Download en voer het deployment script uit
wget https://raw.githubusercontent.com/your-username/docker-platform/main/deploy-vps.sh
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Local Development

```bash
# Clone repository
git clone https://github.com/your-username/docker-platform.git
cd docker-platform

# Start services
docker-compose up -d --build

# Access platform
open http://localhost
```

## 📋 Features

- ✅ **Docker Container Management**
- ✅ **Real-time Monitoring** (Grafana + Prometheus)
- ✅ **SSL Support** (Let's Encrypt)
- ✅ **GitHub Integration**
- ✅ **Webhook Support**
- ✅ **Domain Management**
- ✅ **Automatic SSL Renewal**
- ✅ **Production Ready**

## 🌐 Access Points

- **Main Platform**: http://localhost (of je VPS IP)
- **Grafana Dashboard**: http://localhost/grafana/ (admin/admin)
- **Prometheus Metrics**: http://localhost/prometheus/
- **API Documentation**: http://localhost/api/

## 🔐 SSL Setup

### Automatisch (VPS)
```bash
./setup-ssl-vps.sh
```

### Handmatig
1. Configureer DNS A record voor je domain
2. Open poort 80 in firewall
3. Voer SSL setup script uit

## 📁 Project Structuur

```
docker-platform/
├── backend/                 # Node.js API
├── frontend/               # React App
├── nginx/                  # Nginx configuratie
├── monitoring/             # Prometheus & Grafana
├── scripts/                # Deployment scripts
├── docker-compose.yml      # Docker services
└── README.md              # Deze file
```

## 🔧 Management

### View Logs
```bash
docker-compose logs -f
```

### Restart Services
```bash
docker-compose restart
```

### Update Platform
```bash
git pull
docker-compose up -d --build
```

### SSL Renewal
```bash
./renew-ssl.sh
```

## 🛠️ Development

### Backend API
- Node.js + Express
- PostgreSQL database
- Redis caching
- JWT authentication

### Frontend
- React + TypeScript
- Tailwind CSS
- Real-time updates

### Monitoring
- Prometheus metrics
- Grafana dashboards
- Custom alerts

## 📚 Documentation

- [VPS Setup Guide](VPS_QUICK_START.md)
- [SSL Configuration](SSL_SETUP.md)
- [Database Setup](DATABASE_SETUP.md)

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch
3. Commit je changes
4. Push naar de branch
5. Open een Pull Request

## 📄 License

Dit project is gelicenseerd onder de MIT License.

## 🆘 Support

Voor vragen of problemen:
1. Check de logs: `docker-compose logs`
2. Review de documentatie
3. Open een issue op GitHub

---

**Gemaakt met ❤️ voor Docker management** 