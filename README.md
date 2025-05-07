# 🧠 TalentMatch – AI-Powered Recruitment System

**TalentMatch** is an intelligent recruitment platform that combines semantic resume-job matching with AI-generated technical quizzes. It helps companies assess candidates not only by their resumes but also through interactive, real-time skill testing – all backed by powerful NLP and LLM technology.

---

## 🚀 Features

- 📄 **Resume Parsing (PDF)** – Extracts structured info like education, skills, and experience from raw resumes using `pdfminer`, `spaCy`, and `nltk`.
- 🤖 **Semantic Matching** – Uses SBERT embeddings to match resume content against job descriptions.
- 📍 **Location-Aware Scoring** – Boosts match scores if a candidate's location matches the job.
- 🧪 **AI-Generated Quizzes** – Uses a local Mistral model to dynamically create MCQs per job domain.
- 📊 **Results Tracking** – Stores scores, questions, and answers for each user-session.
- 🧬 **REST API with Flask** – Fully functional backend with CORS support and environment-based config.
- 🗃️ **PostgreSQL Integration** – Stores job listings, applications, and quiz results securely.

---

## 📁 Project Structure

```
nlp/
├── backend/               # Backend Flask application
│   ├── app.py             # Main Flask app
│   ├── requirements.txt   # Python dependencies
│   ├── .env               # Environment variables
├── talent-match-frontend/ # Frontend React application
│   ├── src/               # React source code
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
```

---

## 🔧 Setup Instructions

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd talent-match-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

---

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask application:
   ```bash
   flask run
   ```

The backend will be available at: `http://127.0.0.1:5000/`

---

## 📬 API Endpoints

| Endpoint                   | Method | Description                                     |
|----------------------------|--------|-------------------------------------------------|
| `/apply`                  | POST   | Submit resume and get similarity score         |
| `/post_job`               | POST   | Add a new job to the system                    |
| `/jobs`                   | GET    | List all available jobs                        |
| `/applications/<job_id>` | GET    | Get applications submitted to a job            |
| `/start_quiz`             | POST   | Start a quiz session for a job category        |
| `/next_question`          | POST   | Get the next MCQ from the AI                   |
| `/answer`                 | POST   | Submit an answer and receive feedback          |
| `/results`                | GET    | Fetch current quiz session stats               |

---

## 🤯 How It Works

1. **Resume Upload:** Accepts PDFs, cleans text, removes sensitive info, and extracts structured data.
2. **Skill & Location Extraction:** Uses NLP + regex to detect key skills and candidate location.
3. **Job Matching:** SBERT (`all-MiniLM-L6-v2`) computes a similarity score with job descriptions.
4. **Quiz Generation:** Once matched, a quiz is generated via a prompt sent to a locally hosted LLM (Mistral).
5. **Scoring & Storage:** Quiz results and resumes are saved in PostgreSQL, linked to the candidate and job.

---

## 🧠 AI & NLP Stack

- 🧠 **spaCy** – Text preprocessing, lemmatization, POS tagging
- 📊 **Sentence Transformers (SBERT)** – Resume-job similarity scoring
- 🧾 **pdfminer.six** – PDF text extraction
- 🧑‍🔬 **Mistral LLM** – Technical quiz generation via API call
- 🐘 **PostgreSQL** – Persistent job & application storage

---

## 🖼️ Sample Workflow Diagram

1. ✅ Apply → Resume is parsed
2. 📍 Job matched (with location boost)
3. 🤖 Quiz started → Mistral generates MCQs
4. 🧠 Answers submitted → Score computed & saved

---

## 🧪 Sample Quiz JSON

```json
{
  "question": "What does PCA stand for in machine learning?",
  "options": {
    "A": "Principal Component Analysis",
    "B": "Probabilistic Component Association",
    "C": "Partial Class Alignment",
    "D": "Precomputed Cluster Algorithm"
  },
  "answer": "A"
}
```

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙋‍♀️ Author

- GitHub: [@Mejri1](https://github.com/Mejri1)
- Email: omar.mejri@etudiant-fst.utm.tn

---

## 📌 TODO (Ideas for Improvement)

- [ ] Add a front-end interface
- [ ] Add retry mechanism for quiz generation
- [ ] Add real authentication / user sessions
- [ ] Deploy API online via Docker + Railway/Render

