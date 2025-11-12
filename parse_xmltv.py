"""
XMLTV Parser Module
Parses an XMLTV format guide.xml file and extracts channel and programme data.
"""

import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, List, Any


def parse_datetime(dt_str: str) -> str:
    """
    Parse XMLTV datetime format (YYYYMMDDHHmmss +ZZZZ) to ISO format with UTC timezone.

    Args:
        dt_str: DateTime string in XMLTV format (e.g., "20231201180000 +0000")

    Returns:
        ISO formatted datetime string with UTC indicator (Z suffix)
    """
    try:
        # XMLTV format: YYYYMMDDHHmmss +ZZZZ
        # Extract the datetime part (before the timezone)
        dt_part = dt_str.split()[0]

        # Parse the datetime
        dt = datetime.strptime(dt_part, "%Y%m%d%H%M%S")

        # Return ISO format with Z suffix to indicate UTC
        # This ensures JavaScript interprets the time as UTC, not local time
        return dt.isoformat() + 'Z'
    except (ValueError, IndexError) as e:
        # If parsing fails, return the original string
        return dt_str


def parse_xmltv_file(file_path: str) -> Dict[str, Any]:
    """
    Parse an XMLTV file and extract channels and programmes.

    Args:
        file_path: Path to the guide.xml file

    Returns:
        Dictionary containing 'channels' list and 'programmes' dict
    """
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
    except FileNotFoundError:
        raise FileNotFoundError(f"XMLTV file not found at: {file_path}")
    except ET.ParseError as e:
        raise ValueError(f"Failed to parse XMLTV file: {e}")

    # Extract channels
    channels = []
    for channel_elem in root.findall('channel'):
        channel_id = channel_elem.get('id')

        # Get the first display-name (some channels have multiple)
        display_name_elem = channel_elem.find('display-name')
        display_name = display_name_elem.text if display_name_elem is not None else channel_id

        # Get the icon/logo URL if available
        icon_elem = channel_elem.find('icon')
        icon_url = icon_elem.get('src') if icon_elem is not None else None

        channels.append({
            'id': channel_id,
            'name': display_name,
            'logo': icon_url
        })

    # Extract programmes grouped by channel
    programmes = {}
    for programme_elem in root.findall('programme'):
        channel_id = programme_elem.get('channel')
        start_time = programme_elem.get('start')
        stop_time = programme_elem.get('stop')

        # Extract title
        title_elem = programme_elem.find('title')
        title = title_elem.text if title_elem is not None else 'Untitled'

        # Extract description
        desc_elem = programme_elem.find('desc')
        description = desc_elem.text if desc_elem is not None else ''

        # Create programme object
        programme = {
            'title': title,
            'start': parse_datetime(start_time) if start_time else '',
            'end': parse_datetime(stop_time) if stop_time else '',
            'description': description
        }

        # Group by channel
        if channel_id not in programmes:
            programmes[channel_id] = []
        programmes[channel_id].append(programme)

    # Sort programmes by start time for each channel
    for channel_id in programmes:
        programmes[channel_id].sort(key=lambda p: p['start'])

    return {
        'channels': channels,
        'programmes': programmes
    }


if __name__ == '__main__':
    # Test the parser
    try:
        data = parse_xmltv_file('guide.xml')
        print(f"Parsed {len(data['channels'])} channels")
        print(f"Parsed programmes for {len(data['programmes'])} channels")

        # Show first channel as example
        if data['channels']:
            first_channel = data['channels'][0]
            print(f"\nFirst channel: {first_channel['name']} ({first_channel['id']})")

            if first_channel['id'] in data['programmes']:
                programmes = data['programmes'][first_channel['id']]
                print(f"  Has {len(programmes)} programmes")
                if programmes:
                    print(f"  First programme: {programmes[0]['title']}")
    except Exception as e:
        print(f"Error: {e}")
