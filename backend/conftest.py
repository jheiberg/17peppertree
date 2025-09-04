import pytest
import os
import tempfile
from app import app
from database import db, DatabaseManager

@pytest.fixture(scope='session')
def test_app():
    """Create application for testing"""
    # Create a temporary file for the test database
    db_fd, db_path = tempfile.mkstemp()
    
    # Configure test settings
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SECRET_KEY': 'test-secret-key',
        'WTF_CSRF_ENABLED': False,
        'MAIL_SUPPRESS_SEND': True,
        'MAIL_DEFAULT_SENDER': 'test@example.com',
    })
    
    # Create application context
    with app.app_context():
        DatabaseManager.create_tables()
        yield app
        
    # Clean up
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(test_app):
    """Flask test client"""
    return test_app.test_client()

@pytest.fixture
def app_context(test_app):
    """Application context for database operations"""
    with test_app.app_context():
        yield test_app

@pytest.fixture
def clean_db(app_context):
    """Clean database state for each test"""
    # Clean up any existing data
    db.drop_all()
    db.create_all()
    yield db
    # Clean up after test
    db.session.rollback()