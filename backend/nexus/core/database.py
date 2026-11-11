import sqlite3
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from nexus.config import settings

logger = logging.getLogger("nexus.database")


def get_db_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """Get a SQLite database connection with row factory enabled."""
    target_path = db_path or settings.nexus_db_path
    target_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(target_path), timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Optional[Path] = None) -> None:
    """Initialize all SQLite database tables, FTS5 virtual tables, and indexes."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    try:
        # 1. Metadata and Cache Index
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS memory_index (
                path TEXT PRIMARY KEY,
                title TEXT,
                category TEXT,
                project_name TEXT,
                permission TEXT,
                tags TEXT,
                content TEXT,
                content_hash TEXT,
                word_count INTEGER,
                last_modified TEXT
            )
        """)

        # 2. SQLite FTS5 Full-Text Search Virtual Table
        # Check if fts5 exists or create it
        cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
                path,
                title,
                content,
                tags,
                tokenize='porter unicode61'
            )
        """)

        # 3. Pending & Historical Approvals
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS approvals (
                id TEXT PRIMARY KEY,
                file_path TEXT NOT NULL,
                action TEXT NOT NULL,
                proposed_content TEXT,
                original_content TEXT,
                diff TEXT,
                reason TEXT,
                agent TEXT,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                reviewed_at TEXT,
                reviewed_by TEXT
            )
        """)

        # 4. Immutable Audit Trail
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                file_path TEXT,
                agent TEXT,
                details TEXT
            )
        """)

        # 5. Sessions & Handoff Records
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                agent TEXT,
                target_model TEXT,
                summary TEXT,
                created_at TEXT NOT NULL,
                metadata TEXT
            )
        """)

        # Indexes for fast lookups
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_memory_cat ON memory_index(category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_memory_proj ON memory_index(project_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp)")

        conn.commit()
        logger.info("SQLite database initialized successfully at %s", db_path or settings.nexus_db_path)
    finally:
        conn.close()


def log_audit_event(
    event_type: str,
    file_path: Optional[str] = None,
    agent: str = "system",
    details: Optional[Dict[str, Any]] = None,
    db_path: Optional[Path] = None,
) -> None:
    """Record an event into the immutable audit trail."""
    conn = get_db_connection(db_path)
    try:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            """
            INSERT INTO audit_log (timestamp, event_type, file_path, agent, details)
            VALUES (?, ?, ?, ?, ?)
            """,
            (now, event_type, file_path, agent, json.dumps(details or {})),
        )
        conn.commit()
    finally:
        conn.close()


def get_recent_audit_logs(limit: int = 50, db_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Retrieve recent audit events."""
    conn = get_db_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, timestamp, event_type, file_path, agent, details
            FROM audit_log
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cursor.fetchall()
        result = []
        for r in rows:
            result.append({
                "id": r["id"],
                "timestamp": r["timestamp"],
                "event_type": r["event_type"],
                "file_path": r["file_path"],
                "agent": r["agent"],
                "details": json.loads(r["details"]) if r["details"] else {},
            })
        return result
    finally:
        conn.close()
