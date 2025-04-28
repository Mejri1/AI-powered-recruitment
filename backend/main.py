from flask import Flask, request, jsonify, session  # Add session import
from werkzeug.utils import secure_filename
from pdfminer.high_level import extract_text
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import psycopg2
import pandas as pd
import spacy
import nltk
import os
import re
import json
import numpy as np
import requests
import uuid  # Import for generating unique session IDs
# Load environment variables
load_dotenv()
from flask_cors import CORS
# Initialize NLP tools
#nltk.download("punkt")
#nltk.download("stopwords")
nlp = spacy.load("en_core_web_lg")

# Flask app setup
app = Flask(__name__)
CORS(app) 
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database connection details
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

# Load skills database
skills_df = pd.read_csv("skills.csv")
SKILLS_DB = set(skills_df['Skill'].str.lower().tolist())

# Utility functions
def clean_text(text):
    """
    Advanced text cleaning for semantic similarity tasks:
    - Lowercases text
    - Lemmatizes words
    - Keeps only meaningful parts of speech (NOUN, PROPN, VERB, ADJ)
    - Removes stopwords and short tokens
    """
    doc = nlp(text.lower())
    keywords = []

    for token in doc:
        if token.is_stop or token.is_punct or token.is_space:
            continue
        if token.pos_ in ["NOUN", "PROPN", "VERB", "ADJ"]:
            lemma = token.lemma_.strip()
            if len(lemma) > 2 and not lemma.startswith("http"):  # filter short/noisy tokens
                keywords.append(lemma)

    return " ".join(keywords)

def remove_personal_info(text):
    """Remove email addresses and phone numbers."""
    text = re.sub(r"\S+@\S+", "EMAIL_REMOVED", text)
    text = re.sub(r"\+?\d{1,4}?[\s.-]?\(?\d{1,3}?\)?[\s.-]?\d{1,3}[\s.-]?\d{1,4}", "PHONE_REMOVED", text)
    return text

def extract_skills(text):
    """Extract skills from text."""
    tokens = [w.lower() for w in nltk.word_tokenize(text) if w.isalpha()]
    bigrams_trigrams = list(map(" ".join, nltk.everygrams(tokens, 2, 3)))
    found_skills = {word for word in tokens if word in SKILLS_DB}
    found_skills |= {ngram for ngram in bigrams_trigrams if ngram in SKILLS_DB}
    return list(found_skills)

def extract_education(text):
    """Extract education details from text."""
    degree_pattern = r"\b(Bachelor|Master|PhD|Diploma|Certificate|B\.?S\.?|M\.?S\.?|Ph\.?D\.?)\b"
    university_pattern = r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(University|College|Institute|Academy)\b"
    year_pattern = r"\b(19|20)\d{2}\b"

    education_entries = []
    for line in text.split("\n"):
        degree = re.search(degree_pattern, line, re.IGNORECASE)
        university = re.search(university_pattern, line)
        year = re.search(year_pattern, line)
        if degree or university or year:
            education_entries.append({
                "Degree": degree.group(0) if degree else None,
                "University": university.group(0) if university else None,
                "Year": year.group(0) if year else None,
            })
    return education_entries

def extract_experience(text):
    """Extract experience section from text."""
    experience_section = []
    for line in text.split("\n"):
        if re.search(r"\b(experience|work history|employment)\b", line, re.IGNORECASE):
            experience_section.append(line)
    return experience_section

def extract_location(text):
    """Extract location details from text."""
    location_pattern = r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b"
    locations = re.findall(location_pattern, text)
    return locations

def compute_cosine_similarity(job_description, resume_text, resume_skills=None):
    sbert_model = SentenceTransformer("all-MiniLM-L6-v2")

    # Enrich with skills (optional but effective)
    enriched_resume = resume_text
    if resume_skills:
        enriched_resume += " " + " ".join(resume_skills)

    job_embedding = sbert_model.encode(job_description, normalize_embeddings=True)
    resume_embedding = sbert_model.encode(enriched_resume, normalize_embeddings=True)

    similarity_score = cosine_similarity([job_embedding], [resume_embedding])[0][0]
    return similarity_score


