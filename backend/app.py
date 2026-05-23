import os
import time  # For handling retry delays during server spikes
import io
import psycopg2
from flask_cors import CORS
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from pydantic import BaseModel, Field
from PIL import Image
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Enable CORS so your React frontend can securely make API calls to this backend
CORS(app)

# Fetch the Supabase Connection URI string from your hidden .env file
DATABASE_URL = os.getenv("DATABASE_URL")

# def get_db_connection():
#     """Establishes a connection to the live cloud Supabase PostgreSQL instance."""
#     # tcp_user_timeout keeps the connection alert and resilient against network drops
#     conn = psycopg2.connect(DATABASE_URL, options="-c tcp_user_timeout=10000")
#     return conn

def get_db_connection():
    """Establishes a connection to the live cloud Supabase PostgreSQL instance."""
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def init_db():
    """Initializes the database schema using persistent PostgreSQL rules."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                merchant_name VARCHAR(255),
                date VARCHAR(50),
                total_amount REAL,
                category VARCHAR(100),
                currency VARCHAR(50),
                tax_amount REAL,
                payment_mode VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        cursor.close()
        conn.close()
        print("Database initialized successfully on Supabase cloud ecosystem.")
    except Exception as e:
        print(f"Database initialization error: {e}")

# Initialize the cloud database tables on server boot
init_db()

# Initialize the Gemini Client safely
try:
    client = genai.Client()
except Exception as e:
    client = None
    print(f"Warning: Could not initialize Gemini client. Error: {e}")

# Define the structured output schema using Pydantic
class ReceiptData(BaseModel):
    merchant_name: str = Field(description="The name of the store, restaurant, or vendor.")
    date: str = Field(description="The transaction date found on the receipt formatted as YYYY-MM-DD. Use null if not found.")
    total_amount: float = Field(description="The total final price paid, including tax and discounts.")
    category: str = Field(description="A single-word category guess based on the vendor (e.g., Food, Travel, Office, Utilities).")
    currency: str = Field(description="The currency code or symbol found on the receipt, e.g., INR, USD, ₹, $")
    tax_amount: float = Field(description="The total tax amount (like GST, CGST/SGST, or Sales Tax) charged. Return 0.0 if not specified.")
    payment_mode: str = Field(description="The method of payment used, strictly categorized as one of these: 'UPI', 'Cash', 'Card', or 'Not Specified'.")

@app.route('/api/upload', methods=['POST'])
def upload_receipt():
    if not client:
        return jsonify({"error": "Gemini API client not initialized. Check your .env file key."}), 500

    # 1. Check if an image file was sent in the request
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # 2. Read the binary image file and open it using Pillow (PIL)
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))

        # 3. Call the Gemini API with structured output configuration
        prompt = "Analyze this receipt image. Extract the vendor name, date, total amount, categorize the expense, identify the currency, extract the tax amount, and determine the payment mode."
        
        # --- 🛡️ HACKATHON DEMO RESILIENCY LOOP (FOR 503 OVERLOADS) ---
        max_retries = 3
        delay = 2  # Start with a 2-second pause if choked
        extracted_data = None

        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[image, prompt],
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": ReceiptData,
                    }
                )
                # Success! Grab the cleanly parsed object and break out immediately
                extracted_data = response.parsed
                break
            except Exception as api_err:
                # Check if it's a 503 high demand error and we still have attempts left
                if "503" in str(api_err) and attempt < max_retries - 1:
                    print(f"Gemini busy (503). Retrying in {delay}s... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(delay)
                    delay *= 2  # Double the wait time for the next round (2s -> 4s)
                else:
                    # Reraise immediately if it's a structural/auth error or out of retries
                    raise api_err
        # -------------------------------------------------------------

        # 4. Send the structured data safely back to the frontend
        return jsonify({
            "success": True,
            "data": {
                "merchant_name": extracted_data.merchant_name,
                "date": extracted_data.date,
                "total_amount": extracted_data.total_amount,
                "category": extracted_data.category,
                "currency": extracted_data.currency,
                "tax_amount": extracted_data.tax_amount,
                "payment_mode": extracted_data.payment_mode
            }
        }), 200

    except Exception as e:
        print(f"Error processing receipt: {str(e)}")
        # User-friendly warning for the frontend dashboard
        return jsonify({"error": "The AI model is handling high traffic. Please drop the receipt again."}), 500

@app.route('/api/expenses', methods=['POST'])
def save_expense():
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # %s replaces ? placeholders to fit deterministic PostgreSQL query standards
        cursor.execute('''
            INSERT INTO expenses (merchant_name, date, total_amount, category, currency, tax_amount, payment_mode)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
        ''', (
            data.get('merchant_name'),
            data.get('date'),
            data.get('total_amount'),
            data.get('category'),
            data.get('currency'),
            data.get('tax_amount'),
            data.get('payment_mode')
        ))
        expense_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "id": expense_id}), 201
    except Exception as e:
        print(f"Error saving expense: {str(e)}")
        return jsonify({"error": "Failed to save expense"}), 500

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    try:
        conn = get_db_connection()
        # RealDictCursor formats our query returns cleanly as key-value JSON objects instantly
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('SELECT * FROM expenses ORDER BY created_at DESC')
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "data": rows}), 200
    except Exception as e:
        print(f"Error fetching expenses: {str(e)}")
        return jsonify({"error": "Failed to fetch expenses"}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM expenses WHERE id = %s', (expense_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        print(f"Error deleting expense: {str(e)}")
        return jsonify({"error": "Failed to delete expense"}), 500

# if __name__ == '__main__':
#     # Run the server on port 5000 for local development
#     app.run(debug=True, port=5000)


if __name__ == '__main__':
    import os
    # Railway provides the port dynamically via environment variables
    port = int(os.environ.get("PORT", 5000))
    # Setting host to 0.0.0.0 tells Flask to listen to all public cloud requests
    app.run(host='0.0.0.0', port=port)