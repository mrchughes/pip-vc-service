#!/bin/bash
# Start all mock services for testing

set -e

echo "🚀 Starting mock services for PIP VC Service..."

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        echo "⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to start a service in background
start_service() {
    local name=$1
    local script=$2
    local port=$3
    local log_file="logs/${name}.log"
    
    mkdir -p logs
    
    echo "📡 Starting $name on port $port..."
    
    if check_port $port; then
        python3 $script > $log_file 2>&1 &
        local pid=$!
        echo $pid > "logs/${name}.pid"
        
        # Wait a moment and check if process is still running
        sleep 2
        if kill -0 $pid 2>/dev/null; then
            echo "✅ $name started successfully (PID: $pid)"
        else
            echo "❌ Failed to start $name"
            return 1
        fi
    else
        echo "⏭️  Skipping $name (port $port in use)"
    fi
}

# Check Python availability
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is required to run mock services"
    exit 1
fi

# Install required packages if not present
pip3 install flask pyjwt --quiet 2>/dev/null || echo "⚠️  Some Python packages may be missing"

# Start mock services
start_service "mock-solid-oidc" "test/mocks/services/mock-solid-oidc.py" 3100
start_service "mock-pds" "test/mocks/services/mock-pds.py" 3101
start_service "mock-did-web" "test/mocks/services/mock-did-web.py" 3102

echo ""
echo "🎯 Mock services started:"
echo "  Mock Solid OIDC:    http://localhost:3100"
echo "  Mock PDS:           http://localhost:3101"
echo "  Mock DID:web:       http://localhost:3102"
echo ""
echo "📋 Health checks:"
echo "  curl http://localhost:3100/health"
echo "  curl http://localhost:3101/health"
echo "  curl http://localhost:3102/health"
echo ""
echo "🛑 To stop services: ./scripts/stop-mocks.sh"
echo "📄 Logs are in the logs/ directory"
