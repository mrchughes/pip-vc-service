#!/bin/bash
# Stop all mock services

set -e

echo "🛑 Stopping mock services..."

# Function to stop a service
stop_service() {
    local name=$1
    local pid_file="logs/${name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            echo "🔄 Stopping $name (PID: $pid)..."
            kill $pid
            rm "$pid_file"
            echo "✅ $name stopped"
        else
            echo "⚠️  $name was not running"
            rm "$pid_file"
        fi
    else
        echo "⚠️  No PID file found for $name"
    fi
}

# Stop all services
stop_service "mock-solid-oidc"
stop_service "mock-pds"
stop_service "mock-did-web"

# Clean up any remaining processes
echo "🧹 Cleaning up any remaining mock service processes..."
pkill -f "mock-solid-oidc.py" 2>/dev/null || true
pkill -f "mock-pds.py" 2>/dev/null || true
pkill -f "mock-did-web.py" 2>/dev/null || true

echo "✅ All mock services stopped"
