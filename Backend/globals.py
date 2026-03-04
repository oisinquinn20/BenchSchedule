import os
from pymongo import MongoClient

secret_key = os.getenv("SECRET_KEY", "dev-only-change-me")

mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
db_name = os.getenv("DB_NAME", "benchschedule")

client = MongoClient(mongo_uri)
db = client[db_name]
