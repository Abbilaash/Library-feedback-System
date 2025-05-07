from flask import Blueprint, request, jsonify, redirect, session, url_for
import hashlib
import requests
import datetime
from flask_cors import CORS
from bson import ObjectId
import os

# importing database collections from app
from database import users_collection
from database import user_logs_collection
from database import feedback_collection
from database import questions_collection
from database import issues_collection
from pipeline import issue_close_mail  # Import the email function

# Flask Blueprint
admin_bp = Blueprint("admin", __name__)
CORS(admin_bp)

session = {}


@admin_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    # Validate input
    if not username or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    # Hash the password before comparing
    # hashed_password = hashlib.sha256(password.encode()).hexdigest()

    existing_admin = users_collection.find_one({
        'username': username,
        'role': 'admin',
        'password': password
    })

    if not existing_admin:
        return jsonify({
            "error": "Invalid credentials or admin account does not exist"
        }), 401

    users_collection.update_one(
        {"username":username.lower()},
        {"$set": {
            'last_login':datetime.datetime.utcnow()
        }}
    )

    session["username"] = username
    session["role"] = "admin"
    session["admin_id"] = str(existing_admin.get('_id'))

    return jsonify({"message": "Login successful","email": username})


@admin_bp.route("/check_session", methods=["GET"])
def check_session():
    if "username" in session:
        return jsonify({"logged_in": True, "username": session["username"]})
    else:
        return jsonify({"logged_in": False}), 401


@admin_bp.route("/feedback_count", methods=["GET"])
def feedback_count():
    days = int(request.args.get("days", 5))
    now = datetime.datetime.utcnow()
    start_date = now - datetime.timedelta(days=days)

    # Get feedback count for the last 5 days
    feedback_counts = feedback_collection.aggregate([
        {"$match": {"date": {"$gte": start_date}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}},
                "feedback_count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}  # Sort by date
    ])

    # Prepare the response
    response = {str((now - datetime.timedelta(days=i)).date()): 0 for i in range(days)}  # Initialize counts for the last 5 days
    for count in feedback_counts:
        response[count["_id"]] = count["feedback_count"]

    return jsonify(response), 200


@admin_bp.route("/login_count", methods=["GET"])
def login_count():
    days = int(request.args.get("days", 5))
    now = datetime.datetime.utcnow()
    start_date = now - datetime.timedelta(days=days)

    # Get login count for the specified number of days
    login_counts = user_logs_collection.aggregate([
        {"$match": {"date": {"$gte": start_date}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}},
                "login_count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}  # Sort by date
    ])

    # Prepare the response
    response = {str((now - datetime.timedelta(days=i)).date()): 0 for i in range(days)}  # Initialize counts for the last 'days' days
    for count in login_counts:
        response[count["_id"]] = count["login_count"]

    print(response)  # Debug print to see the response structure
    return jsonify(response), 200


# route to calculate and get feedback rate for past n days

# route to calculate the floor wise feedback trend (as of now only floor 3)

@admin_bp.route("/feedback_rate/<int:days>", methods=["GET"])
def feedback_rate(days):
    now = datetime.datetime.utcnow()
    start_date = now - datetime.timedelta(days=days)

    # Calculate feedback rate
    total_feedback = feedback_collection.count_documents({"date": {"$gte": start_date}})
    feedback_rate = total_feedback / days if days > 0 else 0

    return jsonify({"rate": feedback_rate}), 200

@admin_bp.route("/login_rate/<int:days>", methods=["GET"])
def login_rate(days):
    now = datetime.datetime.utcnow()
    start_date = now - datetime.timedelta(days=days)

    # Calculate login rate
    total_logins = user_logs_collection.count_documents({"date": {"$gte": start_date}})
    login_rate = total_logins / days if days > 0 else 0

    return jsonify({"rate": login_rate}), 200




@admin_bp.route("/get_feedback_questions", methods=["GET"])
def get_feedback_questions():
    questions = questions_collection.find({}, {"_id": 1, "question": 1, "options": 1})
    feedback_questions = []
    for question in questions:
        if "question" in question and "options" in question:
            feedback_questions.append({
                "id": str(question["_id"]),
                "question": question["question"],
                "options": question["options"]
            })
        else:
            print(f"Missing keys in question document: {question}")

    return jsonify(feedback_questions), 200

@admin_bp.route("/add_feedback_questions", methods=["POST"])
def add_feedback_questions():
    data = request.json
    question = data.get("question")
    options = data.get("options")  # Expecting an array of options
    include_other = data.get("include_other", False)  # Check if "Other" option is included

    if not question or not options or len(options) < 2:  # At least 2 options required
        return jsonify({"error": "Question and at least 2 options are required."}), 400

    # If "Other" is included, ensure it's added to the options
    if include_other:
        options.append("Other")

    questions_collection.insert_one({
        "question": question,
        "options": options
    })

    return jsonify({"message": "Feedback question added successfully."}), 201

