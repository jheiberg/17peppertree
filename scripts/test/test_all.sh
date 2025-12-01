#!/bin/bash

# Complete Test Suite Runner for 17 @ Peppertree
# Runs both frontend and backend tests with coverage reporting

set -e  # Exit on any error

echo "🧪 Running Complete Test Suite for 17 @ Peppertree"
echo "=================================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

if ! command_exists python3; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ All prerequisites found."
echo ""

# Frontend Tests
echo "🌐 Running Frontend Tests..."
echo "=============================="

echo "📦 Installing frontend dependencies..."
npm install

echo "🧪 Running frontend unit tests..."
npm run test:coverage

echo "✅ Frontend tests completed!"
echo ""

# Backend Tests
echo "🔧 Running Backend Tests..."
echo "==========================="

cd backend

echo "📦 Setting up backend environment..."
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

echo "🧪 Running backend tests..."
python -m pytest -v --cov=. --cov-report=term-missing --cov-report=html --cov-report=xml

deactivate
cd ..

echo "✅ Backend tests completed!"
echo ""

# Summary
echo "📊 Test Results Summary"
echo "======================"
echo "✅ Frontend tests: Completed with coverage report"
echo "✅ Backend tests: Completed with coverage report"
echo ""
echo "📁 Coverage Reports Generated:"
echo "   Frontend:"
echo "   - Terminal: Displayed above"
echo "   - HTML: coverage/lcov-report/index.html"
echo "   Backend:"
echo "   - Terminal: Displayed above"
echo "   - HTML: backend/htmlcov/index.html"
echo "   - XML: backend/coverage.xml"
echo ""
echo "🎉 All tests completed successfully!"
echo ""
echo "💡 Tips:"
echo "   - Run 'npm test' for interactive frontend testing"
echo "   - Run 'npm run test:watch' for frontend watch mode"
echo "   - Run 'backend/test_runner.sh' for backend tests only"
echo "   - Check coverage reports in your browser"