# AI Receipt Tracker - Backend

This is a lightweight Python Flask backend that uses the `google-genai` SDK and Gemini 1.5 Flash to extract structured JSON data from receipt images.

## Setup Instructions

1. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `backend` directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the server:**
   ```bash
   python app.py
   ```
   The backend will be running at `http://localhost:5000`.
