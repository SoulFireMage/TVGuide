#!/usr/bin/env python3
"""
Update guide.xml from UK Freeview EPG source
This file is updated every 8 hours by the source: https://github.com/dp247/Freeview-EPG
"""

import urllib.request
import os

EPG_URL = "https://raw.githubusercontent.com/dp247/Freeview-EPG/master/epg.xml"
OUTPUT_FILE = "guide.xml"

def download_guide():
    """Download the latest EPG data."""
    print("Downloading UK Freeview EPG data...")
    print(f"Source: {EPG_URL}")

    try:
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_path = os.path.join(script_dir, OUTPUT_FILE)

        # Download the file
        urllib.request.urlretrieve(EPG_URL, output_path)

        # Check file size
        file_size = os.path.getsize(output_path)
        file_size_mb = file_size / (1024 * 1024)

        print(f"✓ Successfully downloaded {OUTPUT_FILE}")
        print(f"File size: {file_size_mb:.2f} MB ({file_size:,} bytes)")
        print(f"Saved to: {output_path}")
        print("\nRestart your Flask app to use the new data:")
        print("  python app.py")

        return True

    except Exception as e:
        print(f"✗ Failed to download guide.xml: {e}")
        return False

if __name__ == "__main__":
    success = download_guide()
    exit(0 if success else 1)
