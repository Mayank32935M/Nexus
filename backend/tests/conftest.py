import shutil
import tempfile
from pathlib import Path
import pytest

from nexus.config import settings
from nexus.core.database import init_db
from nexus.providers.base import ProviderStatus


@pytest.fixture(autouse=True)
def mock_ollama_offline(monkeypatch):
    """Ensure tests never attempt real network connections to Ollama."""
    async def mock_health(*args, **kwargs):
        return ProviderStatus(
            provider_id="ollama",
            name="Local Ollama",
            connected=False,
            status_message="Offline in test",
            available_models=[],
        )
    monkeypatch.setattr("nexus.providers.ollama.OllamaProvider.check_health", mock_health)


@pytest.fixture
def temp_env(monkeypatch):
    """Creates an isolated temporary memory vault and SQLite database for tests."""
    temp_dir = Path(tempfile.mkdtemp(prefix="nexus_test_"))
    vault_dir = temp_dir / "nexus_memory"
    vault_dir.mkdir(parents=True, exist_ok=True)
    for sub in ["CORE", "PROJECTS", "KNOWLEDGE", "SESSION-HISTORY", "AI-HANDOFF", "DECISIONS", "DAILY-LOGS"]:
        (vault_dir / sub).mkdir(parents=True, exist_ok=True)

    db_path = temp_dir / "test_nexus.db"

    # Patch settings
    monkeypatch.setattr(settings, "nexus_memory_dir", vault_dir)
    monkeypatch.setattr(settings, "nexus_db_path", db_path)

    # Initialize DB
    init_db(db_path)

    # Seed CORE SYSTEM.md
    core_system = vault_dir / "CORE" / "SYSTEM.md"
    core_system.write_text(
        "---\ntitle: NEXUS Core Test\nversion: 0.1\n---\n# NEXUS Test Core\nInitial system context.",
        encoding="utf-8",
    )

    yield {
        "root": temp_dir,
        "vault_dir": vault_dir,
        "db_path": db_path,
    }

    # Teardown
    shutil.rmtree(temp_dir, ignore_errors=True)
