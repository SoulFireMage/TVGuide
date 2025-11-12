#!/bin/bash
# Update guide.xml from UK Freeview EPG source
# This file is updated every 8 hours by the source

echo "Downloading UK Freeview EPG data..."
curl -L "https://raw.githubusercontent.com/dp247/Freeview-EPG/master/epg.xml" -o guide.xml

if [ $? -eq 0 ]; then
    echo "✓ Successfully downloaded guide.xml"
    echo "File size: $(du -h guide.xml | cut -f1)"
    echo ""
    echo "Restart your Flask app to use the new data:"
    echo "  python app.py"
else
    echo "✗ Failed to download guide.xml"
    exit 1
fi
