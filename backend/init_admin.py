import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from models import User, Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def ensure_admin_user():
    """Ensure admin user exists in database"""
    database_url = os.getenv("DATABASE_URL", "postgresql://picking:change_me@db:5432/picking")
    
    try:
        engine = create_engine(database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        if admin_user:
            logger.info("Admin user already exists")
            return True
            
        hashed_password = get_password_hash("admin123")
        admin_user = User(
            username="admin",
            password_hash=hashed_password,
            role="admin",
            warehouse_id=None
        )
        
        db.add(admin_user)
        db.commit()
        logger.info("Admin user created successfully")
        return True
        
    except Exception as e:
        logger.error(f"PostgreSQL connection failed: {e}")
        logger.info("Attempting SQLite fallback...")
        
        try:
            sqlite_url = "sqlite:///./picking.db"
            engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
            Base.metadata.create_all(bind=engine)
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            db = SessionLocal()
            
            admin_user = db.query(User).filter(User.username == "admin").first()
            
            if admin_user:
                logger.info("Admin user already exists in SQLite")
                return True
                
            hashed_password = get_password_hash("admin123")
            admin_user = User(
                username="admin",
                password_hash=hashed_password,
                role="admin",
                warehouse_id=None
            )
            
            db.add(admin_user)
            db.commit()
            logger.info("Admin user created successfully in SQLite")
            return True
            
        except Exception as sqlite_error:
            logger.error(f"SQLite fallback also failed: {sqlite_error}")
            return False
        finally:
            if 'db' in locals():
                db.close()
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    ensure_admin_user()
