#!/bin/bash

# Database Setup Script for External PostgreSQL
# This script creates the database and all necessary tables

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

# Database configuration
DB_HOST="45.154.238.111"
DB_PORT="5432"
DB_USER="danny"
DB_PASSWORD="Jjustmee12773"
DB_NAME="docker_platform"

print_status "Setting up external PostgreSQL database..."

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL client (psql) is not installed. Please install it first:"
    echo "sudo apt install postgresql-client"
    exit 1
fi

# Test database connection
print_status "Testing database connection..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Cannot connect to database. Please check your credentials and network connection."
    exit 1
fi

# Create database if it doesn't exist
print_status "Creating database if it doesn't exist..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || print_warning "Database might already exist"

# Create tables
print_status "Creating database tables..."

# Read and execute the SQL file
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/init.sql

print_success "Database setup completed successfully!"

# Verify tables were created
print_status "Verifying tables..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt"

print_success "Database is ready for use!"
echo
echo "Database connection details:"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo
echo "Connection string:"
echo "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" 