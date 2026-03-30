"""Configuration for the policy engine."""
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent
FAISS_INDEX_PATH = BASE_DIR / "faiss_index"
GRAPH_STATE_PATH = BASE_DIR / "graph_state.json"
SCENARIOS_PATH = BASE_DIR / "scenarios.json"


def _load_env_file(env_path: Path) -> None:
    """Minimal .env loader fallback when python-dotenv is unavailable."""
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    load_dotenv = None

env_path = BASE_DIR / ".env"
if load_dotenv is not None:
    load_dotenv(dotenv_path=env_path)
else:
    _load_env_file(env_path)

AMBEE_DATA_KEY = os.getenv("AMBEE_DATA_KEY", "")
# LLM Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
LLM_MODEL = "llama-3.3-70b-versatile"
LLM_TEMPERATURE = 0.2

# FAISS Configuration
EMBEDDINGS_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
FAISS_K_SEARCH = 3

# Graph Simulation
SIMULATION_PASSES = 6

# API Configuration
FLASK_PORT = 5000
FLASK_DEBUG = True
