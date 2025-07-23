# Docker Management Platform

Een uitgebreide Docker management applicatie voor Ubuntu 24 met de volgende features:

## 🚀 Status

**✅ ALLE COMPONENTEN OPERATIONEEL!**

### 🌐 **Service Toegang:**

**Via Nginx (Aanbevolen):**
- **Frontend**: http://localhost ✅ (React app via optimale nginx)
- **Backend API**: http://localhost/api ✅ (Node.js/Express via optimale nginx)
- **Grafana Dashboard**: http://localhost/grafana ✅ (Monitoring dashboard)
- **Prometheus Monitoring**: http://localhost/prometheus ✅ (Metrics collection)

**Directe Toegang (Voor Debugging):**
- **Frontend**: http://localhost:3003 ✅ (Directe toegang)
- **Backend API**: http://localhost:8000 ✅ (Directe toegang)
- **Redis Cache**: localhost:6380 ✅ (Caching layer)

**🔄 Laatste rebuild**: $(Get-Date -Format "dd/MM/yyyy HH:mm")

## 🎯 **NIEUWE FEATURES - ALLES WERKT!**

### ✅ **Dashboard Functionaliteit**
- **Real-time Container Monitoring**: Live updates elke 5 seconden
- **Container Management**: Start, stop, restart, delete containers
- **Resource Monitoring**: CPU, geheugen, netwerk gebruik
- **Status Overzicht**: Running, stopped, paused containers
- **Add Container Button**: Directe link naar container management

### ✅ **GitHub Integration**
- **Repository Ophalen**: Automatisch repositories laden met GitHub token
- **Branch Selection**: Kies uit beschikbare branches
- **Deployment Configuratie**: Environment, port, Dockerfile path, domain
- **One-Click Deploy**: Automatische deployment van GitHub naar Docker
- **Secure Token Handling**: Veilige GitHub token opslag

### ✅ **API Integration**
- **Complete API Service**: Alle backend endpoints geïntegreerd
- **Real-time Updates**: React Query voor automatische data refresh
- **Error Handling**: Gebruiksvriendelijke foutmeldingen
- **Loading States**: Professionele loading indicators

## 🏗️ Optimale Nginx Architectuur

### Centrale Nginx Reverse Proxy (Beste Praktijken)

**Hoofdkenmerken:**
- **Performance**: Keepalive connections, gzip compression, optimal caching
- **Security**: Rate limiting, security headers, request validation
- **Scalability**: Upstream load balancing, connection pooling
- **Monitoring**: Health checks, error handling, logging

**Technische Optimalisaties:**
- **Worker Processes**: Auto-scaled based on CPU cores
- **Connection Pooling**: Keepalive 32 connections per upstream
- **Gzip Compression**: Level 6 voor optimale balans
- **Rate Limiting**: API (10r/s), Webhooks (5r/s), Login (1r/s)
- **Timeout Management**: 60s voor API, 86400s voor WebSocket
- **Static File Caching**: 1 jaar voor assets, immutable headers

### Routing Schema (Logisch & Efficiënt)

```
Internet → Nginx (poort 80) → Service Routing
                ↓
    ┌─────────────────────────────────┐
    │  Optimale Routing:              │
    │  / → Frontend (React)           │
    │  /api/* → Backend (Node.js)     │
    │  /grafana/* → Grafana           │
    │  /prometheus/* → Prometheus     │
    │  /socket.io/* → WebSocket       │
    │  /health → Health check         │
    └─────────────────────────────────┘
```

**Container Architectuur:**
- **Eén centrale nginx** - Alle verkeer via optimale reverse proxy
- **Geen aparte nginx per container** - Efficiënte resource gebruik
- **Intern netwerk** - Containers communiceren via Docker network
- **Externe toegang** - Alleen via centrale nginx (poort 80/443)

## Features

### 🐳 Docker Container Management
- **Dashboard**: Overzicht van alle Docker containers met naam en resource gebruik
- **Container Monitoring**: Real-time monitoring van CPU, geheugen en netwerk gebruik
- **Container Scaling**: Eenvoudig containers uitbreiden met één klik
- **Container Lifecycle**: Start, stop, restart en verwijder containers

