"""
TV Guide Flask API Server
Provides REST API endpoints for accessing parsed XMLTV data.
"""

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
from parse_xmltv import parse_xmltv_file

app = Flask(__name__, static_folder='.')
CORS(app)  # Enable CORS for frontend requests

# Configuration
# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GUIDE_XML_PATH = os.path.join(BASE_DIR, 'guide.xml')


@app.route('/')
def index():
    """Serve the main HTML page."""
    return send_from_directory('.', 'index.html')


@app.route('/style.css')
def style():
    """Serve the CSS file."""
    return send_from_directory('.', 'style.css')


@app.route('/script.js')
def script():
    """Serve the JavaScript file."""
    return send_from_directory('.', 'script.js')


@app.route('/api/guide', methods=['GET'])
def get_guide():
    """
    GET endpoint that returns parsed XMLTV data as JSON.

    Returns:
        JSON response containing channels and programmes data
    """
    try:
        # Check if guide.xml exists
        if not os.path.exists(GUIDE_XML_PATH):
            return jsonify({
                'error': 'guide.xml file not found',
                'message': 'Please ensure guide.xml is in the application directory'
            }), 404

        # Parse the XMLTV file
        data = parse_xmltv_file(GUIDE_XML_PATH)

        return jsonify(data)

    except ValueError as e:
        return jsonify({
            'error': 'Parse error',
            'message': str(e)
        }), 400

    except Exception as e:
        return jsonify({
            'error': 'Server error',
            'message': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'guide_file_exists': os.path.exists(GUIDE_XML_PATH)
    })


if __name__ == '__main__':
    # Check if guide.xml exists at startup
    if not os.path.exists(GUIDE_XML_PATH):
        print(f"WARNING: {GUIDE_XML_PATH} not found!")
        print("The application will start, but the API will return 404 until the file is provided.")

    print("Starting TV Guide API Server...")
    print(f"Guide file: {GUIDE_XML_PATH}")
    print("API endpoint: http://localhost:7022/api/guide")
    print("Frontend: http://localhost:7022/")

    app.run(debug=True, host='0.0.0.0', port=7022)