@admin_bp.route("/delete_feedback_question/<question_id>", methods=["DELETE"])
def delete_feedback_question(question_id):
    try:
        question_id = ObjectId(question_id)
    except Exception as e:
        return jsonify({"error": "Invalid question ID format."}), 400
    
    result = questions_collection.delete_one({"_id": question_id})

    if result.deleted_count == 0:
        return jsonify({"error": "Question not found."}), 404

    return jsonify({"message": "Feedback question deleted successfully."}), 200


@admin_bp.route("/change_password", methods=["POST"])
def change_password():
    data = request.json
    username = data.get("username")
    new_password = data.get("new_password")

    if not username or not new_password:
        return jsonify({"error": "Username and new password are required."}), 400

    # Update the password for the admin
    result = users_collection.update_one(
        {"username": username, "role": "admin"},
        {"$set": {"password": new_password}}
    )

    if result.modified_count == 0:
        return jsonify({"error": "Admin not found or password not changed."}), 404

    return jsonify({"message": "Password changed successfully."}), 200


@admin_bp.route("/add_admin", methods=["POST"])
def add_admin():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    # Check if the admin already exists
    existing_admin = users_collection.find_one({"username": username, "role": "admin"})
    if existing_admin:
        return jsonify({"error": "Admin already exists."}), 400

    # Insert new admin
    users_collection.insert_one({
        "username": username,
        "password": password,
        "role": "admin",
        "last_login": None
    })

    return jsonify({"message": "Admin added successfully."}), 201


@admin_bp.route("/view_last_logins", methods=["GET"])
def view_last_logins():
    admins = users_collection.find({"role": "admin"}, {"username": 1, "last_login": 1})
    admin_logins = [{"username": admin["username"], "last_login": admin.get("last_login")} for admin in admins]
    return jsonify(admin_logins), 200


@admin_bp.route("/delete_admin/<username>", methods=["DELETE"])
def delete_admin(username):
    result = users_collection.delete_one({"username": username, "role": "admin"})

    if result.deleted_count == 0:
        return jsonify({"error": "Admin not found."}), 404

    return jsonify({"message": "Admin deleted successfully."}), 200


@admin_bp.route("/get_feedback_submissions", methods=["GET"])
def get_feedback_submissions():
    # Route to fetch feedback submission from database and send to admin submissions page
    feedbacks = feedback_collection.find({}, {
        "_id": 0,  # Exclude the MongoDB ID from the response
        "email":1,
        "roll_no": 1,
        "feedback_answers": 1,
        "feedback_time_taken":1,
        "floor_no": 1,
        "date":1,
        "issue_presence":1
    })
    
    feedback_list = []
    for feedback in feedbacks:
        feedback_list.append({
            "email": feedback.get("email"),
            "roll_no": feedback.get("roll_no").upper(),
            "feedback_answers": feedback.get("feedback_answers"),
            "floor_no": feedback.get("floor_no"),
            "feedback_time_taken":feedback.get("feedback_time_taken"),
            "date": feedback.get("date"),
            "issue_presence":feedback.get("issue_presence")
        })
    print(feedback_list)

    return jsonify(feedback_list), 200


# route to search feedback according to the given conditions
@admin_bp.route("/search_feedback", methods=["GET"])
def search_feedback():
    query = request.args.get("query", "")
    filter_type = request.args.get("filter", "roll_no")  # Default filter type
    start_date = request.args.get("startDate")  # Get start date
    end_date = request.args.get("endDate")  # Get end date

    # Build the search filter based on the filter type
    filters = {}
    if filter_type == "roll_no":
        filters["roll_no"] = {"$regex": query, "$options": "i"}
    elif filter_type == "keyword":
        filters["feedback_answers.answer"] = {"$regex": query, "$options": "i"}
    else:
        return jsonify({"error": "Invalid filter type."}), 400

    # Add date filtering if provided
    if start_date:
        filters["date"] = {"$gte": start_date}
    if end_date:
        filters["date"] = {"$lte": end_date}

    feedbacks = feedback_collection.find(filters)

    feedback_list = []
    for feedback in feedbacks:
        feedback_list.append({
            "email": feedback.get("email"),
            "roll_no": feedback.get("roll_no"),
            "feedback_answers": feedback.get("feedback_answers"),
            "feedback_time_taken": feedback.get("feedback_time_taken"),
            "floor_no": feedback.get("floor_no"),
            "date": feedback.get("date"),
        })

    return jsonify(feedback_list), 200

@admin_bp.route("/get_issues", methods=["GET"])
def get_issues():
    issues = issues_collection.find({}, {
        "_id": 1,
        "raised_by": 1,
        "issue_raise_date": 1,
        "status": 1,
        "resolved_date":1,
        "issue":1
    })

    print(issues)
    
    issue_list = []
    for issue in issues:
        issue_list.append({
            "_id":str(issue.get("_id")),
            "raised_by": issue.get("raised_by"),
            "issue":issue.get("issue"),
            "issue_raise_date": issue.get("issue_raise_date"),
            "status": issue.get("status"),
            "resolved_date":issue.get("resolved_date")
        })

    return jsonify(issue_list), 200

