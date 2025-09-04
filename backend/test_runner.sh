#!/bin/bash

# Backend Test Runner Script
# This script runs all backend tests with coverage reporting

set -e  # Exit on any error

echo "🧪 Running Backend Tests for 17 @ Peppertree"
echo "=============================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found. Creating one..."
    python3 -m venv venv
    echo "✅ Virtual environment created."
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run tests with coverage
echo "🧪 Running unit tests..."
python -m pytest test_models.py -v --cov=database --cov-report=term-missing

echo ""
echo "🌐 Running integration tests..."
python -m pytest test_api.py -v --cov=app --cov-report=term-missing

echo ""
echo "📊 Running all tests with full coverage report..."
python -m pytest -v --cov=. --cov-report=term-missing --cov-report=html --cov-report=xml

echo ""
echo "✅ Backend tests completed!"
echo "📁 Coverage reports generated:"
echo "   - Terminal: Displayed above"
echo "   - HTML: htmlcov/index.html"
echo "   - XML: coverage.xml"

# Deactivate virtual environment
deactivate

echo ""
echo "🎉 All backend tests finished successfully!"