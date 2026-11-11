import json
import logging
import sys
from typing import Any, List, Optional
from mcp.server.mcpserver import MCPServer

from nexus.config import settings
from nexus.mcp.tools import (
    tool_search_memory,
    tool_read_memory,
    tool_list_projects,
    tool_get_project_context,
    tool_get_recent_decisions,
    tool_create_session_summary,
    tool_propose_memory_update,
    tool_update_project_progress,
)

logger = logging.getLogger("nexus.mcp")

# Initialize MCP Server instance
mcp_server = MCPServer(name=settings.mcp_server_name)


@mcp_server.tool()
def search_memory(
    query: str,
    project: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 10,
) -> str:
    """
    Search NEXUS persistent memory vault using full-text search.
    Filter by category (e.g. CORE, PROJECTS, DECISIONS) or specific project name.
    """
    results = tool_search_memory(query=query, project=project, category=category, limit=limit)
    return json.dumps(results, indent=2)


@mcp_server.tool()
def read_memory(path: str) -> str:
    """
    Safely read a document from NEXUS memory vault (Obsidian-compatible Markdown).
    Guards strictly against path traversal.
    """
    res = tool_read_memory(path=path)
    return json.dumps(res, indent=2)


@mcp_server.tool()
def list_projects() -> str:
    """
    List all active project workspaces in NEXUS memory.
    """
    projects = tool_list_projects()
    return json.dumps(projects, indent=2)


@mcp_server.tool()
def get_project_context(project_name: str) -> str:
    """
    Retrieve consolidated operational context and documentation bundle for a project.
    """
    bundle = tool_get_project_context(project_name=project_name)
    return json.dumps(bundle, indent=2)


@mcp_server.tool()
def get_recent_decisions(limit: int = 10, project: Optional[str] = None) -> str:
    """
    Retrieve recent architectural decisions (ADRs) recorded in NEXUS memory.
    """
    decisions = tool_get_recent_decisions(limit=limit, project=project)
    return json.dumps(decisions, indent=2)


@mcp_server.tool()
def create_session_summary(
    session_id: str,
    title: str,
    summary: str,
    next_steps: Optional[List[str]] = None,
    agent: str = "claude-desktop",
) -> str:
    """
    Record an AI session summary into persistent memory (SESSION-HISTORY/).
    """
    res = tool_create_session_summary(
        session_id=session_id,
        title=title,
        summary=summary,
        next_steps=next_steps,
        agent=agent,
    )
    return json.dumps(res, indent=2)


@mcp_server.tool()
def propose_memory_update(
    file_path: str,
    proposed_content: str,
    reason: str,
    agent: str = "claude-desktop",
) -> str:
    """
    Propose an update to memory. Modifications to CORE or DECISIONS require human approval and are staged in the approval queue.
    """
    res = tool_propose_memory_update(
        file_path=file_path,
        proposed_content=proposed_content,
        reason=reason,
        agent=agent,
    )
    return json.dumps(res, indent=2)


@mcp_server.tool()
def update_project_progress(
    project_name: str,
    task: str,
    status: str,
    notes: Optional[str] = None,
    agent: str = "claude-desktop",
) -> str:
    """
    Update task status and append changelog progress in a project workspace.
    """
    res = tool_update_project_progress(
        project_name=project_name,
        task=task,
        status=status,
        notes=notes,
        agent=agent,
    )
    return json.dumps(res, indent=2)


def main():
    """CLI Entry point for MCP stdio server."""
    logging.basicConfig(level=logging.INFO, stream=sys.stderr)
    logger.info("Starting NEXUS MCP Server on stdio transport...")
    mcp_server.run(transport="stdio")


if __name__ == "__main__":
    main()