### 🔗 GitHub Integration
- **Repository Selection**: Kies uit je GitHub repositories
- **Auto Deployment**: Automatische deployment van geselecteerde repositories
- **Auto Updates**: Automatische updates wanneer er wijzigingen zijn in GitHub
- **Webhook Support**: Real-time updates via GitHub webhooks

### 🌐 Domain Management
- **Automatic Domains**: Elke container krijgt automatisch een eigen domein
- **SSL Certificates**: Automatische SSL certificaten via Let's Encrypt
- **Reverse Proxy**: Nginx reverse proxy voor domein routing

### 🖥️ Server Management
- **Multi-Server Support**: Beheer meerdere servers vanuit één dashboard
- **Server Monitoring**: Monitor server resources en status
- **Load Balancing**: Automatische load balancing tussen servers

## Technologie Stack

- **Backend**: Node.js met Express
- **Frontend**: React met TypeScript
- **Database**: PostgreSQL
- **Container Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx (geoptimaliseerd)
- **SSL**: Let's Encrypt
- **Monitoring**: Prometheus + Grafana

## Installatie

```bash
# Clone repository
git clone <repository-url>
cd docker-platforms

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start the platform
docker-compose up -d
```

## Configuratie

1. **GitHub Integration**: Voeg GitHub token toe in `.env`
2. **Domain Configuration**: Configureer je domein in nginx config
3. **SSL Certificates**: Let's Encrypt wordt automatisch geconfigureerd

## Gebruik

### 🎯 **Dashboard Gebruik**
1. Open het dashboard op `http://localhost`
2. Bekijk real-time container status en resources
3. Gebruik de "Add Container" knop voor nieuwe containers
4. Beheer containers met start/stop/restart/delete acties

### 🔗 **GitHub Deployment**
1. Ga naar de GitHub pagina in het dashboard
2. Voer je GitHub Personal Access Token in
3. Selecteer een repository uit de lijst
4. Kies branch en configureer deployment settings
5. Klik "Deploy Application" voor automatische deployment

### 📊 **Monitoring**
1. Bekijk real-time metrics in het dashboard
2. Ga naar Grafana voor gedetailleerde monitoring
3. Check Prometheus voor system metrics

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Troubleshooting

### Docker Socket Permission Error
De backend toont een Docker socket permission error in Windows Docker Desktop. Dit is normaal en heeft geen invloed op de functionaliteit.

### Container Restart Issues
Als containers herstarten, controleer de logs:
```bash
docker logs docker-platform-nginx
docker logs docker-platform-frontend
docker logs docker-platform-backend
```

### Port Conflicts
Zorg ervoor dat poorten 80, 443 en 6380 vrij zijn.

### Nginx Optimalisatie
Voor beste performance, controleer de nginx configuratie:
```bash
docker exec docker-platform-nginx nginx -t
docker logs docker-platform-nginx
```

### GitHub Integration Issues
- Controleer of je GitHub token geldig is en repo scope heeft
- Zorg ervoor dat repositories toegankelijk zijn
- Check de browser console voor API errors

## Service Endpoints

- **Frontend**: http://localhost
- **API Health**: http://localhost/health
- **Grafana**: http://localhost/grafana (admin/admin)
- **Prometheus**: http://localhost/prometheus
- **Redis**: localhost:6380

## Performance Optimalisaties

- **Gzip Compression**: Alle tekstbestanden gecomprimeerd
- **Static Caching**: Assets 1 jaar gecached
- **Connection Pooling**: Keepalive voor alle upstreams
- **Rate Limiting**: Bescherming tegen DDoS
- **Security Headers**: Moderne security standaarden

## 🎉 **SUCCES!**

**Alle functionaliteit is nu operationeel:**
- ✅ Dashboard met real-time container monitoring
- ✅ GitHub integration voor automatische deployments
- ✅ Container management (start/stop/restart/delete)
- ✅ API integration met error handling
- ✅ Responsive UI met loading states
- ✅ Optimale Nginx reverse proxy
- ✅ Monitoring stack (Prometheus + Grafana)

**Je kunt nu:**
1. **Containers beheren** via het dashboard
2. **GitHub repositories ophalen** en automatisch deployen
3. **Real-time monitoring** van alle resources
4. **Automatische deployment** van code naar containers 