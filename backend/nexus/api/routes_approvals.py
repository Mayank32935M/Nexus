from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from nexus.memory.approvals import ApprovalEngine
from nexus.core.security import SecurityBoundaryViolation

router = APIRouter(prefix="/approvals", tags=["Governance & Approvals"])


class ProposeUpdateRequest(BaseModel):
    file_path: str
    proposed_content: str
    reason: str
    agent: str = "external-agent"
    action: str = "UPDATE"


class ReviewActionRequest(BaseModel):
    reviewer: str = "User"
    reason: Optional[str] = ""


@router.get("")
def list_approvals(status: Optional[str] = Query(None, description="Filter by status (PENDING, APPROVED, REJECTED)")):
    """List staged approval proposals."""
    engine = ApprovalEngine()
    return engine.list_approvals(status=status)


@router.post("/propose")
def propose_update(req: ProposeUpdateRequest):
    """Propose an update to a governance-controlled document."""
    engine = ApprovalEngine()
    try:
        return engine.propose_update(
            file_path=req.file_path,
            proposed_content=req.proposed_content,
            reason=req.reason,
            agent=req.agent,
            action=req.action,
        )
    except SecurityBoundaryViolation as sb:
        raise HTTPException(status_code=403, detail=str(sb))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@router.get("/{approval_id}")
def get_approval(approval_id: str):
    """Retrieve full proposal record including original content, proposed content, and unified diff."""
    engine = ApprovalEngine()
    item = engine.get_approval(approval_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Proposal '{approval_id}' not found")
    return item


@router.post("/{approval_id}/approve")
def approve_proposal(approval_id: str, req: ReviewActionRequest):
    """Approve and apply a staged proposal to the persistent memory vault."""
    engine = ApprovalEngine()
    try:
        return engine.approve(approval_id=approval_id, reviewer=req.reviewer)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Proposal '{approval_id}' not found")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@router.post("/{approval_id}/reject")
def reject_proposal(approval_id: str, req: ReviewActionRequest):
    """Reject a staged proposal."""
    engine = ApprovalEngine()
    try:
        return engine.reject(approval_id=approval_id, reviewer=req.reviewer, reason=req.reason or "")
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Proposal '{approval_id}' not found")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

