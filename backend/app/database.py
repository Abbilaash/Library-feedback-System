from pymongo import MongoClient
import os
import dotenv
import pandas as pd

dotenv.load_dotenv()

# MongoDB Connection
try:
    mongo_client = MongoClient(os.getenv("MONGO_URI"))
    db = mongo_client.get_database("database")
except Exception as e:
    print(f"[-] Database conneciton error: {e}")

# Collections
users_collection = db.users
user_logs_collection = db.logs
feedback_collection = db.feedback
questions_collection = db.questions
issues_collection = db.issues

library_db = pd.read_csv("library-book-lend-history.csv")


