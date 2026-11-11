import pytest
from nexus.api.routes_health import get_health
from nexus.api.routes_memory import (
    get_memory_tree,
    read_memory_file,
    write_memory_file,
    search_memory,
    FileWriteRequest,
)
from nexus.api.routes_projects import (
    list_projects,
    create_project,
    get_project_context,
    update_project_progress,
    ProjectCreateRequest,
    ProjectProgressRequest,
)
from nexus.api.routes_approvals import (
    list_approvals,
    propose_update,
    approve_proposal,
    ProposeUpdateRequest,
    ReviewActionRequest,
)
from nexus.api.routes_handoff import (
    generate_handoff,
    list_sessions,
    HandoffGenerateRequest,
)
from nexus.api.routes_providers import get_mcp_client_config
from nexus.api.routes_audit import list_audit_trail
from fastapi import HTTPException


def test_api_health_handler():
    res = get_health()
    assert res["status"] == "healthy"
    assert res["version"] == "0.1.0"


def test_api_memory_handlers(temp_env):
    # Tree
    tree = get_memory_tree()
    assert isinstance(tree, list)

    # Read
    doc = read_memory_file(path="CORE/SYSTEM.md")
    assert doc["title"] == "NEXUS Core Test"
    assert doc["category"] == "CORE"

    # Governance rejection when writing to CORE directly without bypass
    with pytest.raises(HTTPException) as exc_info:
        write_memory_file(
            FileWriteRequest(
                path="CORE/SYSTEM.md",
                content="# Direct Overwrite Attempt",
                agent="external-client",
                bypass_approval=False,
            )
        )
    assert exc_info.value.status_code == 403

    # Permitted write
    writable = write_memory_file(
        FileWriteRequest(
            path="KNOWLEDGE/test_doc.md",
            content="# Permitted Doc\nRoutine write.",
            agent="dashboard-user",
            bypass_approval=False,
        )
    )
    assert writable["title"] == "Permitted Doc"

    # Search
    hits = search_memory(query="Permitted")
    assert len(hits) > 0


def test_api_project_handlers(temp_env):
    # Create project
    created = create_project(
        ProjectCreateRequest(name="API-PROJ", description="API Workspace Test")
    )
    assert created["name"] == "API-PROJ"
    assert len(created["files_created"]) == 6

    # List
    projects = list_projects()
    assert any(p["name"] == "API-PROJ" for p in projects)

    # Context bundle
    ctx = get_project_context(name="API-PROJ")
    assert "ARCHITECTURE.md" in ctx["documents"]
    assert "API-PROJ" in ctx["context_bundle"]

    # Progress update
    prog = update_project_progress(
        name="API-PROJ",
        req=ProjectProgressRequest(
            task="API route verification",
            status="completed",
            notes="Direct handler call",
            agent="test-agent",
        ),
    )
    assert prog["project_name"] == "API-PROJ"


def test_api_approvals_handlers(temp_env):
    # Propose update
    proposal = propose_update(
        ProposeUpdateRequest(
            file_path="CORE/SYSTEM.md",
            proposed_content="# Staged Core Update\nRequires approval.",
            reason="Adding audit directive",
            agent="claude-desktop",
        )
    )
    p_id = proposal["id"]
    assert proposal["status"] == "PENDING"

    # List pending
    pending = list_approvals(status="PENDING")
    assert any(p["id"] == p_id for p in pending)

    # Approve
    approved = approve_proposal(
        approval_id=p_id,
        req=ReviewActionRequest(reviewer="Admin"),
    )
    assert approved["status"] == "APPROVED"


def test_api_handoff_and_providers_handlers(temp_env):
    # Generate handoff
    handoff = generate_handoff(
        HandoffGenerateRequest(
            session_title="API Suite Verification",
            target_model="Claude Desktop",
            current_goal="Verify all REST API handlers",
            completed_work=["Tested memory routes", "Tested project routes"],
            decisions_made=["Verified direct router execution"],
            next_steps=["Ship v0.1 milestone"],
            project_name="NEXUS",
        )
    )
    assert "AI-HANDOFF/" in handoff["file_path"]

    # List sessions
    sessions = list_sessions()
    assert len(sessions) > 0

    # MCP config
    mcp_config = get_mcp_client_config()
    assert "nexus-memory" in mcp_config["config_json"]["mcpServers"]

    # Audit trail
    logs = list_audit_trail()
    assert len(logs) > 0
