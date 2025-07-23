#!/bin/bash

# Test external database connection
echo "Testing external database connection..."

# Test if we can reach the database server
echo "1. Testing network connectivity to 45.154.238.111:5432..."
nc -zv 45.154.238.111 5432

if [ $? -eq 0 ]; then
    echo "✅ Network connectivity OK"
else
    echo "❌ Cannot reach database server"
    exit 1
fi

# Test database connection with psql
echo "2. Testing database connection..."
PGPASSWORD=Jjustmee12773 psql -h 45.154.238.111 -U danny -d docker_platform -c "SELECT version();"

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "Please check:"
    echo "- Database server is running"
    echo "- User 'danny' exists"
    echo "- Database 'docker_platform' exists"
    echo "- Password is correct"
    echo "- Firewall allows connections on port 5432"
    exit 1
fi

echo "🎉 External database is ready!" 