def get_db_connection():
    """Establish a database connection."""
    return psycopg2.connect(
        host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )


def save_application_to_db(applicant_name, email, job_id, skills, education, experience, similarity_score):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Convert extracted sections into JSON
        resume_json = json.dumps({
            "skills": skills,
            "education": education,
            "experience": experience
        })
        similarity_score = float(similarity_score)
        # Insert into database
        query = """
        INSERT INTO applications (applicant_name, email, job_id, resume, matching_score)
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (applicant_name, email, job_id, resume_json, similarity_score))

        connection.commit()
        cursor.close()
        connection.close()
        print("Application saved successfully!")

    except Exception as e:
        print("Error saving application:", e)

def get_job_description(job_id):
    """Fetch job description from the jobs table given a job_id."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT description FROM jobs WHERE job_id = %s", (job_id,))
        job = cursor.fetchone()
        cursor.close()
        conn.close()

        if job:
            return job[0]  # Return the job description
        else:
            return None  # Job not found

    except psycopg2.Error as e:
        print(f"Database error: {e.pgerror}")
        return None
    except Exception as e:
        print(f"Error fetching job description: {str(e)}")
        return None

def get_job_location(job_id):
    """Fetch job location from the jobs table given a job_id."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT location FROM jobs WHERE job_id = %s", (job_id,))
        job = cursor.fetchone()
        cursor.close()
        conn.close()

        if job:
            return job[0]  # Return the job location
        else:
            return None  # Job not found

    except psycopg2.Error as e:
        print(f"Database error: {e.pgerror}")
        return None
    except Exception as e:
        print(f"Error fetching job location: {str(e)}")
        return None

# Routes
@app.route('/apply', methods=['POST'])
def apply():
    try:
        # Extract form data from the request
        applicant_name = request.form.get("name")  # Dynamically get name
        email = request.form.get("email")  # Dynamically get email
        job_id = request.form.get("job_id")  # Dynamically get job_id
        resume_file = request.files.get("resume")  # Get the uploaded resume file

        if not resume_file:
            return jsonify({"error": "No resume file provided"}), 400

        # Secure the filename and save temporarily
        filename = secure_filename(resume_file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        resume_file.save(filepath)

        # Extract text from the PDF
        resume_text = extract_text(filepath)

        # Process extracted text
        resume_text = remove_personal_info(resume_text)
        resume_text = clean_text(resume_text)
        skills = extract_skills(resume_text)
        education = extract_education(resume_text)
        experience = extract_experience(resume_text)

        # Extract location from resume
        resume_locations = extract_location(resume_text)

        # Fetch job description and location
        job_description = get_job_description(job_id)
        job_location = get_job_location(job_id)
        if not job_description or not job_location:
            return jsonify({"error": "Job not found"}), 404

        # Match locations
        location_match = any(loc.lower() in job_location.lower() for loc in resume_locations)

        # Compute matching score
        similarity_score = float(compute_cosine_similarity(job_description, resume_text, skills))  # Ensure float type

        # Strengthen matching score with location match
        if location_match:
            similarity_score += 0.1  # Boost score by 0.1 if location matches
            similarity_score = min(similarity_score, 1.0)  # Ensure score doesn't exceed 1.0

        # Save application to DB
        save_application_to_db(applicant_name, email, job_id, skills, education, experience, similarity_score)

        # Cleanup temporary file
        try:
            os.remove(filepath)
        except Exception as cleanup_error:
            print(f"Warning: Failed to remove temporary file: {cleanup_error}")  # Log cleanup error

        # Return success response
        return jsonify({
            "message": "Application submitted successfully!",
            "matching_score": similarity_score,
            "status": "success"
        }), 200

    except Exception as e:
        # Log the error for debugging
        print(f"Error in /apply route: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/post_job", methods=["POST"])
def post_job():
    """Post a new job."""
    try:
        data = request.get_json()
        required_fields = ["title", "description", "location", "salary_range", "experience_level", "job_type"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        cleaned_description = clean_text(data["description"])
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO jobs (title, description, cleaned_description, location, salary_range, experience_level, job_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data["title"], data["description"], cleaned_description, data["location"],
            data["salary_range"], data["experience_level"], data["job_type"]
        ))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Job posted successfully!"}), 201
    except psycopg2.Error as e:
        return jsonify({"error": f"Database error: {e.pgerror}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/jobs", methods=["GET"])
def get_jobs():
    """Retrieve all jobs."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM jobs")
        jobs = cursor.fetchall()
        cursor.close()
        conn.close()
        jobs_list = [dict(job) for job in jobs]  # Convert RealDictRow to dict
        print("Jobs fetched from database:", jobs_list)  # Debug log to print jobs
        return jsonify(jobs_list), 200
    except psycopg2.Error as e:
        print(f"Database error: {e.pgerror}")  # Log database error
        return jsonify({"error": f"Database error: {e.pgerror}"}), 500
    except Exception as e:
        print(f"Error fetching jobs: {str(e)}")  # Log general error
        return jsonify({"error": str(e)}), 500

