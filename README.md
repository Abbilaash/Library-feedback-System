# library-feedback-system
This project represents the alpha version of the Library Feedback System developed for the GRD Memorial Library at PSG College of Technology. It utilizes lending history data comprising 21,155 transactions recorded between February 1, 2025, and April 1, 2025.

## Tech Stack
- Frontend: React.js, CSS
- Backend: Flask (Python3), Transformer based pre-trained text-classification model
- Database: MongoDB (NoSQL)

## Database Relational Diagram
![relational diagram drawio (6)](https://github.com/user-attachments/assets/36b8a667-5ac3-4387-9477-56dbe349dd4a)

## Project Setup
### Backend setup
1. Get into the Directory
```cd backend```
2. Install requirements
```pip install -r requirements.txt```
3. Setup environment variables in ```.env``` file
```cd app```
Create a file named .env and fill the following code
```
FLASK_SECRET_KEY = "<Flask server secret key>"
MONGO_URI = "<Mongo DB connection string>"
GMAIL_ID = "<gmail id>"
GMAIL_PASSWORD = "<google account developer password>"
```
4. The student data has to be stored in ```/backend/app``` with filename as ```library-book-lend-history.csv```
### Frontend setup
1. Get into the Directory
```cd frontend/frontend```\
2. Install requirements
```npm install```
3. Start frontend React.js server
```npm start```

## Admin Panel
![image](https://github.com/user-attachments/assets/2594bef6-525b-4898-b5d9-524c06d8eda0)
![image](https://github.com/user-attachments/assets/95fbbf94-d74d-4ba9-9f02-026fa10ea7dd)
![image](https://github.com/user-attachments/assets/f3bb148f-db9f-4054-82b8-2e4c3f3fc743)

## User side
![image](https://github.com/user-attachments/assets/18514f23-2b77-4bd7-9855-182fdd08481f)
![image](https://github.com/user-attachments/assets/064fafd2-f4d8-4369-a0ce-861dfda78f2b)

