from flask import Blueprint, request, jsonify
from flask_cors import CORS
from datetime import datetime
import pipeline
from bson import ObjectId

# importing database collections from app
from database import users_collection
from database import user_logs_collection
from database import questions_collection
from database import feedback_collection
from database import issues_collection

# Flask Blueprint
users_bp = Blueprint("users", __name__)
CORS(users_bp)

session = {}

@users_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")

    if not email.endswith("@psgtech.ac.in"):
        return jsonify({"error": "Only Official emails are allowed"}), 403

    uid = email.split("@")[0]
    existing_user = users_collection.find_one({'email': email, "role": "user"})

    try:
        if existing_user:
            last_feedback = existing_user.get('last_feedback')
            if last_feedback:
                # Ensure last_feedback is a datetime object
                day_since_feedback = (datetime.utcnow() - last_feedback).days
                if day_since_feedback < 30:
                    return jsonify({
                        "error": "Feedback already submitted",
                        "message": f"Please wait {30 - day_since_feedback} days before submitting new feedback."
                    }), 403
            # Update last login time
            users_collection.update_one({"email": email},
                                         {"$set": {"last_login": datetime.utcnow()}})
        else:
            # Create a new user entry
            user_data = {
                "email": email,
                "roll_no": uid.lower(),
                "last_feedback": None,  # Initialize last_feedback
                "last_login": datetime.utcnow(),
                "role":"user"
            }
            users_collection.insert_one(user_data)
    except Exception as e:
        print(f"[-] Error: {e} : {uid} : user/login/login section")

    # Log user login
    try:
        log_entry = {"roll_no": uid, "date": datetime.utcnow()}
        user_logs_collection.insert_one(log_entry)
    except Exception as e:
        print(f"[-] Error: {e} : {uid} : in user/login/logs section")

    session["email"] = email
    session['roll_no'] = uid

    return jsonify({"message": "Login successful", "email": email})


@users_bp.route("/check_session", methods=["GET"])
def check_session():
    if "email" in session:
        return jsonify({"logged_in": True, "email": session["email"]})
    else:
        return jsonify({"logged_in": False}), 401


@users_bp.route("/get_feedback_questions", methods=["GET"])
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

@users_bp.route("/submit_feedback", methods=["POST"])
def submit_feedback():
    if "email" not in session:
        return jsonify({"error": "Unauthorized"}), 403

    email = session["email"]
    uid = session["roll_no"]
    feedback_data = request.json.get("feedback")
    start_time = request.json.get("start_time")  # This should be a timestamp

    print(feedback_data)
    print("Last question and answer: ",feedback_data[-1]['answer'])

    if uid[0].isdigit():
        user_score, priority = pipeline.calculate_feedback_score(uid.upper())
    else:
        # it should check the staff ID with the email address
        # as of now for staff we can give score as 1.0
        user_score, priority = 1.0, 'high'
    label, confidence = pipeline.classify_feedback(feedback_data[-1]['answer'])

    # TODO: classify the issue


    # Convert start_time from seconds to a datetime object
    start_time = datetime.utcfromtimestamp(start_time)

    # Record the submission time
    submission_time = datetime.utcnow()
    time_taken = (submission_time - start_time).total_seconds()


    issue_presence = False
    if label == 'ISSUE':
        issue_presence = True
        category = pipeline.classify_issues(feedback_data[-1]['answer'])
        issue_entry = {
            "_id": ObjectId(),  # Automatically generate a unique ObjectId
            "raised_by": email,
            "issue_raise_date": submission_time,
            "user_score": user_score,
            "issue": feedback_data[-1]['answer'],
            "status": "PENDING",
            "category":category,
            "resolved_date": ""
        }
        issues_collection.insert_one(issue_entry)

        # TODO: send a mail when an issue is raised


    # Insert feedback into the feedback collection
    feedback_entry = {
        "_id":ObjectId(),
        "email": email,
        "roll_no": uid,
        "feedback_answers": feedback_data,
        "date": submission_time,
        "feedback_time_taken": time_taken,
        "floor_no":3,
        "issue_presence":issue_presence
    }

    feedback_collection.insert_one(feedback_entry)
    # send thank you mail
    pipeline.send_tks_mail(email,uid)

    # Update user collection with last feedback time
    users_collection.update_one(
        {"email": email},
        {"$set": {
            "last_feedback": submission_time
        }}
    )

    return jsonify({"message": "Feedback submitted successfully", "time_taken": time_taken}), 200
    


# TODO: create some loading or submission in process page while feedback submission







@users_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("email", None)
    session.pop("roll_no",None)
    return jsonify({"message": "Logged out successfully"})

