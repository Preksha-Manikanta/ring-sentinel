import sys
from pathlib import Path

# make the repo root importable for `engine`, `llm`, `audit`, `eval`, `api`
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
