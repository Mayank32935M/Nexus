import pytest
from pathlib import Path

from nexus.core.security import (
    PermissionLevel,
    SecurityBoundaryViolation,
    classify_permission,
    is_approval_needed,
    resolve_safe_path,
)


def test_resolve_safe_path_valid(temp_env):
    vault_dir = temp_env["vault_dir"]
    safe = resolve_safe_path(vault_dir, "CORE/SYSTEM.md")
    assert safe == (vault_dir / "CORE" / "SYSTEM.md").resolve()


def test_resolve_safe_path_traversal_attack(temp_env):
    vault_dir = temp_env["vault_dir"]
    with pytest.raises(SecurityBoundaryViolation):
        resolve_safe_path(vault_dir, "../../windows/system32/cmd.exe")


def test_resolve_safe_path_absolute_escape(temp_env):
    vault_dir = temp_env["vault_dir"]
    with pytest.raises(SecurityBoundaryViolation):
        resolve_safe_path(vault_dir, "C:/Windows/notepad.exe")


def test_classify_permissions():
    # Reads
    assert classify_permission("CORE/SYSTEM.md", "READ") == PermissionLevel.READ
    assert classify_permission("PROJECTS/APP/TASKS.md", "READ") == PermissionLevel.READ

    # CORE modifications require approval
    assert classify_permission("CORE/SYSTEM.md", "WRITE") == PermissionLevel.APPROVAL_REQUIRED
    assert classify_permission("CORE/AI-INSTRUCTIONS.md", "WRITE") == PermissionLevel.APPROVAL_REQUIRED
    assert is_approval_needed("CORE/SYSTEM.md", "write") is True

    # DECISIONS modifications require approval
    assert classify_permission("DECISIONS/ADR-001.md", "WRITE") == PermissionLevel.APPROVAL_REQUIRED
    assert is_approval_needed("DECISIONS/ADR-001.md", "write") is True

    # All deletions require approval
    assert classify_permission("PROJECTS/APP/TASKS.md", "DELETE") == PermissionLevel.APPROVAL_REQUIRED
    assert is_approval_needed("PROJECTS/APP/TASKS.md", "delete") is True

    # Routine project writes
    assert classify_permission("PROJECTS/APP/TASKS.md", "WRITE") == PermissionLevel.WRITE
    assert classify_permission("SESSION-HISTORY/2026-11-11_session.md", "WRITE") == PermissionLevel.WRITE
    assert is_approval_needed("PROJECTS/APP/TASKS.md", "write") is False

