# CosyVoice TTS Server Setup Instructions

Please deploy the CosyVoice TTS API server on this local Ubuntu machine.
The machine has an NVIDIA RTX 4090 (24GB VRAM) and CUDA 12.x installed.

Target directory: `/home/dingw/cosyvoice-server`

## Task Requirements:

1.  **Clone the Repository:**
    Clone the official CosyVoice repository (e.g., `https://github.com/FunAudioLLM/CosyVoice.git`) into the target directory.

2.  **Environment Setup (Conda/Venv):**
    Create a new Python environment (Python 3.10 is recommended) specifically for CosyVoice to avoid dependency conflicts.
    Install all required dependencies (PyTorch for CUDA 12.x, Torchaudio, Torchaudio, FastAPI, Uvicorn, etc.) according to their `requirements.txt`.
    *Note: Ensure `flash-attn` and `xformers` are installed correctly for the RTX 4090 to maximize inference speed.*

3.  **Model Download:**
    Download the `CosyVoice-300M-SFT` and `CosyVoice-300M` models (via HuggingFace or ModelScope) into the `pretrained_models` directory as per their documentation.

4.  **API Server Implementation:**
    Create a `server.py` script using FastAPI. The server should expose an endpoint (e.g., `POST /tts`) that:
    - Accepts JSON payload: `{"text": "Hello world", "speaker": "中文女", "speed": 1.0}`
    - Uses CosyVoice to generate the audio waveform.
    - Returns the audio as a streaming response or base64 encoded WAV/MP3 file.

5.  **Service Daemon (Systemd):**
    Create a `cosyvoice.service` systemd file to run this FastAPI server automatically on port `8080` (or similar) on startup, running as the `dingw` user.

6.  **Testing Script:**
    Write a simple `test_client.js` or `test_client.py` in `/home/dingw/opsecforge-tools/scripts/tts/` to ping the `localhost:8080/tts` endpoint and save `output.wav`.

**Execution:**
Execute these steps directly on the remote Linux host. Please log any errors encountered during the Conda/pip installation process.
