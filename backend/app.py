import os
import io
import time
import psycopg2
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from psycopg2.extras import RealDictCursor
from google import genai
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# 1. Load context environment variable wrappers
load_dotenv()

app = Flask(__name__)

# 2. Complete Global Overwrite for Production CORS Handshakes
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.before_request
def handle_options_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response

@app.after_request
def add_cors_headers(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response

# 3. Model Engine Schema Profiles Matching Your Vercel Frontend UI Context Keys
class ReceiptData(BaseModel):
    merchant_name: str = Field(description="The name of the store, restaurant, or vendor.")
    date: str = Field(description="The transaction date found on the receipt formatted as YYYY-MM-DD. Use null if not found.")
    total_amount: float = Field(description="The total final price paid, including tax and discounts.")
    category: str = Field(description="A single-word category guess based on the vendor (e.g., Food, Travel, Office, Utilities).")
    currency: str = Field(description="The currency code or symbol found on the receipt, e.g., INR, USD, ₹, $")
    tax_amount: float = Field(description="The total tax amount charged. Return 0.0 if not specified.")
    payment_mode: str = Field(description="The method of payment used, strictly categorized as one of these: 'UPI', 'Cash', 'Card', or 'Not Specified'.")

# 4. Isolated Helper Functions (Preventing Boot Failures)
def get_db_connection():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("CRITICAL: DATABASE_URL variable is missing from the environment configuration dashboard context.")
    return psycopg2.connect(database_url)

def init_db():
    """Initializes the database schema using isolated, safe scopes."""
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
        print("Database structure verified and initialized safely.")
    except Exception as e:
        print(f"Database initialization error during initialization phase: {e}")

# 5. Application Routing Implementations
@app.route('/api/upload', methods=['POST'])
def upload_receipt():
    # Dynamic instantiation execution pathing matching SDK configurations
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return jsonify({"error": "Gemini API key is completely missing from runtime environments."}), 500

    if 'file' not in request.files:
        return jsonify({"error": "No file stream payload included inside multipart format boundary profiles."}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No designated filename captured inside wrapper payload configurations."}), 400

    try:
        from PIL import Image
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))

        prompt = "Analyze this receipt image. Extract the vendor name, date, total amount, categorize the expense, identify the currency, extract the tax amount, and determine the payment mode."
        
        # Initialize isolated generation client within current scope wrapper framework
        client = genai.Client(api_key=gemini_key)
        
        max_retries = 3
        delay = 2  
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
                extracted_data = response.parsed
                break
            except Exception as api_err:
                if "503" in str(api_err) and attempt < max_retries - 1:
                    time.sleep(delay)
                    delay *= 2  
                else:
                    raise api_err

        if not extracted_data:
            return jsonify({"error": "Parsing error encountered while flattening internal schema layouts."}), 500

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
        print(f"Extraction Pipeline Failure Trace Context: {str(e)}")
        return jsonify({"error": f"Internal execution failure: {str(e)}"}), 500

@app.route('/api/expenses', methods=['POST'])
def save_expense():
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
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
        return jsonify({"error": f"Database interaction profile write crash error details: {str(e)}"}), 500

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('SELECT * FROM expenses ORDER BY created_at DESC')
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "data": rows}), 200
    except Exception as e:
        return jsonify({"error": f"Database interaction profile fetch crash error details: {str(e)}"}), 500

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
        return jsonify({"error": f"Database interaction profile delete crash error details: {str(e)}"}), 500


@app.errorhandler(Exception)
def handle_global_runtime_error(error):
    """Intercepts deep server errors and returns the explicit text tracing payload to the UI."""
    print(f"CRITICAL OVERRIDE CAPTURED: {str(error)}")
    response = jsonify({
        "success": False, 
        "error": "Internal Application Processing Failure",
        "details": str(error)
    })
    response.status_code = 500
    return response

if __name__ == '__main__':
    init_db()
    # Forces the app to accept Railway's dynamic port, defaulting to 8080 only locally
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port, debug=False)