#!/bin/bash
# Setup script for PIP VC Service development environment

set -e

echo "🚀 Setting up PIP VC Service development environment..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or later is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please review and update the .env file with your configuration"
fi

# Check for Python (for mock services)
if command -v python3 &> /dev/null; then
    echo "🐍 Python3 found: $(python3 --version)"
    
    # Install Flask for mock services
    echo "📦 Installing Python dependencies for mock services..."
    pip3 install flask pyjwt --quiet || echo "⚠️  Failed to install Python dependencies. Mock services may not work."
else
    echo "⚠️  Python3 not found. Mock services will not be available."
fi

# Check for Docker
if command -v docker &> /dev/null; then
    echo "🐳 Docker found: $(docker --version)"
else
    echo "⚠️  Docker not found. Container deployment will not be available."
fi

# Make scripts executable
chmod +x scripts/*.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Quick start:"
echo "  npm run dev          # Start development server"
echo "  npm test             # Run tests"
echo "  npm run docker:build # Build Docker image"
echo ""
echo "🧪 Mock services:"
echo "  ./scripts/start-mocks.sh    # Start all mock services"
echo "  ./scripts/stop-mocks.sh     # Stop all mock services"
echo ""
echo "📚 Documentation:"
echo "  docs/openapi.yaml           # API specification"
echo "  SPECIFICATION.md            # Service specification"
echo "  README.md                   # Project overview"
echo ""
