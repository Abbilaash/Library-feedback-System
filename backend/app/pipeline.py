# import needed libraries
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from database import library_db
import os
import smtplib
from dotenv import load_dotenv
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import json
import re
from pathlib import Path
from collections import defaultdict

load_dotenv()

print("pipeline imported")

# function to score users
def calculate_feedback_score(roll_number, df=library_db):
    """
    Calculate feedback trust score (0-1) where:
    - 'Check in' = Lending (user takes book)
    - 'Check out' = Returning (user brings book back)
    - Negative 'Amount' = Fine payment (e.g., -40.00 = ₹40 fine)
    """
    # Auto-accept faculty (cards starting with 'C')
    if str(roll_number).startswith('C'):
        return 1.0, 'high'
    
    df['Date'] = pd.to_datetime(df['Date'])
    
    student_data = df[df['Card number'] == roll_number]
    if student_data.empty:
        return 0.0, 'low'
    
    today = pd.Timestamp.now()
    last_15_days = today - timedelta(days=15)
    
    # Calculate metrics
    metrics = {
        'recent_lends': len(student_data[(student_data['Date'] >= last_15_days) & 
                                      (student_data['Transaction'] == 'Check in')]),
        'total_lends': len(student_data[student_data['Transaction'] == 'Check in']),
        'returns': len(student_data[student_data['Transaction'] == 'Check out']),
        'avg_fine': abs(student_data[student_data['Transaction'] == 'Payment']['Amount']
                       .astype(float).mean() or 0),
        'days_inactive': (today - student_data['Date'].max()).days
    }
    
    # Normalize scores (0-1 range)
    scores = {
        'activity': min(metrics['recent_lends'] / 4, 1.0),  # 4+ recent lends = 1.0
        'engagement': min(metrics['total_lends'] / 10, 1.0), # 10+ total lends = 1.0
        'responsibility': metrics['returns'] / metrics['total_lends'] if metrics['total_lends'] > 0 else 0,
        'financial': max(0, 1 - metrics['avg_fine'] / 200), # ₹200 = 0 score
        'recency': np.exp(-0.05 * metrics['days_inactive']) # 5% daily decay
    }
    
    # Weighted average
    weights = {
        'activity': 0.10,  # Recent usage
        'engagement': 0.50, # Historical usage
        'responsibility': 0.20, # Return behavior
        'financial': 0.10, # Fine payments
        'recency': 0.10     # Account activity
    }
    
    final_score = sum(scores[k] * weights[k] for k in weights)
    
    # Priority tiers
    if final_score >= 0.7:
        return round(final_score, 2), 'high'
    elif final_score >= 0.4:
        return round(final_score, 2), 'medium'
    else:
        return round(final_score, 2), 'low'

'''score, priority = calculate_feedback_score("23N201", library_db)
print(f"Score: {score}/1.0 ({priority.upper()} priority)")
'''


def classify_feedback(text):
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    # Load locally saved model and tokenizer
    model_path = "local_model"
    _classifier = pipeline(
        "text-classification",
        model=AutoModelForSequenceClassification.from_pretrained(model_path),
        tokenizer=AutoTokenizer.from_pretrained(model_path),
        top_k=None
    )

    _issue_keywords = {
        'problem', 'issue', 'error', 'fix', 'broken',
        'not working', 'improve', 'complaint', 'fail'
    }
    """
    Classifies the input feedback text into ISSUE, COMPLIMENT, or NEUTRAL.
    
    Args:
        text (str): The feedback message.

    Returns:
        Tuple[str, float]: Classification label and confidence score.
    """
    result = _classifier(text)[0]
    sentiment = max(result, key=lambda x: x['score'])

    text_lower = text.lower()
    is_issue = (
        any(keyword in text_lower for keyword in _issue_keywords) or
        sentiment['label'] == 'NEGATIVE'
    )

    if is_issue:
        return "ISSUE", sentiment['score']
    elif sentiment['label'] == 'POSITIVE':
        return "COMPLIMENT", sentiment['score']
    else:
        return "NEUTRAL", sentiment['score']
    
#label, confidence = classify_feedback("The library wifi is very slow and often disconnects")



