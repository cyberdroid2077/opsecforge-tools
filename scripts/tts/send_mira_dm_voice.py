#!/usr/bin/env python3
import argparse
import subprocess
import tempfile
from pathlib import Path

COZY3 = "/home/dingw/.local/bin/cosyvoice3_once"
LEGACY_TTS_URL = "http://127.0.0.1:8080/tts"
DISCORD_VOICE_SEND = "/home/dingw/opsecforge-tools/scripts/tts/send_discord_voice.mjs"
MEDIA_TMP_ROOT = Path("/home/dingw/.openclaw/media/outbound")
PROMPT_WAV = "/home/dingw/cosyvoice-server/asset/zero_shot_prompt.wav"
PROMPT_TEXT = "You are a helpful assistant.<|endofprompt|>希望你以后能够做得比我还好。"
MIRA_ACCOUNT = "mira"


def build_parser():
    p = argparse.ArgumentParser(description="Generate and send a Mira Discord DM voice reply")
    p.add_argument("target", help="Discord user id to DM")
    p.add_argument("text", help="Text to speak")
    p.add_argument("--tts", choices=["legacy", "cozy3"], default="legacy")
    p.add_argument("--speed", type=float, default=1.0)
    p.add_argument("--speaker", default="中文女")
    p.add_argument("--prompt-wav", default=PROMPT_WAV)
    p.add_argument("--prompt-text", default=PROMPT_TEXT)
    p.add_argument("--dry-run", action="store_true")
    return p


def main():
    args = build_parser().parse_args()
    target = args.target if ":" in args.target else f"user:{args.target}"
    MEDIA_TMP_ROOT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="mira-dm-voice-", dir=str(MEDIA_TMP_ROOT)) as td:
        out = Path(td) / "mira_voice.wav"
        if args.tts == "cozy3":
            subprocess.run([
                COZY3,
                args.text,
                "--out", str(out),
                "--prompt-wav", args.prompt_wav,
                "--prompt-text", args.prompt_text,
                "--speed", str(args.speed),
            ], check=True)
        else:
            subprocess.run([
                "curl",
                "-sS",
                "-X", "POST",
                LEGACY_TTS_URL,
                "-H", "Content-Type: application/json",
                "-o", str(out),
                "-d",
                '{"text": "' + args.text.replace("\\", "\\\\").replace('"', '\\"') + '", "speaker": "' + args.speaker + '", "speed": ' + str(args.speed) + ', "response_format": "wav"}',
            ], check=True)
        if args.dry_run:
            print(out)
            return
        subprocess.run([
            "node",
            DISCORD_VOICE_SEND,
            target,
            str(out),
            MIRA_ACCOUNT,
        ], check=True)

if __name__ == "__main__":
    main()
