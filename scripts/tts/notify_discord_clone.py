#!/usr/bin/env python3
import sys
import os
import requests
import argparse

WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL", "")
TTS_URL = "http://127.0.0.1:8080/tts/zero_shot"

def synthesize_and_send(text, prompt_text, prompt_wav_path):
    if not WEBHOOK_URL:
        print("Error: DISCORD_WEBHOOK_URL environment variable is not set.")
        sys.exit(1)
        
    print(f"Synthesizing audio (clone mode) for: {text[:30]}...")
    
    try:
        with open(prompt_wav_path, "rb") as f:
            files = {"prompt_wav": (os.path.basename(prompt_wav_path), f, "audio/wav")}
            data = {
                "text": text,
                "prompt_text": prompt_text,
                "speed": "1.0"
            }
            tts_res = requests.post(TTS_URL, data=data, files=files)
            tts_res.raise_for_status()
            wav_data = tts_res.content
    except Exception as e:
        print(f"TTS Zero-Shot API Error: {e}")
        if hasattr(e, "response") and e.response:
            print(e.response.text)
        sys.exit(1)
        
    print("Uploading to Discord via Webhook...")
    try:
        files = {
            "file": ("cloned_voice_report.wav", wav_data, "audio/wav")
        }
        data = {
            "content": f"🤖 **Jarvis (Clone Mode):**\n> {text}"
        }
        wh_res = requests.post(WEBHOOK_URL, data=data, files=files)
        wh_res.raise_for_status()
        print("Successfully delivered to Discord.")
    except Exception as e:
        print(f"Discord Webhook Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("text", help="The text you want to synthesize and send")
    parser.add_argument("--prompt-wav", required=True, help="Path to the sample wav file")
    parser.add_argument("--prompt-text", required=True, help="The exact text spoken in the sample wav")
    args = parser.parse_args()
    synthesize_and_send(args.text, args.prompt_text, args.prompt_wav)
