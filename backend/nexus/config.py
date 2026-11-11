import os
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings if False else object # type: ignore
from dotenv import load_dotenv

# Find project root (one level up from backend if running inside backend, or cwd)
BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent if (BACKEND_DIR.parent / "nexus_memory").exists() or (BACKEND_DIR.parent / ".git").exists() else BACKEND_DIR

# Load .env file from project root or backend dir
env_path = PROJECT_ROOT / ".env"
if env_path.exists():
    load_dotenv(env_path)
elif (BACKEND_DIR / ".env").exists():
    load_dotenv(BACKEND_DIR / ".env")


class Settings:
    """NEXUS System Settings."""

    def __init__(self):
        self.nexus_env: str = os.getenv("NEXUS_ENV", "development")
        self.debug: bool = os.getenv("DEBUG", "true").lower() in ("1", "true", "yes")
        
        # Network & Server
        self.nexus_host: str = os.getenv("NEXUS_HOST", "127.0.0.1")
        self.nexus_port: int = int(os.getenv("NEXUS_PORT", "8000"))
        self.frontend_port: int = int(os.getenv("FRONTEND_PORT", "5173"))
        
        # Memory Vault Root
        mem_dir = os.getenv("NEXUS_MEMORY_DIR", "./nexus_memory")
        if os.path.isabs(mem_dir):
            self.nexus_memory_dir: Path = Path(mem_dir).resolve()
        else:
            self.nexus_memory_dir: Path = (PROJECT_ROOT / mem_dir).resolve()
            
        # SQLite Database Path
        db_path = os.getenv("NEXUS_DB_PATH", "./nexus.db")
        if os.path.isabs(db_path):
            self.nexus_db_path: Path = Path(db_path).resolve()
        else:
            self.nexus_db_path: Path = (PROJECT_ROOT / db_path).resolve()
            
        # Providers
        self.ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        self.ollama_default_model: str = os.getenv("OLLAMA_DEFAULT_MODEL", "llama3.2")
        
        # MCP Server
        self.mcp_server_name: str = os.getenv("MCP_SERVER_NAME", "nexus-memory-mcp")
        self.mcp_log_level: str = os.getenv("MCP_LOG_LEVEL", "INFO")
        
        # Security Governance
        self.require_approval_for_core: bool = os.getenv("REQUIRE_APPROVAL_FOR_CORE", "true").lower() in ("1", "true", "yes")
        self.require_approval_for_decisions: bool = os.getenv("REQUIRE_APPROVAL_FOR_DECISIONS", "true").lower() in ("1", "true", "yes")
        self.require_approval_for_deletions: bool = os.getenv("REQUIRE_APPROVAL_FOR_DELETIONS", "true").lower() in ("1", "true", "yes")

    def ensure_directories(self) -> None:
        """Ensure necessary memory and db directories exist."""
        self.nexus_memory_dir.mkdir(parents=True, exist_ok=True)
        self.nexus_db_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Standard subdirectories
        for sub in ["CORE", "PROJECTS", "KNOWLEDGE", "SESSION-HISTORY", "AI-HANDOFF", "DECISIONS", "DAILY-LOGS"]:
            (self.nexus_memory_dir / sub).mkdir(parents=True, exist_ok=True)


# Global settings singleton
settings = Settings()
