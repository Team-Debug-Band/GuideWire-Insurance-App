import sys
import os
import uuid
from pathlib import Path

# Add apps/backend to sys.path
backend_path = Path(__file__).parent
sys.path.append(str(backend_path))

from sqlalchemy.orm import Session
from core.db import SessionLocal, engine, Base
from models.models import Worker, PlatformAccount, PlatformType, PersonaType
from core.security import get_password_hash

def seed_data():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Add Admin User
        admin_email = "admin@surely.ai"
        admin = db.query(Worker).filter(Worker.email == admin_email).first()
        if not admin:
            admin = Worker(
                id=uuid.uuid4(),
                name="System Admin",
                email=admin_email,
                hashed_password=get_password_hash("admin123"),
                role="ADMIN",
                city="Bangalore"
            )
            db.add(admin)
            print(f"Created admin user: {admin_email}")
        else:
            print(f"Admin user {admin_email} already exists.")

        # 2. Add Sample Worker User
        worker_email = "worker@surely.ai"
        worker = db.query(Worker).filter(Worker.email == worker_email).first()
        if not worker:
            worker = Worker(
                id=uuid.uuid4(),
                name="Rahul Kumar",
                email=worker_email,
                hashed_password=get_password_hash("worker123"),
                role="WORKER",
                city="Chennai",
                primary_zone="T Nagar",
                persona_type=PersonaType.FOOD
            )
            db.add(worker)
            db.flush() # Get ID
            
            # Add some platforms for the worker
            p1 = PlatformAccount(
                worker_id=worker.id,
                platform_type=PlatformType.SWIGGY,
                avg_weekly_hours=35.0,
                avg_weekly_earnings=4500.00
            )
            p2 = PlatformAccount(
                worker_id=worker.id,
                platform_type=PlatformType.ZOMATO,
                avg_weekly_hours=15.0,
                avg_weekly_earnings=2000.00
            )
            db.add_all([p1, p2])
            print(f"Created worker user: {worker_email} with 2 platforms.")
        else:
            print(f"Worker user {worker_email} already exists.")

        db.commit()
        print("Seeding complete successfully.")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
