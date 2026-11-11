import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from nexus.config import settings
from nexus.memory.vault import MemoryVault
from nexus.memory.templates import create_project_templates, get_current_iso_date
from nexus.memory.indexer import VaultIndexer
from nexus.core.database import log_audit_event


class ProjectService:
    """Manages project workspaces, documentation templates, context aggregation and progress updates."""

    def __init__(self, vault: Optional[MemoryVault] = None):
        self.vault = vault or MemoryVault()
        self.projects_dir = self.vault.root_dir / "PROJECTS"
        self.projects_dir.mkdir(parents=True, exist_ok=True)
        self.indexer = VaultIndexer(self.vault)

    def _sanitize_project_name(self, name: str) -> str:
        """Sanitizes project name to safe uppercase folder string."""
        clean = re.sub(r'[^a-zA-Z0-9_\-]', '', name.strip()).upper()
        if not clean:
            raise ValueError("Invalid project name: must contain alphanumeric characters")
        return clean

    def list_projects(self) -> List[Dict[str, Any]]:
        """Lists all project workspaces in the vault with their statistics."""
        projects = []
        if not self.projects_dir.exists():
            return projects

        for entry in sorted(self.projects_dir.iterdir()):
            if entry.is_dir() and not entry.name.startswith("."):
                p_name = entry.name
                overview_path = f"PROJECTS/{p_name}/PROJECT-OVERVIEW.md"
                description = ""
                last_updated = ""
                doc_count = len(list(entry.glob("*.md")))

                try:
                    info = self.vault.read_file(overview_path)
                    description = info["frontmatter"].get("description", "")
                    if not description:
                        # Extract first paragraph
                        body_lines = [l.strip() for l in info["body"].splitlines() if l.strip() and not l.startswith("#")]
                        if body_lines:
                            description = body_lines[0]
                    last_updated = info["last_modified"]
                except Exception:
                    pass

                # Calculate task completion if TASKS.md exists
                tasks_path = f"PROJECTS/{p_name}/TASKS.md"
                total_tasks = 0
                completed_tasks = 0
                try:
                    tasks_info = self.vault.read_file(tasks_path)
                    content = tasks_info["content"]
                    total_tasks = len(re.findall(r'\[[ xX]\]', content))
                    completed_tasks = len(re.findall(r'\[[xX]\]', content))
                except Exception:
                    pass

                projects.append({
                    "name": p_name,
                    "description": description or f"{p_name} workspace",
                    "doc_count": doc_count,
                    "total_tasks": total_tasks,
                    "completed_tasks": completed_tasks,
                    "last_updated": last_updated,
                })

        return projects

    def create_project(self, name: str, description: str = "", author: str = "User") -> Dict[str, Any]:
        """Creates a new project workspace and seeds it with the 6 standard markdown templates."""
        clean_name = self._sanitize_project_name(name)
        target_dir = self.projects_dir / clean_name

        if target_dir.exists():
            raise FileExistsError(f"Project '{clean_name}' already exists")

        target_dir.mkdir(parents=True, exist_ok=True)
        templates = create_project_templates(clean_name, description=description, author=author)

        for filename, content in templates.items():
            rel_path = f"PROJECTS/{clean_name}/{filename}"
            # Initial template generation has system permission
            self.vault.write_file(rel_path, content, agent=author, bypass_approval_check=True)
            self.indexer.index_single_file(rel_path)

        log_audit_event(
            event_type="PROJECT_CREATED",
            file_path=f"PROJECTS/{clean_name}",
            agent=author,
            details={"project_name": clean_name, "description": description},
        )

        return {
            "name": clean_name,
            "description": description,
            "path": f"PROJECTS/{clean_name}",
            "files_created": list(templates.keys()),
        }

    def get_project_context(self, project_name: str) -> Dict[str, Any]:
        """
        Retrieves and aggregates project documentation into a structured context bundle
        suitable for LLM consumption (ChatGPT, Claude, Gemini, etc.).
        """
        clean_name = self._sanitize_project_name(project_name)
        p_dir = self.projects_dir / clean_name
        if not p_dir.exists():
            raise FileNotFoundError(f"Project '{clean_name}' not found")

        doc_keys = [
            "PROJECT-OVERVIEW.md",
            "CURRENT-STATE.md",
            "ARCHITECTURE.md",
            "DECISIONS.md",
            "TASKS.md",
            "CHANGELOG.md",
        ]

        docs: Dict[str, str] = {}
        for dk in doc_keys:
            rel = f"PROJECTS/{clean_name}/{dk}"
            try:
                info = self.vault.read_file(rel)
                docs[dk] = info["content"]
            except Exception:
                docs[dk] = f"<!-- {dk} not yet initialized -->"

        # Formulate unified markdown context
        context_bundle = f"""# NEXUS PROJECT CONTEXT: {clean_name}
Generated: {datetime.now(timezone.utc).isoformat()}

## --- 1. OVERVIEW ---
{docs.get("PROJECT-OVERVIEW.md", "")}

## --- 2. CURRENT OPERATIONAL STATE ---
{docs.get("CURRENT-STATE.md", "")}

## --- 3. ARCHITECTURE & CONSTRAINTS ---
{docs.get("ARCHITECTURE.md", "")}

## --- 4. ARCHITECTURAL DECISIONS ---
{docs.get("DECISIONS.md", "")}

## --- 5. WORK BREAKDOWN & TASKS ---
{docs.get("TASKS.md", "")}

## --- 6. RECENT CHANGELOG ---
{docs.get("CHANGELOG.md", "")}
"""

        return {
            "project_name": clean_name,
            "documents": docs,
            "context_bundle": context_bundle,
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
        }

    def update_project_progress(
        self,
        project_name: str,
        task: str,
        status: str,
        notes: str = "",
        agent: str = "system",
    ) -> Dict[str, Any]:
        """
        Records progress on a project:
        - Updates or appends task in TASKS.md
        - Appends entry into CHANGELOG.md
        """
        clean_name = self._sanitize_project_name(project_name)
        tasks_path = f"PROJECTS/{clean_name}/TASKS.md"
        changelog_path = f"PROJECTS/{clean_name}/CHANGELOG.md"

        now_date = get_current_iso_date()
        status_box = "[x]" if status.lower() in ("completed", "done", "complete") else "[ ]"

        # 1. Update TASKS.md
        try:
            tasks_doc = self.vault.read_file(tasks_path)
            content = tasks_doc["content"]
            # Look for existing task line
            escaped_task = re.escape(task.strip())
            pattern = re.compile(rf"-\s*\[[ xX]\]\s*{escaped_task}.*", re.IGNORECASE)
            
            if pattern.search(content):
                content = pattern.sub(f"- {status_box} {task.strip()} ({status})", content)
            else:
                # Append under Active Tasks or at the end
                if "## Active Tasks" in content:
                    content = content.replace("## Active Tasks", f"## Active Tasks\n- {status_box} {task.strip()}", 1)
                else:
                    content += f"\n- {status_box} {task.strip()}"

            self.vault.write_file(tasks_path, content, agent=agent)
            self.indexer.index_single_file(tasks_path)
        except FileNotFoundError:
            pass

        # 2. Append to CHANGELOG.md
        try:
            cl_doc = self.vault.read_file(changelog_path)
            cl_content = cl_doc["content"]
            notes_str = f" - {notes}" if notes else ""
            log_entry = f"- **{task}** [{status.upper()}] by `{agent}`{notes_str}"

            # Match any header line starting with ## [YYYY-MM-DD]
            pattern = re.compile(rf"^##\s*\[{re.escape(now_date)}\].*$", re.MULTILINE)
            match = pattern.search(cl_content)
            if match:
                end_pos = match.end()
                cl_content = cl_content[:end_pos] + f"\n{log_entry}" + cl_content[end_pos:]
            else:
                cl_content += f"\n\n## [{now_date}]\n{log_entry}"

            self.vault.write_file(changelog_path, cl_content, agent=agent)
            self.indexer.index_single_file(changelog_path)
        except FileNotFoundError:
            pass

        return {
            "project_name": clean_name,
            "task": task,
            "status": status,
            "agent": agent,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
