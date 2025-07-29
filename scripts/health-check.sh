#!/bin/bash
# Run health checks on all services

set -e

echo "🏥 Running health checks on PIP VC Service and dependencies..."

# Function to check service health
check_health() {
    local name=$1
    local url=$2
    
    echo -n "🔍 Checking $name... "
    
    if curl -s -f "$url" > /dev/null; then
        echo "✅ Healthy"
        return 0
    else
        echo "❌ Unhealthy or unreachable"
        return 1
    fi
}

# Check main service
check_health "PIP VC Service" "http://localhost:3002/health"

# Check mock services
check_health "Mock Solid OIDC" "http://localhost:3100/health"
check_health "Mock PDS" "http://localhost:3101/health"
check_health "Mock DID:web" "http://localhost:3102/health"

echo ""
echo "📊 Detailed health information:"

# Get detailed health info from main service
echo "🎯 PIP VC Service:"
curl -s http://localhost:3002/health 2>/dev/null | python3 -m json.tool || echo "  Service not responding"

echo ""
echo "🔐 Mock OIDC:"
curl -s http://localhost:3100/health 2>/dev/null | python3 -m json.tool || echo "  Service not responding"

echo ""
echo "🗄️  Mock PDS:"
curl -s http://localhost:3101/health 2>/dev/null | python3 -m json.tool || echo "  Service not responding"

echo ""
echo "🆔 Mock DID:web:"
curl -s http://localhost:3102/health 2>/dev/null | python3 -m json.tool || echo "  Service not responding"

echo ""
echo "✅ Health check complete"
