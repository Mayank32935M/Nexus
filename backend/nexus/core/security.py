import os
from enum import Enum
from pathlib import Path
from typing import Tuple


class PermissionLevel(str, Enum):
    READ = "READ"
    WRITE = "WRITE"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"


class SecurityBoundaryViolation(Exception):
    """Raised when an operation attempts to break filesystem sandboxing or boundaries."""
    pass


class PermissionDeniedError(Exception):
    """Raised when an operation lacks necessary authorization level."""
    pass


def resolve_safe_path(base_dir: Path, requested_path: str | Path) -> Path:
    """
    Resolve a path relative to base_dir, strictly guaranteeing that it
    cannot escape the base directory (path traversal defense).

    Args:
        base_dir: The trusted root directory (e.g., nexus_memory)
        requested_path: The user or agent supplied path (relative or absolute)

    Returns:
        The canonical, validated absolute Path.

    Raises:
        SecurityBoundaryViolation: If path attempts to escape base_dir.
    """
    base_canonical = base_dir.resolve()
    
    # Normalize path string
    path_str = str(requested_path).strip()
    
    # Remove any leading drive letters or root slashes if provided relatively
    if not os.path.isabs(path_str):
        candidate = (base_canonical / path_str).resolve()
    else:
        candidate = Path(path_str).resolve()

    try:
        # Check if candidate is within or identical to base_canonical
        candidate.relative_to(base_canonical)
    except ValueError:
        raise SecurityBoundaryViolation(
            f"Security Boundary Violation: Path '{path_str}' is outside allowed root '{base_canonical}'"
        )

    return candidate


def classify_permission(relative_path: str, action: str = "write") -> PermissionLevel:
    """
    Classify the required permission level for a given path and action.

    Rules:
    - READ operations are always PermissionLevel.READ.
    - Any DELETE action requires PermissionLevel.APPROVAL_REQUIRED.
    - Writes to CORE/ require PermissionLevel.APPROVAL_REQUIRED.
    - Writes to DECISIONS/ require PermissionLevel.APPROVAL_REQUIRED.
    - Routine writes to PROJECTS/, SESSION-HISTORY/, AI-HANDOFF/, DAILY-LOGS/, KNOWLEDGE/ are PermissionLevel.WRITE.
    """
    action_upper = action.strip().upper()
    if action_upper == "READ":
        return PermissionLevel.READ

    if action_upper == "DELETE":
        return PermissionLevel.APPROVAL_REQUIRED

    normalized = relative_path.replace("\\", "/").strip().lstrip("/")
    parts = normalized.split("/")
    first_dir = parts[0].upper() if parts else ""

    if first_dir in ("CORE", "DECISIONS"):
        return PermissionLevel.APPROVAL_REQUIRED

    return PermissionLevel.WRITE


def is_approval_needed(relative_path: str, action: str = "write") -> bool:
    """Returns True if the operation requires human approval."""
    level = classify_permission(relative_path, action)
    return level == PermissionLevel.APPROVAL_REQUIRED
