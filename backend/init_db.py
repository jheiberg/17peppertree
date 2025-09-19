"""
Database initialization script for Docker environment
"""
import time
import sys
from flask import Flask
from database import DatabaseManager, db
from migrations import run_migrations
import os

def wait_for_db():
    """Wait for database to be ready"""
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Simple test connection
            import psycopg2
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST', 'db'),
                port=os.getenv('DB_PORT', '5432'),
                database=os.getenv('DB_NAME', 'peppertree'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', 'password')
            )
            conn.close()
            print("Database is ready!")
            return True
        except Exception as e:
            retry_count += 1
            print(f"Waiting for database... ({retry_count}/{max_retries})")
            time.sleep(2)
    
    print("Database is not ready after maximum retries")
    return False

def init_database():
    """Initialize database with tables and triggers"""
    app = Flask(__name__)
    DatabaseManager.configure_database(app)
    DatabaseManager.initialize_database(app)
    
    with app.app_context():
        print("Creating database tables and triggers...")
        run_migrations()
        print("Database initialization completed")

if __name__ == "__main__":
    if wait_for_db():
        init_database()
    else:
        sys.exit(1)