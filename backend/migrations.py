"""
Database migrations and utility functions
"""
from database import db
from sqlalchemy import text


def create_updated_at_trigger():
    """Create trigger to automatically update updated_at column"""
    try:
        # Create trigger function
        trigger_function = """
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        """
        
        # Create trigger for booking_requests table
        trigger_sql = """
        DROP TRIGGER IF EXISTS update_booking_requests_updated_at ON booking_requests;
        CREATE TRIGGER update_booking_requests_updated_at
            BEFORE UPDATE ON booking_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """
        
        # Execute the SQL
        db.session.execute(text(trigger_function))
        db.session.execute(text(trigger_sql))
        db.session.commit()
        
        print("Successfully created updated_at trigger")
        return True
        
    except Exception as e:
        print(f"Error creating trigger: {e}")
        db.session.rollback()
        return False


def run_migrations():
    """Run all database migrations"""
    print("Running database migrations...")
    
    # Create tables if they don't exist
    db.create_all()
    print("Tables created/verified")
    
    # Create triggers
    create_updated_at_trigger()
    
    print("Migrations completed")


if __name__ == "__main__":
    from app import app
    with app.app_context():
        run_migrations()