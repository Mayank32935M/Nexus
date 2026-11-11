from fastapi import APIRouter, Query
from nexus.core.database import get_recent_audit_logs

router = APIRouter(prefix="/audit", tags=["Audit & Provenance"])


@router.get("")
def list_audit_trail(limit: int = Query(50, ge=1, le=200)):
    """Retrieve immutable audit trail of memory and project modifications."""
    return get_recent_audit_logs(limit=limit)

