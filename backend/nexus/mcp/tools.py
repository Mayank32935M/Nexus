import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from nexus.config import settings
from nexus.core.security import (
    PermissionLevel,
    SecurityBoundaryViolation,
    classify_permission,
    resolve_safe_path,
)
from nexus.memory.vault import MemoryVault
from nexus.memory.search import MemorySearchEngine
from nexus.memory.approvals import ApprovalEngine
from nexus.projects.service import ProjectService
from nexus.core.database import get_db_connection, log_audit_event


def get_vault() -> MemoryVault:
    return MemoryVault()


def get_search() -> MemorySearchEngine:
    return MemorySearchEngine()


def get_approvals() -> ApprovalEngine:
    return ApprovalEngine()


def get_projects() -> ProjectService:
    return ProjectService()


def tool_search_memory(
    query: str,
    project: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Search across NEXUS persistent memory vault using full-text search.
    """
    search_eng = get_search()
    return search_eng.search(query=query, category=category, project_name=project, limit=limit)


def tool_read_memory(path: str) -> Dict[str, Any]:
    """
    Safely read a Markdown document from NEXUS memory vault.
    Strictly verifies boundary checks to prevent path traversal.
    """
    vault = get_vault()
    try:
        data = vault.read_file(path)
        log_audit_event(
            event_type="READ",
            file_path=data["path"],
            agent="mcp-client",
            details={"action": "read_memory"},
        )
        return {
            "success": True,
            "path": data["path"],
            "title": data["title"],
            "category": data["category"],
            "content": data["content"],
            "last_modified": data["last_modified"],
        }
    except SecurityBoundaryViolation as sb:
        return {"success": False, "error": f"Security Boundary Violation: {str(sb)}"}
    except FileNotFoundError:
        return {"success": False, "error": f"File not found: {path}"}
    except Exception as ex:
        return {"success": False, "error": str(ex)}


def tool_list_projects() -> List[Dict[str, Any]]:
    """
    List all registered project workspaces in NEXUS memory.
    """
    proj_svc = get_projects()
    return proj_svc.list_projects()


def tool_get_project_context(project_name: str) -> Dict[str, Any]:
    """
    Retrieve the consolidated operational context and documentation bundle for a project.
    """
    proj_svc = get_projects()
    try:
        return proj_svc.get_project_context(project_name)
    except FileNotFoundError:
        return {"error": f"Project '{project_name}' not found."}


def tool_get_recent_decisions(limit: int = 10, project: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Retrieve recent architectural decisions (ADRs) recorded in NEXUS memory.
    """
    search_eng = get_search()
    # Search within DECISIONS category or project decisions
    results = search_eng.search(query="", category="DECISIONS", project_name=project, limit=limit)
    return results


def tool_create_session_summary(
    session_id: str,
    title: str,
    summary: str,
    next_steps: Optional[List[str]] = None,
    agent: str = "mcp-agent",
) -> Dict[str, Any]:
    """
    Record an AI session summary into persistent memory.
    """
    vault = get_vault()
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y-%m-%d")
    slug = "".join([c if c.isalnum() else "_" for c in title.lower()]).strip("_")[:30]
    filename = f"{date_str}_{slug or 'session'}.md"
    rel_path = f"SESSION-HISTORY/{filename}"

    next_steps_fmt = "\n".join([f"- [ ] {step}" for step in (next_steps or [])]) or "- [ ] None recorded"

    content = f"""---
title: "Session Summary: {title}"
session_id: {session_id}
date: {date_str}
created_at: {now.isoformat()}
author: {agent}
tags: [session-history, {agent.lower()}]
---

# Session Summary — {title}

**Session ID**: `{session_id}`  
**Agent**: `{agent}`  
**Timestamp**: `{now.isoformat()}`  

## Summary
{summary}

## Next Immediate Steps
{next_steps_fmt}
"""

    vault.write_file(rel_path, content, agent=agent, bypass_approval_check=True)
    
    # Update index
    from nexus.memory.indexer import VaultIndexer
    VaultIndexer(vault).index_single_file(rel_path)

    return {
        "success": True,
        "path": rel_path,
        "session_id": session_id,
        "created_at": now.isoformat(),
    }


def tool_propose_memory_update(
    file_path: str,
    proposed_content: str,
    reason: str,
    agent: str = "mcp-agent",
) -> Dict[str, Any]:
    """
    Propose an update to memory. If target is in CORE or DECISIONS, stages for human approval.
    """
    approvals = get_approvals()
    vault = get_vault()

    try:
        safe_path = vault.get_safe_path(file_path)
        norm_path = vault.to_relative_path(safe_path)
        perm = classify_permission(norm_path, "write")

        if perm == PermissionLevel.APPROVAL_REQUIRED:
            # Stage for human approval
            proposal = approvals.propose_update(
                file_path=norm_path,
                proposed_content=proposed_content,
                reason=reason,
                agent=agent,
            )
            return {
                "status": "APPROVAL_REQUIRED",
                "message": f"Proposal staged for human review (ID: {proposal['id']}). Sensitive memory cannot be directly modified.",
                "proposal": proposal,
            }
        else:
            # Directly writable
            updated = vault.write_file(norm_path, proposed_content, agent=agent)
            from nexus.memory.indexer import VaultIndexer
            VaultIndexer(vault).index_single_file(norm_path)
            return {
                "status": "APPLIED",
                "message": f"Document '{norm_path}' updated successfully.",
                "path": norm_path,
            }
    except SecurityBoundaryViolation as sb:
        return {"status": "ERROR", "error": f"Security Boundary Violation: {str(sb)}"}
    except Exception as ex:
        return {"status": "ERROR", "error": str(ex)}


def tool_update_project_progress(
    project_name: str,
    task: str,
    status: str,
    notes: Optional[str] = None,
    agent: str = "mcp-agent",
) -> Dict[str, Any]:
    """
    Update task status and append changelog progress in a project workspace.
    """
    proj_svc = get_projects()
    try:
        res = proj_svc.update_project_progress(
            project_name=project_name,
            task=task,
            status=status,
            notes=notes or "",
            agent=agent,
        )
        return {"success": True, "details": res}
    except Exception as ex:
        return {"success": False, "error": str(ex)}

