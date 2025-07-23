# Database Setup Guide

## 🗄️ External PostgreSQL Database Setup

Deze guide helpt je met het opzetten van de externe PostgreSQL database voor het Docker Platform.

### 📋 Database Gegevens

- **Host**: 45.154.238.111
- **Port**: 5432
- **User**: danny
- **Password**: Jjustmee12773
- **Database**: docker_platform

### 🚀 Snelle Setup

#### Methode 1: Node.js Script (Aanbevolen)

1. **Installeer dependencies:**
```bash
npm install
```

2. **Run database setup:**
```bash
npm run setup-db
```

#### Methode 2: Handmatig met psql

1. **Installeer PostgreSQL client:**
```bash
# Ubuntu/Debian
sudo apt install postgresql-client

# Windows (met Chocolatey)
choco install postgresql

# macOS (met Homebrew)
brew install postgresql
```

2. **Run setup script:**
```bash
chmod +x setup-database.sh
./setup-database.sh
```

### 📊 Database Schema

Het script maakt de volgende tabellen aan:

#### Users Table
```sql
- id (SERIAL PRIMARY KEY)
- username (VARCHAR(255) UNIQUE)
- email (VARCHAR(255) UNIQUE)
- password_hash (VARCHAR(255))
- role (VARCHAR(50))
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Servers Table
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR(255))
- host (VARCHAR(255))
- port (INTEGER)
- username (VARCHAR(255))
- password_hash (VARCHAR(255))
- ssh_key_path (VARCHAR(500))
- status (VARCHAR(50))
- docker_version (VARCHAR(100))
- os_info (JSONB)
- resources (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Containers Table
```sql
- id (SERIAL PRIMARY KEY)
- docker_id (VARCHAR(255) UNIQUE)
- name (VARCHAR(255))
- image (VARCHAR(255))
- repository (VARCHAR(255))
- branch (VARCHAR(100))
- status (VARCHAR(50))
- port (INTEGER)
- domain (VARCHAR(255))
- environment (JSONB)
- volumes (JSONB)
- networks (JSONB)
- cpu_usage (DECIMAL(5,2))
- memory_usage (BIGINT)
- memory_limit (BIGINT)
- network_rx (BIGINT)
- network_tx (BIGINT)
- auto_update (BOOLEAN)
- server_id (INTEGER REFERENCES servers(id))
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_updated (TIMESTAMP)
```

#### Domains Table
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR(255) UNIQUE)
- container_id (INTEGER REFERENCES containers(id))
- ssl_enabled (BOOLEAN)
- ssl_certificate (JSONB)
- proxy_config (JSONB)
- status (VARCHAR(50))
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### GitHub Repositories Table
```sql
- id (SERIAL PRIMARY KEY)
- github_id (INTEGER UNIQUE)
- name (VARCHAR(255))
- full_name (VARCHAR(255))
- description (TEXT)
- private (BOOLEAN)
- html_url (VARCHAR(500))
- clone_url (VARCHAR(500))
- ssh_url (VARCHAR(500))
- default_branch (VARCHAR(100))
- language (VARCHAR(100))
- has_dockerfile (BOOLEAN)
- has_docker_compose (BOOLEAN)
- last_commit_sha (VARCHAR(255))
- last_commit_message (TEXT)
- last_commit_date (TIMESTAMP)
- webhook_id (INTEGER)
- webhook_secret (VARCHAR(255))
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Deployments Table
```sql
- id (SERIAL PRIMARY KEY)
- container_id (INTEGER REFERENCES containers(id))
- repository_id (INTEGER REFERENCES github_repositories(id))
- commit_sha (VARCHAR(255))
- commit_message (TEXT)
- deployment_config (JSONB)
- status (VARCHAR(50))
- logs (TEXT)
- started_at (TIMESTAMP)
- completed_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### Monitoring Data Table
```sql
- id (SERIAL PRIMARY KEY)
- container_id (INTEGER REFERENCES containers(id))
- cpu_usage (DECIMAL(5,2))
- memory_usage (BIGINT)
- memory_limit (BIGINT)
- network_rx (BIGINT)
- network_tx (BIGINT)
- disk_usage (BIGINT)
- timestamp (TIMESTAMP)
```

#### Backups Table
```sql
- id (SERIAL PRIMARY KEY)
- container_id (INTEGER REFERENCES containers(id))
- name (VARCHAR(255))
- file_path (VARCHAR(500))
- file_size (BIGINT)
- backup_type (VARCHAR(50))
- status (VARCHAR(50))
- created_at (TIMESTAMP)
```

### 🔧 Configuratie

#### Environment Variables

Zorg ervoor dat je `.env` bestand de juiste database configuratie bevat:

```env
# Database Configuration
DATABASE_URL=postgresql://danny:Jjustmee12773@45.154.238.111:5432/docker_platform
```

#### Docker Compose

De `docker-compose.yml` is al aangepast om de externe database te gebruiken. De lokale PostgreSQL service is verwijderd.

### 🔍 Verificatie

Na het runnen van het setup script, kun je de database verifiëren:

```bash
# Connect to database
PGPASSWORD=Jjustmee12773 psql -h 45.154.238.111 -p 5432 -U danny -d docker_platform

# List tables
\dt

# Check table structure
\d users
\d containers
\d servers
```

### 🚨 Troubleshooting

#### Connection Issues
```bash
# Test connection
PGPASSWORD=Jjustmee12773 psql -h 45.154.238.111 -p 5432 -U danny -d postgres -c "SELECT 1;"
```

#### Permission Issues
- Zorg ervoor dat de gebruiker `danny` rechten heeft om databases aan te maken
- Controleer of de gebruiker rechten heeft op de `docker_platform` database

#### Network Issues
- Controleer of poort 5432 open is op de database server
- Test de connectie met: `telnet 45.154.238.111 5432`

### 📈 Performance Tips

1. **Indexes**: Alle belangrijke kolommen hebben al indexes
2. **Connection Pooling**: De applicatie gebruikt connection pooling
3. **Monitoring**: Gebruik de monitoring_data tabel voor performance tracking

### 🔒 Security

1. **SSL**: Gebruik SSL connecties in productie
2. **Firewall**: Beperk toegang tot de database poort
3. **Strong Passwords**: Verander het wachtwoord regelmatig
4. **Backup**: Maak regelmatig backups van de database

### 📞 Support

Voor database gerelateerde problemen:
1. Controleer de connectie met het test commando
2. Verifieer de database rechten
3. Check de logs voor specifieke foutmeldingen 