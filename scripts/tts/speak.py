#!/usr/bin/env python3
import sys
import requests

def main():
    if len(sys.argv) < 2:
        print("Usage: ./speak.py '<text>'")
        sys.exit(1)
        
    text = sys.argv[1]
    url = "http://127.0.0.1:8080/tts"
    
    payload = {
        "text": text,
        "speaker": "中文男",
        "speed": 1.0,
        "response_format": "wav"
    }
    
    print(f"Synthesizing: {text[:30]}...")
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        with open("plan_report.wav", "wb") as f:
            f.write(response.content)
        print("Saved to plan_report.wav")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
