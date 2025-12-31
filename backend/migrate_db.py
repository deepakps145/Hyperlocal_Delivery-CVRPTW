"""
Database migration script to add order grouping fields.
Run this script after updating models.py to add new columns to existing database.
"""
from sqlalchemy import text
from database import engine

def migrate():
    print("Starting database migration...")
    
    with engine.connect() as connection:
        # Start transaction
        trans = connection.begin()
        
        try:
            # Add columns to orders table
            print("Adding columns to orders table...")
            
            # Add delivery_time_start column
            connection.execute(text("""
                ALTER TABLE orders 
                ADD COLUMN IF NOT EXISTS delivery_time_start TIMESTAMP
            """))
            
            # Add delivery_time_end column
            connection.execute(text("""
                ALTER TABLE orders 
                ADD COLUMN IF NOT EXISTS delivery_time_end TIMESTAMP
            """))
            
            # Add priority column (1=high, 2=medium, 3=low)
            connection.execute(text("""
                ALTER TABLE orders 
                ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 2
            """))
            
            # Add weight column (in kg)
            connection.execute(text("""
                ALTER TABLE orders 
                ADD COLUMN IF NOT EXISTS weight FLOAT DEFAULT 1.0
            """))
            
            # Add capacity column to users table
            print("Adding capacity column to users table...")
            connection.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS capacity FLOAT DEFAULT 10.0
            """))
            
            # Commit transaction
            trans.commit()
            print("Migration completed successfully!")
            
        except Exception as e:
            # Rollback on error
            trans.rollback()
            print(f"Migration failed: {e}")
            raise

if __name__ == "__main__":
    migrate()
