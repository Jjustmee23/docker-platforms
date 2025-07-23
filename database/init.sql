-- Docker Platform Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servers table
CREATE TABLE servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 22,
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    ssh_key_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'offline',
    docker_version VARCHAR(100),
    os_info JSONB,
    resources JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Containers table
CREATE TABLE containers (
    id SERIAL PRIMARY KEY,
    docker_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    repository VARCHAR(255),
    branch VARCHAR(100) DEFAULT 'main',
    status VARCHAR(50) DEFAULT 'stopped',
    port INTEGER,
    domain VARCHAR(255),
    environment JSONB DEFAULT '{}',
    volumes JSONB DEFAULT '[]',
    networks JSONB DEFAULT '[]',
    cpu_usage DECIMAL(5,2) DEFAULT 0,
    memory_usage BIGINT DEFAULT 0,
    memory_limit BIGINT DEFAULT 0,
    network_rx BIGINT DEFAULT 0,
    network_tx BIGINT DEFAULT 0,
    auto_update BOOLEAN DEFAULT false,
    server_id INTEGER REFERENCES servers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Domains table
CREATE TABLE domains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    container_id INTEGER REFERENCES containers(id),
    ssl_enabled BOOLEAN DEFAULT false,
    ssl_certificate JSONB,
    proxy_config JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GitHub repositories table
CREATE TABLE github_repositories (
    id SERIAL PRIMARY KEY,
    github_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    description TEXT,
    private BOOLEAN DEFAULT false,
    html_url VARCHAR(500),
    clone_url VARCHAR(500),
    ssh_url VARCHAR(500),
    default_branch VARCHAR(100) DEFAULT 'main',
    language VARCHAR(100),
    has_dockerfile BOOLEAN DEFAULT false,
    has_docker_compose BOOLEAN DEFAULT false,
    last_commit_sha VARCHAR(255),
    last_commit_message TEXT,
    last_commit_date TIMESTAMP,
    webhook_id INTEGER,
    webhook_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deployments table
CREATE TABLE deployments (
    id SERIAL PRIMARY KEY,
    container_id INTEGER REFERENCES containers(id),
    repository_id INTEGER REFERENCES github_repositories(id),
    commit_sha VARCHAR(255),
    commit_message TEXT,
    deployment_config JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    logs TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monitoring data table
CREATE TABLE monitoring_data (
    id SERIAL PRIMARY KEY,
    container_id INTEGER REFERENCES containers(id),
    cpu_usage DECIMAL(5,2),
    memory_usage BIGINT,
    memory_limit BIGINT,
    network_rx BIGINT,
    network_tx BIGINT,
    disk_usage BIGINT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backups table
CREATE TABLE backups (
    id SERIAL PRIMARY KEY,
    container_id INTEGER REFERENCES containers(id),
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    backup_type VARCHAR(50) DEFAULT 'manual',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_containers_server_id ON containers(server_id);
CREATE INDEX idx_containers_status ON containers(status);
CREATE INDEX idx_containers_repository ON containers(repository);
CREATE INDEX idx_domains_container_id ON domains(container_id);
CREATE INDEX idx_monitoring_data_container_id ON monitoring_data(container_id);
CREATE INDEX idx_monitoring_data_timestamp ON monitoring_data(timestamp);
CREATE INDEX idx_deployments_container_id ON deployments(container_id);
CREATE INDEX idx_deployments_status ON deployments(status);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@docker-platform.com', '$2b$10$rQZ8N3YqX2vB1cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH', 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_containers_updated_at BEFORE UPDATE ON containers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_github_repositories_updated_at BEFORE UPDATE ON github_repositories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_backups_updated_at BEFORE UPDATE ON backups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 