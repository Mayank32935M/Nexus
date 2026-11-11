from datetime import datetime, timezone
from fastapi import APIRouter
from nexus.config import settings
from nexus.memory.vault import MemoryVault
from nexus.memory.approvals import ApprovalEngine
from nexus.projects.service import ProjectService
from nexus.providers.ollama import OllamaProvider

router = APIRouter(tags=["Health & System"])


@router.get("/health")
def get_health():
    """Basic health probe."""
    return {
        "status": "healthy",
        "service": "nexus-core",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/status")
async def get_system_status():
    """
    Comprehensive system status:
    Memory vault metrics, database status, active projects, pending approvals, provider connectivity.
    """
    vault = MemoryVault()
    stats = vault.get_stats()

    approvals = ApprovalEngine(vault)
    pending = approvals.list_approvals(status="PENDING")

    proj_svc = ProjectService(vault)
    projects = proj_svc.list_projects()

    ollama = OllamaProvider()
    ollama_status = await ollama.check_health()

    return {
        "system": {
            "status": "online",
            "version": "0.1.0",
            "environment": settings.nexus_env,
            "memory_dir": str(settings.nexus_memory_dir),
            "db_path": str(settings.nexus_db_path),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "stats": {
            "total_files": stats["total_files"],
            "total_words": stats["total_words"],
            "total_size_bytes": stats["total_size_bytes"],
            "total_projects": len(projects),
            "pending_approvals_count": len(pending),
            "categories": stats["categories"],
        },
        "integrations": {
            "mcp_server": {
                "name": settings.mcp_server_name,
                "status": "ready",
                "transport": "stdio",
                "tools_count": 8,
            },
            "ollama": {
                "name": "Local Ollama",
                "connected": ollama_status.connected,
                "status_message": ollama_status.status_message,
                "available_models": ollama_status.available_models,
            },
            "claude_desktop": {
                "name": "Claude Desktop (MCP)",
                "status": "configured",
                "notes": "Connectable via stdio MCP bridge",
            },
            "chatgpt": {
                "name": "ChatGPT",
                "status": "handoff-ready",
                "notes": "File & markdown-based structured handoffs supported",
            },
            "gemini": {
                "name": "Gemini",
                "status": "handoff-ready",
                "notes": "Multimodal and structured context handoff ready",
            },
            "jarvis": {
                "name": "JARVIS Autonomous Operator",
                "status": "roadmap-phase-3",
                "notes": "Voice control, wake-word, local computer operator planned",
            },
        },
        "active_projects": projects[:5],
        "pending_approvals": pending[:5],
    }

