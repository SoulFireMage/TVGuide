# TV Guide - Electronic Programme Guide (EPG)

A full-stack web application for displaying and managing TV programme schedules in an interactive, grid-based interface.

## Features

### Core Functionality
- **2-Axis Grid Layout**: Channels on the Y-axis and time on the X-axis
- **Horizontal Scrolling Timeline**: Synchronized scrolling between timeline header and programme grid
- **Programme Details**: Click any programme to expand an accordion-style details row
- **Current Time Indicator**: Visual line showing the current time position

### User Preferences
- **Favourite Channels**: Star your favourite channels for quick access
- **Show Favourites Only**: Toggle to display only starred channels
- **Channel Reordering**: Drag and drop channels to customize the order
- **Persistent Settings**: All preferences saved in browser localStorage

### User Experience
- **Responsive Design**: Works on desktop and mobile devices
- **"Go to Now" Button**: Quickly scroll to the current time
- **Smooth Animations**: Accordion expansion and UI transitions
- **Loading and Error States**: Clear feedback during data loading

## Technology Stack

### Backend
- **Python 3**: Core language
- **Flask**: Web framework for REST API
- **xml.etree.ElementTree**: XML parsing (built-in)
- **Flask-CORS**: Cross-origin resource sharing

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with animations
- **JavaScript (ES6+)**: Interactive functionality
- **Fetch API**: HTTP requests
- **localStorage**: Client-side data persistence

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TVGuide
   ```

2. **Create a virtual environment** (Recommended, especially for Ubuntu/Debian)
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment**

   On Linux/Mac:
   ```bash
   source venv/bin/activate
   ```

   On Windows:
   ```bash
   venv\Scripts\activate
   ```

4. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Add your XMLTV guide file**
   - Place your `guide.xml` file in the project root directory
   - The file should be in standard XMLTV format
   - A sample `guide.xml` is included for testing

6. **Run the application**
   ```bash
   python app.py
   ```

7. **Open in browser**
   - Navigate to: `http://localhost:5000`
   - The application will automatically load and display your TV guide

8. **Deactivate virtual environment** (when finished)
   ```bash
   deactivate
   ```

### Quick Start (Ubuntu/Debian)

If you get an "externally-managed-environment" error, use these commands:

```bash
cd TVGuide
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Next time you run the app, just activate the venv first:
```bash
source venv/bin/activate
python app.py
```

## Usage

### Basic Navigation
- **Scroll Horizontally**: Use mouse wheel or trackpad to scroll through time
- **Scroll Vertically**: Browse through different channels
- **Click Programme**: View detailed information about a programme

### Managing Favourites
1. Click the star (☆) next to any channel name to mark it as a favourite
2. The star will turn gold (★) when active
3. Click "Show Favourites Only" to filter the view
4. Click again to show all channels

### Reordering Channels
1. Click and hold on any channel name
2. Drag the channel up or down
3. Release to drop in the new position
4. The order is automatically saved

### Finding Current Programmes
1. Click the "Go to Now" button in the header
2. The grid will scroll to show programmes currently airing
3. A red vertical line indicates the current time

## File Structure

```
TVGuide/
├── app.py                 # Flask API server
├── parse_xmltv.py         # XMLTV parser module
├── index.html             # Main HTML structure
├── style.css              # CSS styling
├── script.js              # JavaScript functionality
├── requirements.txt       # Python dependencies
├── README.md              # This file
└── guide.xml              # Your XMLTV data file (add this)
```

## API Endpoints

### GET /api/guide
Returns the parsed TV guide data in JSON format.

**Response Format:**
```json
{
  "channels": [
    {
      "id": "bbc1.uk",
      "name": "BBC One"
    }
  ],
  "programmes": {
    "bbc1.uk": [
      {
        "title": "BBC News",
        "start": "2023-12-01T18:00:00",
        "end": "2023-12-01T18:30:00",
        "description": "The latest news..."
      }
    ]
  }
}
```

### GET /api/health
Health check endpoint to verify the application status.

**Response Format:**
```json
{
  "status": "ok",
  "guide_file_exists": true
}
```

## XMLTV Format

The application expects a standard XMLTV format file. Here's an example structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tv>
  <channel id="bbc1.uk">
    <display-name>BBC One</display-name>
  </channel>

  <programme start="20231201180000 +0000" stop="20231201183000 +0000" channel="bbc1.uk">
    <title>BBC News</title>
    <desc>The latest national and international news.</desc>
  </programme>
</tv>
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Testing the Parser
Run the parser directly to test XMLTV parsing:
```bash
python parse_xmltv.py
```

### Debug Mode
The Flask application runs in debug mode by default, which:
- Automatically reloads on code changes
- Provides detailed error messages
- Should be disabled in production

### Customization
- **Timeline Interval**: Modify `TIMELINE_INTERVAL_MINUTES` in `script.js` (default: 30 minutes)
- **Pixels Per Minute**: Adjust `pixelsPerMinute` in `script.js` for wider/narrower programme blocks (default: 2)
- **Port**: Change the port in `app.py` (default: 5000)

## Troubleshooting

### "guide.xml file not found" Error
- Ensure `guide.xml` is in the project root directory
- Check the file name is exactly `guide.xml` (case-sensitive on Linux/Mac)

### Programmes Not Displaying
- Verify your XMLTV file is valid XML
- Check that programme times are in the correct format
- Review the browser console for JavaScript errors

### Timeline Not Showing
- Ensure at least one programme exists in the guide data
- Check that programme start/end times are valid

### Drag and Drop Not Working
- This feature requires a modern browser with HTML5 drag-and-drop support
- Try refreshing the page

## Future Enhancements

Potential features for future versions:
- Search functionality for programmes
- Category/genre filtering
- Programme reminders
- Multi-day view
- Dark mode theme
- Export favourite channels
- Programme recording integration

## License

This project is provided as-is for educational and personal use.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## Support

For issues and questions:
1. Check the Troubleshooting section
2. Review the browser console for errors
3. Ensure your XMLTV file is properly formatted
4. Open an issue in the repository