@admin_bp.route("/get_issue_counts", methods=["GET"])
def get_issue_counts():
    total_issues = issues_collection.count_documents({})
    resolved_issues = issues_collection.count_documents({"status": "RESOLVED"})
    pending_issues = issues_collection.count_documents({"status": "PENDING"})

    return jsonify({
        "total": total_issues,
        "resolved": resolved_issues,
        "pending": pending_issues
    }), 200

@admin_bp.route("/get_issue_categories", methods=["GET"])
def get_issue_categories():
    # Aggregate issues by category
    category_counts = issues_collection.aggregate([
        {
            "$group": {
                "_id": "$category",  # Assuming 'category' is the field name for categories
                "count": {"$sum": 1}
            }
        },
        {
            "$match": {
                "count": {"$gt": 0}  # Only include categories with a count greater than 0
            }
        }
    ])

    # Prepare the response
    category_data = {str(category["_id"]): category["count"] for category in category_counts}
    return jsonify(category_data), 200

@admin_bp.route("/resolve_issue/<issue_id>", methods=["PUT"])
def resolve_issue(issue_id):
    # Fetch the issue to get the user's email
    issue = issues_collection.find_one({"_id": ObjectId(issue_id)})
    if not issue:
        return jsonify({"error": "Issue not found."}), 404

    user_email = issue.get("raised_by")  # Assuming the user's email is stored in the issue document
    user_name = issue.get("raised_by")  # Assuming the name of the user is stored in the issue document

    result = issues_collection.update_one(
        {"_id": ObjectId(issue_id)},
        {"$set": {"status": "RESOLVED"}}
    )
    if result.modified_count == 0:
        return jsonify({"error": "Issue not found or status not changed."}), 404

    # Send email notification
    issue_close_mail("RESOLVED", user_email, user_name)

    return jsonify({"message": "Issue status updated to RESOLVED."}), 200

@admin_bp.route("/suspend_issue/<issue_id>", methods=["PUT"])
def suspend_issue(issue_id):
    # Fetch the issue to get the user's email
    issue = issues_collection.find_one({"_id": ObjectId(issue_id)})
    if not issue:
        return jsonify({"error": "Issue not found."}), 404

    # Get the user's email from the issue document
    user_email = issue.get("raised_by")  # Assuming the user's email is stored in the issue document
    user_name = issue.get("raised_by")  # Assuming the name of the user is stored in the issue document

    result = issues_collection.update_one(
        {"_id": ObjectId(issue_id)},
        {"$set": {"status": "SUSPENDED"}}
    )
    if result.modified_count == 0:
        return jsonify({"error": "Issue not found or status not changed."}), 404

    # Send email notification
    issue_close_mail("SUSPENDED", user_email, user_name)

    return jsonify({"message": "Issue status updated to SUSPENDED."}), 200

@admin_bp.route("/set_pending_issue/<issue_id>", methods=["PUT"])
def set_pending_issue(issue_id):
    # Fetch the issue to get the user's email
    issue = issues_collection.find_one({"_id": ObjectId(issue_id)})
    if not issue:
        return jsonify({"error": "Issue not found."}), 404

    # Get the user's email from the issue document
    user_email = issue.get("raised_by")  # Assuming the user's email is stored in the issue document
    user_name = issue.get("raised_by")  # Assuming the name of the user is stored in the issue document

    result = issues_collection.update_one(
        {"_id": ObjectId(issue_id)},
        {"$set": {"status": "PENDING"}}
    )
    if result.modified_count == 0:
        return jsonify({"error": "Issue not found or status not changed."}), 404

    # Send email notification
    issue_close_mail("PENDING", user_email, user_name)

    return jsonify({"message": "Issue status updated to PENDING."}), 200


@admin_bp.route("/filter_issues", methods=["GET"])
def filter_issues():
    status = request.args.get("status")
    category = request.args.get("category")
    query = request.args.get("query", "")

    filters = {}
    if status:
        filters["status"] = status
    if category:
        filters["category"] = category

    if query:
        filters["$or"] = [
            {"raised_by": {"$regex": query, "$options": "i"}},
            {"roll_no": {"$regex": query, "$options": "i"}}
        ]

    issues = issues_collection.find(filters)
    issue_list = []
    for issue in issues:
        issue_list.append({
            "_id": str(issue.get("_id")),
            "raised_by": issue.get("raised_by"),
            "issue": issue.get("issue"),
            "issue_raise_date": issue.get("issue_raise_date"),
            "status": issue.get("status"),
            "resolved_date": issue.get("resolved_date"),
            "category": issue.get("category")  # Assuming category is stored in the issue document
        })

    return jsonify(issue_list), 200













@admin_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("username", None)
    session.pop("role", None)
    session.pop("admin_id", None)
    return jsonify({"message": "Logged out successfully"})



