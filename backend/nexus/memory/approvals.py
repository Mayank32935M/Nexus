import difflib
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from nexus.config import settings
from nexus.core.database import get_db_connection, log_audit_event
from nexus.memory.vault import MemoryVault
from nexus.memory.indexer import VaultIndexer


class ApprovalEngine:
    """Manages staged proposals and approval workflows for governance-controlled files."""

    def __init__(self, vault: Optional[MemoryVault] = None, db_path: Optional[Path] = None):
        self.vault = vault or MemoryVault()
        self.db_path = db_path or settings.nexus_db_path
        self.indexer = VaultIndexer(self.vault, self.db_path)

    def propose_update(
        self,
        file_path: str,
        proposed_content: str,
        reason: str,
        agent: str = "external-agent",
        action: str = "UPDATE",
    ) -> Dict[str, Any]:
        """
        Creates a staged update proposal requiring human sign-off.
        Generates a unified diff comparing original vs proposed content.
        """
        safe_path = self.vault.get_safe_path(file_path)
        norm_path = self.vault.to_relative_path(safe_path)

        original_content = ""
        if safe_path.exists() and safe_path.is_file():
            original_content = safe_path.read_text(encoding="utf-8")
        else:
            action = "CREATE"

        # Generate unified diff
        orig_lines = original_content.splitlines(keepends=True)
        prop_lines = proposed_content.splitlines(keepends=True)
        diff_lines = list(
            difflib.unified_diff(
                orig_lines,
                prop_lines,
                fromfile=f"a/{norm_path}",
                tofile=f"b/{norm_path}",
                n=3,
            )
        )
        diff_text = "".join(diff_lines)

        proposal_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        conn = get_db_connection(self.db_path)
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO approvals (
                    id, file_path, action, proposed_content, original_content,
                    diff, reason, agent, status, created_at, reviewed_at, reviewed_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, NULL, NULL)
                """,
                (
                    proposal_id,
                    norm_path,
                    action,
                    proposed_content,
                    original_content,
                    diff_text,
                    reason,
                    agent,
                    now,
                ),
            )
            conn.commit()

            log_audit_event(
                event_type="PROPOSAL_CREATED",
                file_path=norm_path,
                agent=agent,
                details={"proposal_id": proposal_id, "action": action, "reason": reason},
                db_path=self.db_path,
            )

            return {
                "id": proposal_id,
                "file_path": norm_path,
                "action": action,
                "diff": diff_text,
                "reason": reason,
                "agent": agent,
                "status": "PENDING",
                "created_at": now,
            }
        finally:
            conn.close()

    def list_approvals(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists proposals, optionally filtered by status (e.g. PENDING)."""
        conn = get_db_connection(self.db_path)
        try:
            cursor = conn.cursor()
            if status:
                cursor.execute(
                    """
                    SELECT id, file_path, action, diff, reason, agent, status, created_at, reviewed_at, reviewed_by
                    FROM approvals
                    WHERE status = ?
                    ORDER BY created_at DESC
                    """,
                    (status.upper(),),
                )
            else:
                cursor.execute(
                    """
                    SELECT id, file_path, action, diff, reason, agent, status, created_at, reviewed_at, reviewed_by
                    FROM approvals
                    ORDER BY created_at DESC
                    """
                )
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def get_approval(self, approval_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves full details of a specific approval proposal."""
        conn = get_db_connection(self.db_path)
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM approvals WHERE id = ?", (approval_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def approve(self, approval_id: str, reviewer: str = "User") -> Dict[str, Any]:
        """Applies a staged proposal to the filesystem vault and marks it APPROVED."""
        item = self.get_approval(approval_id)
        if not item:
            raise KeyError(f"Proposal not found: {approval_id}")
        if item["status"] != "PENDING":
            raise ValueError(f"Proposal {approval_id} is already {item['status']}")

        file_path = item["file_path"]
        action = item["action"]
        now = datetime.now(timezone.utc).isoformat()

        if action == "DELETE":
            self.vault.delete_file(file_path, agent=reviewer, bypass_approval_check=True)
        else:
            self.vault.write_file(
                file_path,
                item["proposed_content"],
                agent=reviewer,
                bypass_approval_check=True,
            )

        self.indexer.index_single_file(file_path)

        conn = get_db_connection(self.db_path)
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE approvals
                SET status = 'APPROVED', reviewed_at = ?, reviewed_by = ?
                WHERE id = ?
                """,
                (now, reviewer, approval_id),
            )
            conn.commit()

            log_audit_event(
                event_type="PROPOSAL_APPROVED",
                file_path=file_path,
                agent=reviewer,
                details={"proposal_id": approval_id, "original_agent": item["agent"]},
                db_path=self.db_path,
            )

            item["status"] = "APPROVED"
            item["reviewed_at"] = now
            item["reviewed_by"] = reviewer
            return item
        finally:
            conn.close()

    def reject(self, approval_id: str, reviewer: str = "User", reason: str = "") -> Dict[str, Any]:
        """Rejects a staged proposal."""
        item = self.get_approval(approval_id)
        if not item:
            raise KeyError(f"Proposal not found: {approval_id}")
        if item["status"] != "PENDING":
            raise ValueError(f"Proposal {approval_id} is already {item['status']}")

        now = datetime.now(timezone.utc).isoformat()
        conn = get_db_connection(self.db_path)
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE approvals
                SET status = 'REJECTED', reviewed_at = ?, reviewed_by = ?
                WHERE id = ?
                """,
                (now, reviewer, approval_id),
            )
            conn.commit()

            log_audit_event(
                event_type="PROPOSAL_REJECTED",
                file_path=item["file_path"],
                agent=reviewer,
                details={"proposal_id": approval_id, "rejection_reason": reason},
                db_path=self.db_path,
            )

            item["status"] = "REJECTED"
            item["reviewed_at"] = now
            item["reviewed_by"] = reviewer
            return item
        finally:
            conn.close()
