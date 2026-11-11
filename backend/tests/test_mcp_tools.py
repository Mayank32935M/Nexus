import json
from nexus.memory.vault import MemoryVault
from nexus.projects.service import ProjectService
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


def test_mcp_tools_suite(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    proj_svc = ProjectService(vault)
    proj_svc.create_project("MCP-TARGET", "MCP Testing workspace")

    # 1. tool_list_projects
    projects = tool_list_projects()
    assert any(p["name"] == "MCP-TARGET" for p in projects)

    # 2. tool_read_memory
    read_res = tool_read_memory("CORE/SYSTEM.md")
    assert read_res["success"] is True
    assert "NEXUS Core Test" in read_res["content"]

    # Traversal test via tool_read_memory
    traversal_res = tool_read_memory("../../windows/system32/cmd.exe")
    assert traversal_res["success"] is False
    assert "Security Boundary Violation" in traversal_res["error"]

    # 3. tool_get_project_context
    ctx = tool_get_project_context("MCP-TARGET")
    assert "PROJECT-OVERVIEW.md" in ctx["documents"]
    assert "MCP-TARGET" in ctx["context_bundle"]

    # 4. tool_create_session_summary
    summary_res = tool_create_session_summary(
        session_id="sess-100",
        title="MCP Initial Session",
        summary="Verified tool interface successfully.",
        next_steps=["Deploy MCP config snippet"],
        agent="claude-desktop",
    )
    assert summary_res["success"] is True
    assert "SESSION-HISTORY/" in summary_res["path"]

    # 5. tool_propose_memory_update (CORE target requires approval)
    proposal_res = tool_propose_memory_update(
        file_path="CORE/SYSTEM.md",
        proposed_content="# New System Rules\nStrict MCP rules.",
        reason="Security hardening",
        agent="claude-desktop",
    )
    assert proposal_res["status"] == "APPROVAL_REQUIRED"
    assert "proposal" in proposal_res

    # 6. tool_update_project_progress
    prog_res = tool_update_project_progress(
        project_name="MCP-TARGET",
        task="Test MCP Bridge",
        status="completed",
        notes="Passed automated verification",
        agent="claude-desktop",
    )
    assert prog_res["success"] is True

    # 7. tool_search_memory
    search_hits = tool_search_memory("NEXUS")
    assert len(search_hits) > 0

