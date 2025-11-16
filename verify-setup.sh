#!/bin/bash

# Embeddable Chat Agent - Setup Verification Script

echo "🔍 Verifying Embeddable Chat Agent Setup..."
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm installed: $NPM_VERSION"
else
    echo "❌ npm not found"
    exit 1
fi

echo ""
echo "Checking project files..."

# Check config file
if [ -f "config.yaml" ]; then
    echo "✅ config.yaml exists"
else
    echo "⚠️  config.yaml not found. Run: cp config.example.yaml config.yaml"
fi

# Check backend .env
if [ -f "backend/.env" ]; then
    echo "✅ backend/.env exists"

    # Check for API key
    if grep -q "OPENAI_API_KEY=sk-" "backend/.env"; then
        echo "✅ API key configured in backend/.env"
    else
        echo "⚠️  API key not configured. Edit backend/.env and add your OPENAI_API_KEY"
    fi
else
    echo "⚠️  backend/.env not found. Run: cp backend/.env.example backend/.env"
fi

# Check backend dependencies
if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Backend dependencies not installed. Run: cd backend && npm install"
fi

# Check frontend dependencies
if [ -d "frontend/node_modules" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  Frontend dependencies not installed. Run: cd frontend && npm install"
fi

# Check frontend build
if [ -f "frontend/dist/widget.js" ]; then
    echo "✅ Frontend widget built"
else
    echo "⚠️  Frontend widget not built. Run: cd frontend && npm run build"
fi

echo ""
echo "📋 Summary:"
echo ""

# Check if ready to run
READY=true

if [ ! -f "config.yaml" ]; then
    READY=false
fi

if [ ! -f "backend/.env" ]; then
    READY=false
fi

if [ ! -d "backend/node_modules" ]; then
    READY=false
fi

if [ ! -d "frontend/node_modules" ]; then
    READY=false
fi

if [ ! -f "frontend/dist/widget.js" ]; then
    READY=false
fi

if [ "$READY" = true ]; then
    echo "✅ Setup complete! Ready to start the server."
    echo ""
    echo "To start:"
    echo "  cd backend && npm run dev"
    echo ""
    echo "Then open demo.html in your browser to test!"
else
    echo "⚠️  Setup incomplete. Please address the warnings above."
    echo ""
    echo "Quick setup:"
    echo "  1. npm run install:all"
    echo "  2. npm run setup"
    echo "  3. Edit config.yaml and backend/.env"
    echo "  4. npm run build:frontend"
    echo "  5. npm run dev:backend"
fi

echo ""
