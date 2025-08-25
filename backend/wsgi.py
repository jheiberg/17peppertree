#!/usr/bin/env python3
"""
WSGI entry point for 17 @ Peppertree Flask application
"""
import os
import sys

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app import app

# WSGI callable
application = app

if __name__ == "__main__":
    application.run()