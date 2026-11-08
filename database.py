import os
from sqlalchemy import create_engine #connect python code to database
from sqlalchemy.ext.declarative import declarative_base #architecture of database (Python class to database table)
from sqlalchemy.orm import sessionmaker #sessionmaker is a factory for creating new Session objects, which are used to interact with the database. 
from dotenv import load_dotenv

load_dotenv() #directory .env

DATABASE_URL= os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()