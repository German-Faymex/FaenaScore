import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path so `app.*` imports resolve
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

# Defaults for settings (tests don't need real DB for pure unit tests)
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")
os.environ.setdefault("AUTH_MOCK_ENABLED", "true")
os.environ.setdefault("DEBUG", "true")
