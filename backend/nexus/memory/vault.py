import hashlib
import os
import re
import yaml
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from nexus.config import settings
from nexus.core.security import (
    PermissionLevel,
    SecurityBoundaryViolation,
    classify_permission,
    resolve_safe_path,
    PermissionDeniedError,
)
from nexus.core.database import log_audit_event


def parse_markdown_content(raw_text: str) -> Tuple[Dict[str, Any], str, str]:
    """
    Parses markdown frontmatter (YAML) if present, and extracts the primary title.

    Returns:
        (frontmatter_dict, body_text, title)
    """
    frontmatter = {}
    body = raw_text
    title = ""

    # Match YAML frontmatter between leading ---
    fm_pattern = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
    match = fm_pattern.match(raw_text)
    if match:
        fm_text = match.group(1)
        body = raw_text[match.end():]
        try:
            parsed = yaml.safe_load(fm_text)
            if isinstance(parsed, dict):
                frontmatter = parsed
                if "title" in frontmatter:
                    title = str(frontmatter["title"]).strip()
        except Exception:
            pass

    if not title:
        # Search for first Markdown header # Title
        header_match = re.search(r"^\s*#\s+(.+)$", body, re.MULTILINE)
        if header_match:
            title = header_match.group(1).strip()

    return frontmatter, body, title


def get_path_metadata(relative_path: str) -> Tuple[str, Optional[str]]:
    """
    Determines category and project name from relative vault path.
    Example:
      'PROJECTS/SPECTRIX/TASKS.md' -> ('PROJECTS', 'SPECTRIX')
      'CORE/SYSTEM.md' -> ('CORE', None)
    """
    norm = relative_path.replace("\\", "/").strip().lstrip("/")
    parts = norm.split("/")
    first = parts[0].upper() if parts else "GENERAL"

    project_name = None
    if first == "PROJECTS" and len(parts) > 1:
        project_name = parts[1]

    category = first if first in ("CORE", "PROJECTS", "KNOWLEDGE", "SESSION-HISTORY", "AI-HANDOFF", "DECISIONS", "DAILY-LOGS") else "GENERAL"
    return category, project_name


