from flask import Flask, request, jsonify, render_template
import pdfplumber
from PIL import Image
import pytesseract
import re
import shutil
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Try to find tesseract in PATH
tesseract_cmd = shutil.which('tesseract')
if tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

pattern = r"(\b(?:\d{1,2}[-/.]\d{1,2}|\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?))\b)\s+(.+?)\s+(?:(\d{1,3}(?:,\d{3})*\.\d{2})\s+)?(?:(\d{1,3}(?:,\d{3})*\.\d{2})\s+)?(\d{1,3}(?:,\d{3})*\.\d{2})"

@app.route("/")
def home():
    return render_template('frontend.html')

@app.route("/health")
def health():
    return jsonify({"status": "ok", "message": "Backend is running"})

@app.route("/test-tesseract")
def test_tesseract():
    import subprocess
    try:
        result = subprocess.run(['tesseract', '--version'], 
                              capture_output=True, text=True, timeout=5)
        return jsonify({
            "status": "success",
            "tesseract_cmd": pytesseract.pytesseract.tesseract_cmd,
            "version": result.stdout,
            "which": shutil.which('tesseract')
        })
    except FileNotFoundError:
        return jsonify({
            "error": "Tesseract not found in PATH",
            "tesseract_cmd": pytesseract.pytesseract.tesseract_cmd,
            "which": shutil.which('tesseract')
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/upload-bank", methods=["POST"])
def upload_bank():
    if "bankStatement" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files["bankStatement"]
    output = {"transactions": []}
    
    try:
        # Ensure tesseract is found
        if not pytesseract.pytesseract.tesseract_cmd:
            tesseract_path = shutil.which('tesseract')
            if tesseract_path:
                pytesseract.pytesseract.tesseract_cmd = tesseract_path
            else:
                raise Exception("Tesseract not found in system PATH")
        
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                page_img = page.to_image(resolution=300)
                pil_img = page_img.original
                text = pytesseract.image_to_string(pil_img)
                clean = re.sub(r"\s+", " ", text)
                matches = re.findall(pattern, clean)
                
                for date, desc, debit, credit, balance in matches:
                    amount = debit if debit else credit
                    output["transactions"].append({
                        "date": date,
                        "description": desc.strip(),
                        "balance": balance
                    })
        return jsonify(output)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Regex patterns
pan_pattern = r"\b([A-Z]{5}[0-9]{4}[A-Z])\b"
name_pattern = r"Name\s*[:\-]?\s*([A-Z][A-Z\s]*[A-Z]|[A-Z][a-z]+(?:[\s]+[A-Z][a-z]+)*)"
dob_pattern = r"\b(\d{2}[-/]\d{2}[-/]\d{4})\b"

@app.route("/upload-pan", methods=["POST"])
def upload_pan():
    if "panCard" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files["panCard"]
    text = ""
    
    try:
        # Ensure tesseract is found
        if not pytesseract.pytesseract.tesseract_cmd:
            tesseract_path = shutil.which('tesseract')
            if tesseract_path:
                pytesseract.pytesseract.tesseract_cmd = tesseract_path
            else:
                raise Exception("Tesseract not found in system PATH")
        
        # Check if PDF
        if file.filename.lower().endswith('.pdf'):
            with pdfplumber.open(file) as pdf:
                page = pdf.pages[0]
                page_image = page.to_image(resolution=300)
                pil_img = page_image.original
                text = pytesseract.image_to_string(pil_img)
        else:
            # Assume it's an image
            img = Image.open(file.stream)
            text = pytesseract.image_to_string(img)
        
        # Extract data using regex
        pan_match = re.search(pan_pattern, text)
        name_match = re.search(name_pattern, text, re.MULTILINE)
        dob_match = re.search(dob_pattern, text)
        
        data = {
            "PAN Number": pan_match.group(1) if pan_match else None,
            "Name": name_match.group(1).strip() if name_match else None,
            "Date of Birth": dob_match.group(1) if dob_match else None
        }
        
        return jsonify(data)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
