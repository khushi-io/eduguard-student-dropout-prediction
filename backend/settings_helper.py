import os
import json

SETTINGS_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'settings.json')

def get_risk_thresholds():
    try:
        if os.path.exists(SETTINGS_PATH):
            with open(SETTINGS_PATH, 'r') as f:
                data = json.load(f)
                return float(data.get('high', 60.0)), float(data.get('medium', 35.0))
    except Exception as e:
        print(f"Error reading settings: {e}")
    return 60.0, 35.0

def save_risk_thresholds(high, medium):
    try:
        with open(SETTINGS_PATH, 'w') as f:
            json.dump({'high': float(high), 'medium': float(medium)}, f)
        return True
    except Exception as e:
        print(f"Error writing settings: {e}")
    return False
