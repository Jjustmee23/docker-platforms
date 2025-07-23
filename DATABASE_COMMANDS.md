# Database Commands Quick Reference

## 🗄️ Externe PostgreSQL Database Setup

### 📋 Database Gegevens
- **Host**: 45.154.238.111
- **Port**: 5432
- **User**: danny
- **Password**: Jjustmee12773
- **Database**: docker_platform

## 🚀 Snelle Setup

### 1. Installeer Dependencies
```bash
npm install
```

### 2. Database Setup
```bash
npm run setup-db
```

### 3. Test Database Connectie
```bash
npm run test-db
```

## 📊 Database Scripts

### Setup Scripts
| Command | Beschrijving |
|---------|-------------|
| `npm run setup-db` | Maakt database en alle tabellen aan |
| `npm run test-db` | Test database connectie en tabellen |
| `npm run backup-db` | Maakt backup van de database |
| `npm run restore-db` | Toont beschikbare backups |
| `npm run restore-db <filename>` | Herstelt database van backup |

### Handmatige Commands
```bash
# Connect to database
PGPASSWORD=Jjustmee12773 psql -h 45.154.238.111 -p 5432 -U danny -d docker_platform

# Test connection
PGPASSWORD=Jjustmee12773 psql -h 45.154.238.111 -p 5432 -U danny -d postgres -c "SELECT 1;"

# List tables
PGPASSWORD=Jjustmee12773 psql -h 45.154.238.111 -p 5432 -U danny -d docker_platform -c "\dt"

# Backup database
PGPASSWORD=Jjustmee12773 pg_dump -h 45.154.238.111 -p 5432 -U danny -d docker_platform -f backup.sql

# Restore database
PGPASSWORD=Jjustmee12773 psql -h 45.154.238.111 -p 5432 -U danny -d docker_platform -f backup.sql
```

## 📋 Database Tabellen

### Core Tabellen
- **users** - Gebruikers en authenticatie
- **servers** - Server configuraties
- **containers** - Docker containers
- **domains** - Domein configuraties
- **github_repositories** - GitHub repository info
- **deployments** - Deployment geschiedenis
- **monitoring_data** - Performance data
- **backups** - Backup geschiedenis

### Indexes
- `idx_containers_server_id` - Server lookup
- `idx_containers_status` - Status filtering
- `idx_containers_repository` - Repository lookup
- `idx_domains_container_id` - Container lookup
- `idx_monitoring_data_container_id` - Container monitoring
- `idx_monitoring_data_timestamp` - Time-based queries
- `idx_deployments_container_id` - Container deployments
- `idx_deployments_status` - Deployment status

## 🔧 Configuratie

### Environment Variables
```env
DATABASE_URL=postgresql://danny:Jjustmee12773@45.154.238.111:5432/docker_platform
```

### Docker Compose
De `docker-compose.yml` is aangepast om de externe database te gebruiken. De lokale PostgreSQL service is verwijderd.

## 🚨 Troubleshooting

### Connection Issues
```bash
# Test basic connectivity
telnet 45.154.238.111 5432

# Test database connection
npm run test-db
```

### Common Error Codes
- `ECONNREFUSED` - Database server niet bereikbaar
- `28P01` - Authenticatie fout (verkeerde credentials)
- `3D000` - Database bestaat niet (run setup-db)

### Permission Issues
- Zorg dat gebruiker `danny` rechten heeft om databases aan te maken
- Controleer of gebruiker rechten heeft op `docker_platform` database

## 📈 Performance Tips

1. **Connection Pooling** - De applicatie gebruikt connection pooling
2. **Indexes** - Alle belangrijke queries hebben indexes
3. **Monitoring** - Gebruik monitoring_data tabel voor performance tracking
4. **Backups** - Regelmatige backups met `npm run backup-db`

## 🔒 Security

1. **SSL** - Gebruik SSL connecties in productie
2. **Firewall** - Beperk toegang tot database poort
3. **Strong Passwords** - Verander wachtwoord regelmatig
4. **Backup** - Maak regelmatig backups

## 📞 Support

Voor database problemen:
1. Run `npm run test-db` voor diagnose
2. Check logs voor specifieke foutmeldingen
3. Verifieer database rechten
4. Test connectie met handmatige commands 