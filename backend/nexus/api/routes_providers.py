import sys
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel

from nexus.config import settings
from nexus.providers.ollama import OllamaProvider

router = APIRouter(prefix="/providers", tags=["AI Providers & Integrations"])


@router.get("/status")
async def get_providers_status():
    """Returns connectivity and capability status for all registered model providers."""
    ollama = OllamaProvider()
    ollama_stat = await ollama.check_health()

    return [
        {
            "id": "ollama",
            "name": "Local Ollama",
            "kind": "local",
            "connected": ollama_stat.connected,
            "status_message": ollama_stat.status_message,
            "models": ollama_stat.available_models,
            "endpoint": settings.ollama_base_url,
            "description": "Private, zero-cloud local LLM execution via Ollama daemon.",
        },
        {
            "id": "claude_desktop_mcp",
            "name": "Claude Desktop (Local MCP)",
            "kind": "mcp",
            "connected": True,
            "status_message": "Ready for connection via stdio MCP bridge",
            "models": ["Claude 3.5 Sonnet", "Claude 3.7 Sonnet"],
            "endpoint": "stdio",
            "description": "Direct memory retrieval and proposal governance via official Model Context Protocol.",
        },
        {
            "id": "chatgpt_handoff",
            "name": "ChatGPT",
            "kind": "connector",
            "connected": True,
            "status_message": "Ready via structured markdown handoffs",
            "models": ["GPT-4o", "o1", "o3-mini"],
            "endpoint": "filesystem/export",
            "description": "Cross-session continuity through structured handoff documents.",
        },
        {
            "id": "gemini_handoff",
            "name": "Google Gemini",
            "kind": "connector",
            "connected": True,
            "status_message": "Ready via multimodal context handoffs",
            "models": ["Gemini 1.5 Pro", "Gemini 2.0 Flash"],
            "endpoint": "filesystem/export",
            "description": "Research, multimodal analysis, and document review handoffs.",
        },
        {
            "id": "jarvis_operator",
            "name": "JARVIS Autonomous Operator",
            "kind": "agent",
            "connected": False,
            "status_message": "Roadmap Phase 3 (Architecture prepared)",
            "models": ["Local Voice / System Agent"],
            "endpoint": "local-ipc",
            "description": "Voice recognition, wake-word, system monitoring, and permission-controlled OS actions.",
        },
    ]


@router.post("/ollama/test")
async def test_ollama():
    """Explicitly probes local Ollama daemon."""
    ollama = OllamaProvider()
    return await ollama.check_health()


@router.get("/mcp/config")
def get_mcp_client_config():
    """
    Generates exact JSON configuration snippet to connect Claude Desktop
    or any standard MCP client to NEXUS.
    """
    python_exe = sys.executable
    backend_dir = Path(__file__).resolve().parent.parent.parent
    memory_dir = settings.nexus_memory_dir

    config_snippet = {
        "mcpServers": {
            "nexus-memory": {
                "command": str(python_exe),
                "args": ["-m", "nexus.mcp.server"],
                "cwd": str(backend_dir),
                "env": {
                    "PYTHONPATH": str(backend_dir),
                    "NEXUS_MEMORY_DIR": str(memory_dir),
                    "NEXUS_DB_PATH": str(settings.nexus_db_path),
                },
            }
        }
    }

    return {
        "server_name": settings.mcp_server_name,
        "config_json": config_snippet,
        "target_file_windows": "%APPDATA%\\Claude\\claude_desktop_config.json",
        "instructions": (
            "1. Copy the configuration JSON.\n"
            "2. Open Claude Desktop Settings -> Developer -> Edit Config.\n"
            "3. Paste into claude_desktop_config.json under 'mcpServers'.\n"
            "4. Restart Claude Desktop."
        ),
    }