class MemoryVault:
    """Manages filesystem operations for the Obsidian-compatible Markdown vault."""

    def __init__(self, root_dir: Optional[Path] = None):
        self.root_dir = (root_dir or settings.nexus_memory_dir).resolve()
        settings.ensure_directories()

    def get_safe_path(self, relative_path: str | Path) -> Path:
        """Resolves path safely inside vault root."""
        return resolve_safe_path(self.root_dir, relative_path)

    def to_relative_path(self, absolute_path: Path) -> str:
        """Convert an absolute path within vault to a standard normalized relative path."""
        rel = absolute_path.resolve().relative_to(self.root_dir)
        return str(rel).replace("\\", "/")

    def read_file(self, relative_path: str) -> Dict[str, Any]:
        """
        Reads a markdown file from the vault, parsing frontmatter and metadata.
        """
        safe_path = self.get_safe_path(relative_path)
        if not safe_path.exists() or not safe_path.is_file():
            raise FileNotFoundError(f"Memory document not found: {relative_path}")

        raw_text = safe_path.read_text(encoding="utf-8")
        frontmatter, body, extracted_title = parse_markdown_content(raw_text)
        
        stat = safe_path.stat()
        mtime = datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat()
        
        norm_rel = self.to_relative_path(safe_path)
        category, project_name = get_path_metadata(norm_rel)
        title = extracted_title or safe_path.stem
        permission = classify_permission(norm_rel, "read").value

        words = len(raw_text.split())
        content_hash = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()

        return {
            "path": norm_rel,
            "title": title,
            "category": category,
            "project_name": project_name,
            "permission": permission,
            "frontmatter": frontmatter,
            "content": raw_text,
            "body": body,
            "word_count": words,
            "content_hash": content_hash,
            "last_modified": mtime,
            "file_size": stat.st_size,
        }

    def write_file(
        self,
        relative_path: str,
        content: str,
        agent: str = "system",
        bypass_approval_check: bool = False,
    ) -> Dict[str, Any]:
        """
        Writes a markdown document to the vault.
        Enforces governance: requires approval for CORE/ or DECISIONS/ unless bypass_approval_check is True.
        """
        safe_path = self.get_safe_path(relative_path)
        norm_rel = self.to_relative_path(safe_path)

        req_perm = classify_permission(norm_rel, "write")
        if req_perm == PermissionLevel.APPROVAL_REQUIRED and not bypass_approval_check:
            raise PermissionDeniedError(
                f"Modifications to '{norm_rel}' require explicit approval. Propose a staged update instead."
            )

        safe_path.parent.mkdir(parents=True, exist_ok=True)

        is_create = not safe_path.exists()
        # Atomic write
        temp_path = safe_path.with_suffix(".tmp")
        temp_path.write_text(content, encoding="utf-8")
        temp_path.replace(safe_path)

        event_type = "CREATE" if is_create else "UPDATE"
        log_audit_event(
            event_type=event_type,
            file_path=norm_rel,
            agent=agent,
            details={"length": len(content)},
        )

        return self.read_file(norm_rel)

    def delete_file(
        self,
        relative_path: str,
        agent: str = "system",
        bypass_approval_check: bool = False,
    ) -> None:
        """
        Deletes a file from the vault.
        Enforces governance: all deletions require approval unless authorized.
        """
        safe_path = self.get_safe_path(relative_path)
        norm_rel = self.to_relative_path(safe_path)

        if not safe_path.exists():
            raise FileNotFoundError(f"Cannot delete non-existent file: {norm_rel}")

        if not bypass_approval_check and settings.require_approval_for_deletions:
            raise PermissionDeniedError(
                f"Deleting '{norm_rel}' requires explicit human approval."
            )

        safe_path.unlink()
        log_audit_event(
            event_type="DELETE",
            file_path=norm_rel,
            agent=agent,
            details={"action": "file_deleted"},
        )

    def list_tree(self) -> List[Dict[str, Any]]:
        """
        Returns a hierarchical tree structure of the vault for UI navigation.
        """
        def build_node(dir_path: Path) -> List[Dict[str, Any]]:
            items = []
            for entry in sorted(dir_path.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
                if entry.name.startswith(".") and entry.name != ".gitkeep":
                    continue
                if entry.name == ".gitkeep":
                    continue

                rel = self.to_relative_path(entry)
                if entry.is_dir():
                    children = build_node(entry)
                    items.append({
                        "name": entry.name,
                        "path": rel,
                        "type": "directory",
                        "children": children,
                    })
                elif entry.suffix.lower() == ".md":
                    stat = entry.stat()
                    items.append({
                        "name": entry.name,
                        "path": rel,
                        "type": "file",
                        "size": stat.st_size,
                        "last_modified": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
                    })
            return items

        return build_node(self.root_dir)

    def get_stats(self) -> Dict[str, Any]:
        """Calculates vault statistics."""
        total_files = 0
        total_words = 0
        total_size = 0
        categories: Dict[str, int] = {}
        projects = set()

        for md_file in self.root_dir.glob("**/*.md"):
            if md_file.is_file():
                rel = self.to_relative_path(md_file)
                cat, proj = get_path_metadata(rel)
                categories[cat] = categories.get(cat, 0) + 1
                if proj:
                    projects.add(proj)

                try:
                    text = md_file.read_text(encoding="utf-8")
                    total_files += 1
                    total_words += len(text.split())
                    total_size += md_file.stat().st_size
                except Exception:
                    pass

        return {
            "total_files": total_files,
            "total_words": total_words,
            "total_size_bytes": total_size,
            "total_projects": len(projects),
            "categories": categories,
        }

