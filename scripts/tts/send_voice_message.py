#!/usr/bin/env python3
import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import requests

DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL", "")
LEGACY_TTS_URL = os.environ.get("LEGACY_TTS_URL", "http://127.0.0.1:8080/tts")
CV3_CMD = os.environ.get("COZYVOICE3_ONCE_CMD", "/home/dingw/.local/bin/cosyvoice3_once")
CV3_PROMPT_WAV = os.environ.get(
    "COZYVOICE3_PROMPT_WAV", "/home/dingw/cosyvoice-server/asset/zero_shot_prompt.wav"
)
CV3_PROMPT_TEXT = os.environ.get(
    "COZYVOICE3_PROMPT_TEXT",
    "You are a helpful assistant.<|endofprompt|>希望你以后能够做得比我还好。",
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate and send a Discord voice message.")
    parser.add_argument("text", help="Text content to synthesize and send.")
    parser.add_argument("--tts", choices=["cozy3", "legacy"], default="cozy3")
    parser.add_argument("--webhook-url", default=DISCORD_WEBHOOK_URL)
    parser.add_argument("--content-prefix", default="语音消息")
    parser.add_argument("--filename", default="voice_message.wav")
    parser.add_argument("--speaker", default="中文女", help="Legacy CozyVoice speaker.")
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--prompt-wav", default=CV3_PROMPT_WAV)
    parser.add_argument("--prompt-text", default=CV3_PROMPT_TEXT)
    parser.add_argument("--dry-run", action="store_true")
    return parser


def synthesize_legacy(text: str, speaker: str, speed: float, out_path: Path) -> None:
    response = requests.post(
        LEGACY_TTS_URL,
        json={
            "text": text,
            "speaker": speaker,
            "speed": speed,
            "response_format": "wav",
        },
        timeout=120,
    )
    response.raise_for_status()
    out_path.write_bytes(response.content)


def synthesize_cozy3(text: str, speed: float, prompt_wav: str, prompt_text: str, out_path: Path) -> None:
    cmd = [
        CV3_CMD,
        text,
        "--out",
        str(out_path),
        "--prompt-wav",
        prompt_wav,
        "--prompt-text",
        prompt_text,
        "--speed",
        str(speed),
    ]
    subprocess.run(cmd, check=True)


def upload_to_discord(webhook_url: str, text: str, content_prefix: str, file_path: Path, filename: str) -> None:
    with file_path.open("rb") as f:
        response = requests.post(
            webhook_url,
            data={"content": f"🔊 **{content_prefix}**\n> {text}"},
            files={"file": (filename, f, "audio/wav")},
            timeout=120,
        )
    response.raise_for_status()


def main() -> int:
    args = build_parser().parse_args()
    if not args.webhook_url and not args.dry_run:
        raise SystemExit("Missing Discord webhook URL.")

    with tempfile.TemporaryDirectory(prefix="send-voice-") as tmpdir:
        out_path = Path(tmpdir) / args.filename
        if args.tts == "cozy3":
            synthesize_cozy3(args.text, args.speed, args.prompt_wav, args.prompt_text, out_path)
        else:
            synthesize_legacy(args.text, args.speaker, args.speed, out_path)

        if args.dry_run:
            print(out_path)
            return 0

        upload_to_discord(args.webhook_url, args.text, args.content_prefix, out_path, args.filename)
        print("sent")
        return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
