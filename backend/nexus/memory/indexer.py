import json
import logging
from pathlib import Path
from typing import Optional

from nexus.config import settings
from nexus.core.database import get_db_connection
from nexus.memory.vault import MemoryVault, get_path_metadata, parse_markdown_content

logger = logging.getLogger("nexus.indexer")


class VaultIndexer:
    """Synchronizes markdown vault documents with SQLite index and FTS5 engine."""

    def __init__(self, vault: Optional[MemoryVault] = None, db_path: Optional[Path] = None):
        self.vault = vault or MemoryVault()
        self.db_path = db_path or settings.nexus_db_path

    def sync_vault(self) -> int:
        """
        Performs a full reconciliation of all markdown files in the vault into SQLite.
        Returns the number of files indexed.
        """
        conn = get_db_connection(self.db_path)
        cursor = conn.cursor()
        indexed_paths = set()
        count = 0

        try:
            for md_file in self.vault.root_dir.glob("**/*.md"):
                if not md_file.is_file():
                    continue

                rel_path = self.vault.to_relative_path(md_file)
                indexed_paths.add(rel_path)

                try:
                    file_info = self.vault.read_file(rel_path)
                    tags = file_info["frontmatter"].get("tags", [])
                    tags_str = ",".join(tags) if isinstance(tags, list) else str(tags)

                    # Check existing hash
                    cursor.execute("SELECT content_hash FROM memory_index WHERE path = ?", (rel_path,))
                    row = cursor.fetchone()

                    if row is None or row["content_hash"] != file_info["content_hash"]:
                        # Insert or replace in memory_index
                        cursor.execute(
                            """
                            INSERT OR REPLACE INTO memory_index (
                                path, title, category, project_name, permission,
                                tags, content, content_hash, word_count, last_modified
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            (
                                rel_path,
                                file_info["title"],
                                file_info["category"],
                                file_info["project_name"],
                                file_info["permission"],
                                tags_str,
                                file_info["content"],
                                file_info["content_hash"],
                                file_info["word_count"],
                                file_info["last_modified"],
                            ),
                        )

                        # Update FTS5 table
                        cursor.execute("DELETE FROM memory_fts WHERE path = ?", (rel_path,))
                        cursor.execute(
                            """
                            INSERT INTO memory_fts (path, title, content, tags)
                            VALUES (?, ?, ?, ?)
                            """,
                            (rel_path, file_info["title"], file_info["content"], tags_str),
                        )
                        count += 1
                except Exception as ex:
                    logger.warning("Failed indexing %s: %s", rel_path, ex)

            # Purge deleted records
            cursor.execute("SELECT path FROM memory_index")
            db_paths = [r["path"] for r in cursor.fetchall()]
            for p in db_paths:
                if p not in indexed_paths:
                    cursor.execute("DELETE FROM memory_index WHERE path = ?", (p,))
                    cursor.execute("DELETE FROM memory_fts WHERE path = ?", (p,))
                    logger.info("Purged missing file from index: %s", p)

            conn.commit()
            logger.info("Indexed %d changed files across vault", count)
            return count
        finally:
            conn.close()

    def index_single_file(self, relative_path: str) -> None:
        """Incrementally indexes a single file."""
        conn = get_db_connection(self.db_path)
        cursor = conn.cursor()
        try:
            file_info = self.vault.read_file(relative_path)
            tags = file_info["frontmatter"].get("tags", [])
            tags_str = ",".join(tags) if isinstance(tags, list) else str(tags)

            cursor.execute(
                """
                INSERT OR REPLACE INTO memory_index (
                    path, title, category, project_name, permission,
                    tags, content, content_hash, word_count, last_modified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    relative_path,
                    file_info["title"],
                    file_info["category"],
                    file_info["project_name"],
                    file_info["permission"],
                    tags_str,
                    file_info["content"],
                    file_info["content_hash"],
                    file_info["word_count"],
                    file_info["last_modified"],
                ),
            )

            cursor.execute("DELETE FROM memory_fts WHERE path = ?", (relative_path,))
            cursor.execute(
                """
                INSERT INTO memory_fts (path, title, content, tags)
                VALUES (?, ?, ?, ?)
                """,
                (relative_path, file_info["title"], file_info["content"], tags_str),
            )
            conn.commit()
        finally:
            conn.close()

