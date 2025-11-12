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
        # Log the path being used
        print(f"[DEBUG] Looking for guide.xml at: {GUIDE_XML_PATH}")
        print(f"[DEBUG] File exists: {os.path.exists(GUIDE_XML_PATH)}")
        print(f"[DEBUG] Current working directory: {os.getcwd()}")
        print(f"[DEBUG] Script directory (BASE_DIR): {BASE_DIR}")

        # Check if guide.xml exists
        if not os.path.exists(GUIDE_XML_PATH):
            error_msg = f"guide.xml file not found at path: {GUIDE_XML_PATH}"
            print(f"[ERROR] {error_msg}")
            return jsonify({
                'error': 'guide.xml file not found',
                'message': error_msg,
                'searched_path': GUIDE_XML_PATH,
                'working_directory': os.getcwd()
            }), 404

        # Parse the XMLTV file
        print(f"[DEBUG] Attempting to parse: {GUIDE_XML_PATH}")
        data = parse_xmltv_file(GUIDE_XML_PATH)
        print(f"[DEBUG] Successfully parsed {len(data.get('channels', []))} channels")

        return jsonify(data)

    except ValueError as e:
        error_msg = f"Parse error: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return jsonify({
            'error': 'Parse error',
            'message': str(e),
            'file_path': GUIDE_XML_PATH
        }), 400

    except Exception as e:
        error_msg = f"Server error: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Server error',
            'message': str(e),
            'file_path': GUIDE_XML_PATH
        }), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'guide_file_exists': os.path.exists(GUIDE_XML_PATH)
    })


if __name__ == '__main__':
    print("=" * 60)
    print("TV Guide API Server - Startup Diagnostics")
    print("=" * 60)
    print(f"Script location (BASE_DIR): {BASE_DIR}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Looking for guide.xml at: {GUIDE_XML_PATH}")
    print(f"File exists: {os.path.exists(GUIDE_XML_PATH)}")

    if os.path.exists(GUIDE_XML_PATH):
        file_size = os.path.getsize(GUIDE_XML_PATH)
        print(f"File size: {file_size} bytes")

    print("=" * 60)

    # Check if guide.xml exists at startup
    if not os.path.exists(GUIDE_XML_PATH):
        print(f"\n⚠️  WARNING: guide.xml not found at {GUIDE_XML_PATH}")
        print("The application will start, but the API will return 404 until the file is provided.\n")
    else:
        print(f"✓ guide.xml found successfully!\n")

    print("Starting TV Guide API Server...")
    print("API endpoint: http://localhost:7022/api/guide")
    print("Frontend: http://localhost:7022/")
    print("=" * 60 + "\n")

    app.run(debug=True, host='0.0.0.0', port=7022)
