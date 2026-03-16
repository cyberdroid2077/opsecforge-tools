#!/usr/bin/env python3
import sys
import os
import requests
import argparse

WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL", "")
TTS_URL = "http://127.0.0.1:8080/tts"

def synthesize_and_send(text, speaker="中文男"):
    if not WEBHOOK_URL:
        print("Error: DISCORD_WEBHOOK_URL environment variable is not set.")
        sys.exit(1)
        
    print(f"Synthesizing audio for: {text[:30]}...")
    
    # 1. 调取本地 4090 算力生成语音
    try:
        tts_res = requests.post(TTS_URL, json={
            "text": text,
            "speaker": speaker,
            "speed": 1.0,
            "response_format": "wav"
        })
        tts_res.raise_for_status()
        wav_data = tts_res.content
    except Exception as e:
        print(f"TTS API Error: {e}")
        sys.exit(1)
        
    # 2. 组装并通过 Webhook 推送到 Discord
    print("Uploading to Discord via Webhook...")
    try:
        files = {
            "file": ("voice_report.wav", wav_data, "audio/wav")
        }
        data = {
            "content": f"🤖 **Jarvis 语音播报:**\n> {text}"
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
    parser.add_argument("--speaker", default="中文男", help="Speaker voice name")
    args = parser.parse_args()
    synthesize_and_send(args.text, args.speaker)
