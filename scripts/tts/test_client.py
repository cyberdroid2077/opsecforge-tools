#!/usr/bin/env python3
import argparse
from pathlib import Path

import requests


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--text", default="你好，我是 CosyVoice 测试语音。")
    parser.add_argument("--speaker", default="中文女")
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--output", default="/home/dingw/opsecforge-tools/scripts/tts/output.wav")
    parser.add_argument("--timeout", type=int, default=300)
    args = parser.parse_args()

    response = requests.post(
        f"http://{args.host}:{args.port}/tts",
        json={"text": args.text, "speaker": args.speaker, "speed": args.speed},
        timeout=args.timeout,
    )
    response.raise_for_status()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(response.content)
    print(f"Saved {output_path} ({len(response.content)} bytes)")


if __name__ == "__main__":
    main()
