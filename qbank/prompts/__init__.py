import os

PROMPTS_DIR = os.path.dirname(os.path.abspath(__file__))


def load_prompt_template(name: str) -> str:
    """Loads a prompt template text file by filename or name."""
    if not name.endswith(".txt"):
        name = f"{name}.txt"
    path = os.path.join(PROMPTS_DIR, name)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Prompt template '{name}' not found at {path}")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()
