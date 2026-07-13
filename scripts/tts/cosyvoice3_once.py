#!/home/dingw/cosyvoice-server/.venv/bin/python
import argparse
import sys
from pathlib import Path

ROOT = Path("/home/dingw/cosyvoice-server")
sys.path.append(str(ROOT))
sys.path.append(str(ROOT / "third_party" / "Matcha-TTS"))

import torch
import torchaudio
from cosyvoice.cli.cosyvoice import AutoModel

MODEL_DIR = ROOT / "pretrained_models" / "Fun-CosyVoice3-0.5B-2512"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="One-shot CozyVoice 3 synthesis")
    parser.add_argument("text", help="Text to synthesize")
    parser.add_argument("--out", required=True, help="Output wav path")
    parser.add_argument(
        "--mode",
        choices=["zero_shot", "cross_lingual", "instruct2"],
        default="zero_shot",
    )
    parser.add_argument(
        "--prompt-wav",
        help="Reference wav path required for zero_shot/cross_lingual/instruct2",
    )
    parser.add_argument(
        "--prompt-text",
        default="You are a helpful assistant.<|endofprompt|>",
        help="Prompt text prefix for zero_shot",
    )
    parser.add_argument(
        "--instruct-text",
        help="Instruction text for instruct2; should include <|endofprompt|>",
    )
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--fp16", action="store_true")
    return parser


def synthesize(args: argparse.Namespace) -> Path:
    model = AutoModel(model_dir=str(MODEL_DIR), fp16=args.fp16)
    prompt_wav = args.prompt_wav
    if args.mode in {"zero_shot", "cross_lingual", "instruct2"} and not prompt_wav:
        raise SystemExit("--prompt-wav is required for this mode")
    if args.mode == "instruct2" and not args.instruct_text:
        raise SystemExit("--instruct-text is required for instruct2 mode")

    if args.mode == "zero_shot":
        iterator = model.inference_zero_shot(
            args.text, args.prompt_text, prompt_wav, stream=False, speed=args.speed
        )
    elif args.mode == "cross_lingual":
        iterator = model.inference_cross_lingual(
            args.text, prompt_wav, stream=False, speed=args.speed
        )
    else:
        iterator = model.inference_instruct2(
            args.text,
            args.instruct_text,
            prompt_wav,
            stream=False,
            speed=args.speed,
        )

    chunks = []
    for item in iterator:
        speech = item["tts_speech"].detach().cpu()
        if speech.dim() == 1:
            speech = speech.unsqueeze(0)
        chunks.append(speech)
    if not chunks:
        raise SystemExit("No audio generated")

    audio = torch.cat(chunks, dim=1)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    torchaudio.save(str(out_path), audio, model.sample_rate)
    return out_path


if __name__ == "__main__":
    result = synthesize(build_parser().parse_args())
    print(result)
