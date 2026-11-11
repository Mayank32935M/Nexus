from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from nexus.handoff.generator import HandoffGenerator

router = APIRouter(prefix="/handoff", tags=["AI Session Handoffs"])


class HandoffGenerateRequest(BaseModel):
    session_title: str
    target_model: str = "General"
    current_goal: str
    completed_work: List[str] = []
    decisions_made: List[str] = []
    next_steps: List[str] = []
    project_name: Optional[str] = None
    open_questions: Optional[List[str]] = []
    context_files: Optional[List[str]] = []
    agent: str = "human-operator"


@router.post("/generate")
def generate_handoff(req: HandoffGenerateRequest):
    """
    Generate a structured, model-tailored AI session handoff document
    and persist it to AI-HANDOFF/ in the memory vault.
    """
    generator = HandoffGenerator()
    try:
        return generator.generate_handoff(
            session_title=req.session_title,
            target_model=req.target_model,
            current_goal=req.current_goal,
            completed_work=req.completed_work,
            decisions_made=req.decisions_made,
            next_steps=req.next_steps,
            project_name=req.project_name,
            open_questions=req.open_questions,
            context_files=req.context_files,
            agent=req.agent,
        )
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@router.get("/sessions")
def list_sessions(limit: int = Query(30, ge=1, le=100)):
    """List historical AI sessions and handoffs."""
    generator = HandoffGenerator()
    return generator.list_sessions(limit=limit)

