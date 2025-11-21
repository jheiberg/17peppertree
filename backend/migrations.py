"""
Database migrations and utility functions
"""
from database import db
from sqlalchemy import text


def create_indexes():
    """Create database indexes for better performance"""
    try:
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_booking_requests_checkin ON booking_requests(checkin_date)",
            "CREATE INDEX IF NOT EXISTS idx_booking_requests_checkout ON booking_requests(checkout_date)",
            "CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status)",
            "CREATE INDEX IF NOT EXISTS idx_booking_requests_created_at ON booking_requests(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_booking_requests_email ON booking_requests(email)"
        ]
        
        for index_sql in indexes:
            db.session.execute(text(index_sql))
        
        db.session.commit()
        print("Successfully created indexes")
        return True
        
    except Exception as e:
        print(f"Error creating indexes: {e}")
        db.session.rollback()
        return False


def add_constraints():
    """Add check constraints to booking_requests table"""
    try:
        constraints = [
            """
            ALTER TABLE booking_requests 
            DROP CONSTRAINT IF EXISTS chk_guests_range;
            
            ALTER TABLE booking_requests 
            ADD CONSTRAINT chk_guests_range 
            CHECK (guests >= 1 AND guests <= 2)
            """,
            """
            ALTER TABLE booking_requests 
            DROP CONSTRAINT IF EXISTS chk_valid_dates;
            
            ALTER TABLE booking_requests 
            ADD CONSTRAINT chk_valid_dates 
            CHECK (checkout_date > checkin_date)
            """,
            """
            ALTER TABLE booking_requests 
            DROP CONSTRAINT IF EXISTS chk_valid_status;
            
            ALTER TABLE booking_requests 
            ADD CONSTRAINT chk_valid_status 
            CHECK (status IN ('pending', 'confirmed', 'rejected', 'approved', 'cancelled', 'completed', 'deleted'))
            """
        ]
        
        for constraint_sql in constraints:
            db.session.execute(text(constraint_sql))
        
        db.session.commit()
        print("Successfully added constraints")
        return True
        
    except Exception as e:
        print(f"Error adding constraints: {e}")
        db.session.rollback()
        return False


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
    
    # Create indexes for performance
    create_indexes()
    
    # Add constraints
    add_constraints()
    
    # Create triggers
    create_updated_at_trigger()
    
    print("Migrations completed")


if __name__ == "__main__":
    from app import app
    with app.app_context():
        run_migrations()