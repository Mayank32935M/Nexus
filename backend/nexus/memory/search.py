import re
from pathlib import Path
from typing import Any, Dict, List, Optional
from nexus.config import settings
from nexus.core.database import get_db_connection


class MemorySearchEngine:
    """Fast search engine leveraging SQLite FTS5 and metadata filtering."""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or settings.nexus_db_path

    def _sanitize_fts_query(self, query: str) -> str:
        """Sanitizes user query for safe FTS5 matching."""
        # Remove characters that can break FTS5 grammar
        cleaned = re.sub(r'[^\w\s\-\.]', ' ', query)
        terms = [t.strip() for t in cleaned.split() if t.strip()]
        if not terms:
            return ""
        # Match tokens with prefix support (e.g. "arch*")
        return " AND ".join([f'"{t}"*' for t in terms])

    def search(
        self,
        query: str,
        category: Optional[str] = None,
        project_name: Optional[str] = None,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Executes a full-text search against the memory vault.
        """
        query_str = query.strip()
        conn = get_db_connection(self.db_path)
        cursor = conn.cursor()

        results = []
        try:
            fts_query = self._sanitize_fts_query(query_str) if query_str else ""

            if fts_query:
                # Primary: FTS5 query with snippet highlighting
                sql = """
                    SELECT 
                        m.path,
                        m.title,
                        m.category,
                        m.project_name,
                        m.word_count,
                        m.last_modified,
                        snippet(memory_fts, 2, '<mark>', '</mark>', '...', 25) AS snippet
                    FROM memory_fts f
                    JOIN memory_index m ON f.path = m.path
                    WHERE memory_fts MATCH ?
                """
                params: List[Any] = [fts_query]

                if category:
                    sql += " AND m.category = ?"
                    params.append(category.upper())
                if project_name:
                    sql += " AND m.project_name = ?"
                    params.append(project_name)

                sql += " ORDER BY rank LIMIT ?"
                params.append(limit)

                cursor.execute(sql, params)
                rows = cursor.fetchall()

                for r in rows:
                    results.append({
                        "path": r["path"],
                        "title": r["title"],
                        "category": r["category"],
                        "project_name": r["project_name"],
                        "word_count": r["word_count"],
                        "last_modified": r["last_modified"],
                        "snippet": r["snippet"],
                    })

            # If FTS returned nothing or query was empty/blank but filters exist
            if not results:
                sql = """
                    SELECT 
                        path, title, category, project_name, word_count, last_modified,
                        substr(content, 1, 200) AS snippet
                    FROM memory_index
                    WHERE 1=1
                """
                params = []
                if query_str:
                    sql += " AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)"
                    like_term = f"%{query_str}%"
                    params.extend([like_term, like_term, like_term])
                if category:
                    sql += " AND category = ?"
                    params.append(category.upper())
                if project_name:
                    sql += " AND project_name = ?"
                    params.append(project_name)

                sql += " ORDER BY last_modified DESC LIMIT ?"
                params.append(limit)

                cursor.execute(sql, params)
                for r in cursor.fetchall():
                    results.append({
                        "path": r["path"],
                        "title": r["title"],
                        "category": r["category"],
                        "project_name": r["project_name"],
                        "word_count": r["word_count"],
                        "last_modified": r["last_modified"],
                        "snippet": r["snippet"] + ("..." if len(r["snippet"]) >= 200 else ""),
                    })

            return results
        finally:
            conn.close()