@app.route("/test_db_connection", methods=["GET"])
def test_db_connection():
    """Test database connection."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        return jsonify({"message": "Database connection successful!"}), 200
    except psycopg2.Error as e:
        return jsonify({"error": f"Database connection failed: {e.pgerror}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/applications/<int:job_id>", methods=["GET"])
def get_applications(job_id):
    """Fetch all applications for a specific job."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT applicant_name, email, matching_score, resume
            FROM applications
            WHERE job_id = %s
        """, (job_id,))
        applications = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(applications), 200
    except psycopg2.Error as e:
        return jsonify({"error": f"Database error: {e.pgerror}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

app.secret_key = "a4b3c84ef1398b89703c5d6f96b51964e82d8c1b3c3baf9b517b7a3ff2d437e9"

CORS(app, supports_credentials=True)

LM_STUDIO_API_URL = "http://localhost:1234/v1/chat/completions"
HEADERS = {"Content-Type": "application/json"}

# In-memory quiz session store (replace with DB in production)
quiz_sessions = {}

def build_question_prompt(topic, difficulty, existing_questions):
    existing_questions_text = " ".join([q["question"] for q in existing_questions])
    return f'''
You are a technical quiz generator.

Generate ONE multiple-choice question on the topic of "{topic}" with {difficulty} difficulty.

Do not generate duplicate questions. Avoid these questions: "{existing_questions_text}"

Format as JSON:
{{
  "question": "...",
  "options": {{
    "A": "...",
    "B": "...",
    "C": "...",
    "D": "..."
  }},
  "answer": "B" or "C" or "D" or "A"
}}
Only return valid JSON. No explanations.
'''

def get_question_from_llm(topic, difficulty, existing_questions):
    prompt = build_question_prompt(topic, difficulty, existing_questions)
    payload = {
        "model": "mistral",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.5,
        "max_tokens": 300
    }
    response = requests.post(LM_STUDIO_API_URL, headers=HEADERS, json=payload)
    return json.loads(response.json()["choices"][0]["message"]["content"])

@app.route("/start_quiz", methods=["POST"])
def start_quiz():
    data = request.get_json()
    session_id = str(uuid.uuid4())  # Generate a unique session ID
    field = data["field"]
    job_id = data.get("job_id")  # Get job_id dynamically from the request
    user_id = data.get("user_id")  # Get user_id (applicant's name) dynamically

    if not user_id:
        return jsonify({"error": "User ID (applicant name) is required.", "status": "error"}), 400

    quiz_sessions[session_id] = {
        "field": field,
        "job_id": job_id,  # Store job_id in the session
        "user_id": user_id,  # Store user_id (applicant's name) in the session
        "score": 0,
        "current_q": 0,
        "questions": [],
        "answers": [],
        "max_questions": 5  # Set the maximum number of questions to 5
    }

    return jsonify({
        "message": f"🔍 Starting {field} quiz!",
        "session_id": session_id,  # Return the session ID to the frontend
        "status": "success"
    })

@app.route("/next_question", methods=["POST"])
def next_question():
    data = request.get_json()
    session_id = data["session_id"].strip()  # Use session_id instead of user_id
    difficulty = data["difficulty"]

    session_data = quiz_sessions.get(session_id)
    if not session_data:
        return jsonify({"error": "Session not found.", "status": "error"}), 400

    if len(session_data["questions"]) >= session_data["max_questions"]:
        return jsonify({
            "finished": True,
            "message": "Quiz completed!",
            "status": "success"
        })

    topic = session_data["field"]  # Use the job's field as the topic
    q_data = get_question_from_llm(topic, difficulty, session_data["questions"])
    session_data["questions"].append(q_data)

    return jsonify({
        "question": q_data["question"],
        "options": q_data["options"],
        "q_number": len(session_data["questions"]),
        "finished": False,
        "status": "success"
    })

def save_quiz_result(user_id, job_id, field, questions, user_answers, score, passed):
    """Save quiz results to the database."""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
        INSERT INTO quiz_results (user_id, job_id, field, questions, user_answers, score, passed)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            user_id,  # Use the user_id (applicant's name) from the session
            job_id,
            field,
            json.dumps(questions),  # Convert questions to JSON
            json.dumps(user_answers),  # Convert answers to JSON
            score,
            passed
        ))

        connection.commit()
        cursor.close()
        connection.close()
        print("Quiz result saved successfully!")
    except Exception as e:
        print("Error saving quiz result:", e)

@app.route("/answer", methods=["POST"])
def answer():
    try:
        data = request.get_json()
        session_id = data.get("session_id", "").strip()  # Use session_id instead of user_id
        user_answer = data.get("answer", "").strip().upper()

        if not session_id or not user_answer:
            return jsonify({"error": "Missing required fields: 'session_id' or 'answer'.", "status": "error"}), 400

        session_data = quiz_sessions.get(session_id)
        if not session_data or not session_data["questions"]:
            return jsonify({"error": "Session expired or no quiz in progress.", "status": "error"}), 400

        current_index = session_data["current_q"]
        if current_index >= len(session_data["questions"]):
            return jsonify({"error": "No more questions available.", "status": "error"}), 400

        current_q = session_data["questions"][current_index]
        correct = user_answer == current_q["answer"].upper()

        session_data["answers"].append({
            "user": user_answer,
            "correct": correct
        })

        if correct:
            session_data["score"] += 1  # Increment score for correct answers
            feedback = f"✅ Correct!"
        else:
            feedback = f"❌ Incorrect. Correct answer was {current_q['answer']}"

        session_data["current_q"] += 1

        if session_data["current_q"] >= session_data["max_questions"]:
            passed = session_data["score"] > 3  # Pass if score > 3/5
            result_message = (
                f"🎉 You passed the quiz with a score of {session_data['score']}/5!"
                if passed
                else f"❌ You failed the quiz with a score of {session_data['score']}/5."
            )

            # Save quiz results to the database
            save_quiz_result(
                user_id=session_data["user_id"],  # Use user_id (applicant's name) from the session
                job_id=session_data["job_id"],
                field=session_data["field"],
                questions=session_data["questions"],
                user_answers=session_data["answers"],
                score=session_data["score"],
                passed=passed
            )

            # Remove session after completion
            del quiz_sessions[session_id]

            return jsonify({
                "feedback": feedback,
                "score": session_data["score"],
                "finished": True,
                "result_message": result_message,
                "status": "success"
            })

        return jsonify({
            "feedback": feedback,
            "score": session_data["score"],
            "finished": False,
            "status": "success"
        })
    except Exception as e:
        print(f"Error in /answer route: {str(e)}")  # Log the error
        return jsonify({"error": str(e), "status": "error"}), 500

@app.route("/results", methods=["GET"])
def results():
    user_id = request.args.get("user_id")
    session_data = quiz_sessions.get(user_id)
    if not session_data:
        return jsonify({"error": "Session not found."}), 400

    total = len(session_data["questions"])
    correct = sum(1 for a in session_data["answers"] if a["correct"])
    score = session_data["score"]

    return jsonify({
        "total_questions": total,
        "correct_answers": correct,
        "score": score,
        "details": session_data["answers"]
    })

if __name__ == "__main__":
    app.run(debug=True)