def get_feedback_email_template(user_name="User"):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>GRD Library Feedback</title>
      <style>
        body {{
          background-color: #f4f6f8;
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }}
        .container {{
          max-width: 600px;
          margin: 30px auto;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.05);
          padding: 30px;
          text-align: center;
        }}
        .header {{
          background-color: #007bff;
          padding: 20px;
          border-radius: 10px 10px 0 0;
          color: white;
          font-size: 24px;
          font-weight: bold;
        }}
        .content {{
          padding: 20px;
          font-size: 16px;
          color: #333;
        }}
        .footer {{
          margin-top: 30px;
          font-size: 14px;
          color: #aaa;
        }}
        .button {{
          display: inline-block;
          margin-top: 20px;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border-radius: 5px;
          text-decoration: none;
          font-weight: bold;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">GRD Library Feedback System</div>
        <div class="content">
          <p>Dear {user_name},</p>
          <p>Thank you for your valuable feedback. We appreciate your effort in helping us improve our services and facilities.</p>
          <p>Our team has received your input and will look into it with utmost care.</p>
          <a href="https://library.psgtech.ac.in" class="button">Visit Library Portal</a>
        </div>
        <div class="footer">
          &copy; {datetime.now().year} GRD Library. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

# function to send mail to users regarding issue raise
def send_tks_mail(receiver_email, user_name):
    msg = MIMEMultipart("alternative")
    msg['Subject'] = "Thank You for Your Feedback – GRD Library"
    msg['From'] = os.getenv("GMAIL_ID")
    msg['To'] = receiver_email
    html_content = get_feedback_email_template(user_name)
    mime_html = MIMEText(html_content, "html")
    msg.attach(mime_html)
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(os.getenv("GMAIL_ID"), os.getenv("GMAIL_PASSWORD"))
        server.sendmail(os.getenv("GMAIL_ID"), receiver_email, msg.as_string())

def classify_issues(issue, config_file="dataset/categories.json"):
    """
    Classifies a single issue string into one or more categories based on keywords.
    Returns the best-matched category or 'Other Issues'.
    """
    # Load category configuration
    try:
        with open(config_file) as f:
            config = json.load(f)
        categories = config["categories"]
        misc_cat = config["misc_category"]
    except Exception as e:
        raise ValueError(f"Error loading {config_file}: {str(e)}")

    # Prepare category match dictionary
    match_scores = defaultdict(int)
    issue_lower = issue.lower()

    for cat in categories:
        for kw in cat["keywords"]:
            if kw.lower() in issue_lower:
                match_scores[cat["name"]] += 1

    if not match_scores:
        return misc_cat["name"]

    # Select the category with the highest match count
    best_category = max(match_scores.items(), key=lambda x: x[1])[0]
    return best_category

def get_suspend_email_template(user_name="User"):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Issue Suspended</title>
      <style>
        body {{
          background-color: #f4f6f8;
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }}
        .container {{
          max-width: 600px;
          margin: 30px auto;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.05);
          padding: 30px;
          text-align: center;
        }}
        .header {{
          background-color: #ffcc00;
          padding: 20px;
          border-radius: 10px 10px 0 0;
          color: black;
          font-size: 24px;
          font-weight: bold;
        }}
        .content {{
          padding: 20px;
          font-size: 16px;
          color: #333;
        }}
        .footer {{
          margin-top: 30px;
          font-size: 14px;
          color: #aaa;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Issue Suspended</div>
        <div class="content">
          <p>Dear {user_name},</p>
          <p>Your issue has been suspended. Please check back later for updates.</p>
        </div>
        <div class="footer">
          &copy; {datetime.now().year} GRD Library. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

def get_resolved_email_template(user_name="User"):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Issue Resolved</title>
      <style>
        body {{
          background-color: #f4f6f8;
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }}
        .container {{
          max-width: 600px;
          margin: 30px auto;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.05);
          padding: 30px;
          text-align: center;
        }}
        .header {{
          background-color: #28a745;
          padding: 20px;
          border-radius: 10px 10px 0 0;
          color: white;
          font-size: 24px;
          font-weight: bold;
        }}
        .content {{
          padding: 20px;
          font-size: 16px;
          color: #333;
        }}
        .footer {{
          margin-top: 30px;
          font-size: 14px;
          color: #aaa;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Issue Resolved</div>
        <div class="content">
          <p>Dear {user_name},</p>
          <p>Your issue has been successfully resolved. Thank you for your patience!</p>
        </div>
        <div class="footer">
          &copy; {datetime.now().year} GRD Library. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

def get_pending_email_template(user_name="User"):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Issue Pending</title>
      <style>
        body {{
          background-color: #f4f6f8;
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }}
        .container {{
          max-width: 600px;
          margin: 30px auto;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.05);
          padding: 30px;
          text-align: center;
        }}
        .header {{
          background-color: #ffc107;
          padding: 20px;
          border-radius: 10px 10px 0 0;
          color: black;
          font-size: 24px;
          font-weight: bold;
        }}
        .content {{
          padding: 20px;
          font-size: 16px;
          color: #333;
        }}
        .footer {{
          margin-top: 30px;
          font-size: 14px;
          color: #aaa;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Issue Pending</div>
        <div class="content">
          <p>Dear {user_name},</p>
          <p>Your issue is currently pending. We will update you as soon as possible.</p>
        </div>
        <div class="footer">
          &copy; {datetime.now().year} GRD Library. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """


def issue_close_mail(task, receiver_email, user_name):
    msg = MIMEMultipart("alternative")
    msg['From'] = os.getenv("GMAIL_ID")
    msg['To'] = receiver_email

    if task == "RESOLVED":
        msg['Subject'] = "Your Issue Has Been Resolved"
        html_content = get_resolved_email_template(user_name)
    elif task == "SUSPENDED":
        msg['Subject'] = "Your Issue Has Been Suspended"
        html_content = get_suspend_email_template(user_name)
    elif task == "PENDING":
        msg['Subject'] = "Your Issue Is Pending"
        html_content = get_pending_email_template(user_name)
    else:
        return  # Invalid task

    mime_html = MIMEText(html_content, "html")
    msg.attach(mime_html)

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(os.getenv("GMAIL_ID"), os.getenv("GMAIL_PASSWORD"))
        server.sendmail(os.getenv("GMAIL_ID"), receiver_email, msg.as_string())




