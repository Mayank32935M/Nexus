from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from nexus.memory.vault import MemoryVault
from nexus.memory.indexer import VaultIndexer
from nexus.memory.search import MemorySearchEngine
from nexus.core.security import SecurityBoundaryViolation, PermissionDeniedError

router = APIRouter(prefix="/memory", tags=["Memory Operations"])


class FileWriteRequest(BaseModel):
    path: str
    content: str
    agent: str = "user-dashboard"
    bypass_approval: bool = False


@router.get("/tree")
def get_memory_tree():
    """Returns hierarchical tree structure of the memory vault."""
    vault = MemoryVault()
    return vault.list_tree()


@router.get("/file")
def read_memory_file(path: str = Query(..., description="Relative path in memory vault")):
    """Read a specific markdown memory document."""
    vault = MemoryVault()
    try:
        return vault.read_file(path)
    except SecurityBoundaryViolation as sb:
        raise HTTPException(status_code=403, detail=str(sb))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@router.post("/file")
def write_memory_file(req: FileWriteRequest):
    """Write or update a markdown memory document."""
    vault = MemoryVault()
    try:
        res = vault.write_file(
            relative_path=req.path,
            content=req.content,
            agent=req.agent,
            bypass_approval_check=req.bypass_approval,
        )
        # Update index
        indexer = VaultIndexer(vault)
        indexer.index_single_file(req.path)
        return res
    except SecurityBoundaryViolation as sb:
        raise HTTPException(status_code=403, detail=str(sb))
    except PermissionDeniedError as pd:
        raise HTTPException(status_code=403, detail=str(pd))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@router.delete("/file")
def delete_memory_file(path: str = Query(...), agent: str = "user-dashboard"):
    """Delete a memory document (requires approval or explicit permission)."""
    vault = MemoryVault()
    try:
        vault.delete_file(path, agent=agent, bypass_approval_check=False)
        indexer = VaultIndexer(vault)
        indexer.sync_vault()
        return {"status": "success", "message": f"Deleted {path}"}
    except SecurityBoundaryViolation as sb:
        raise HTTPException(status_code=403, detail=str(sb))
    except PermissionDeniedError as pd:
        raise HTTPException(status_code=403, detail=str(pd))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@router.get("/search")
def search_memory(
    query: str = Query("", description="Keyword or phrase to search"),
    category: Optional[str] = Query(None, description="Filter category"),
    project: Optional[str] = Query(None, description="Filter project"),
    limit: int = Query(20, ge=1, le=100),
):
    """Search memory vault using FTS5 and metadata filtering."""
    search_eng = MemorySearchEngine()
    return search_eng.search(query=query, category=category, project_name=project, limit=limit)


@router.post("/sync")
def sync_memory_index():
    """Forces synchronization between memory vault files and SQLite FTS index."""
    indexer = VaultIndexer()
    indexed_count = indexer.sync_vault()
    return {
        "status": "success",
        "indexed_count": indexed_count,
        "message": f"Successfully indexed {indexed_count} documents in vault.",
    }

