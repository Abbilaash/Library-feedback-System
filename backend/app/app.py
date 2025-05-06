from flask import Flask, session
from users import users_bp
from admin import admin_bp
import dotenv
import os

dotenv.load_dotenv()

# Initialize Flask App
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")
app.config["SESSION_TYPE"] = "filesystem"

# Register Blueprints
app.register_blueprint(users_bp, url_prefix="/users")
app.register_blueprint(admin_bp, url_prefix="/admin")

# Run the app
if __name__ == "__main__":
    app.run(debug=True)