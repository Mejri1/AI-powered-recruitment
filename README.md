# TalentMatch

TalentMatch is a full-stack application for AI-powered recruitment.

## Folder Structure

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

## Setup Instructions

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

## Testing

- Frontend: Run `npm test` in the `talent-match-frontend` directory.
- Backend: Add tests using a framework like `pytest`.

## License

This project is licensed under the MIT License.
