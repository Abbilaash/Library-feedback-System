from flask import Flask, session, jsonify
from users import users_bp
from admin import admin_bp
import dotenv
import os
import logging

dotenv.load_dotenv()

# Initialize Flask App
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")
app.config["SESSION_TYPE"] = "filesystem"

# Set up logging
logging.basicConfig(
    level=logging.INFO,  # Set the logging level
    format='%(asctime)s - %(levelname)s - %(message)s',  # Log format
    handlers=[
        logging.FileHandler("app.log"),  # Log to a file
        logging.StreamHandler()  # Also log to console
    ]
)

# Register Blueprints
app.register_blueprint(users_bp, url_prefix="/users")
app.register_blueprint(admin_bp, url_prefix="/admin")

@app.errorhandler(Exception)
def handle_exception(e):
    logging.error(f"An error occurred: {str(e)}")
    return jsonify({"error": "An internal error occurred."}), 500

# Run the app
if __name__ == "__main__":
    app.run(debug=True)