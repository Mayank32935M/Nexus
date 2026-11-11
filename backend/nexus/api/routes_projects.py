from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from nexus.projects.service import ProjectService

router = APIRouter(prefix="/projects", tags=["Project Workspace"])


class ProjectCreateRequest(BaseModel):
    name: str
    description: str = ""
    author: str = "User"


class ProjectProgressRequest(BaseModel):
    task: str
    status: str
    notes: Optional[str] = ""
    agent: str = "user-dashboard"


@router.get("")
def list_projects():
    """List all project workspaces in NEXUS."""
    svc = ProjectService()
    return svc.list_projects()


@router.post("")
def create_project(req: ProjectCreateRequest):
    """
    Create a new project workspace.
    Automatically generates the standard 6 documentation markdown files:
    - PROJECT-OVERVIEW.md
    - CURRENT-STATE.md
    - ARCHITECTURE.md
    - DECISIONS.md
    - TASKS.md
    - CHANGELOG.md
    """
    svc = ProjectService()
    try:
        return svc.create_project(name=req.name, description=req.description, author=req.author)
    except FileExistsError as fe:
        raise HTTPException(status_code=409, detail=str(fe))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@router.get("/{name}/context")
def get_project_context(name: str):
    """Retrieve consolidated operational context for a project."""
    svc = ProjectService()
    try:
        return svc.get_project_context(name)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Project '{name}' not found")
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@router.post("/{name}/progress")
def update_project_progress(name: str, req: ProjectProgressRequest):
    """Update task progress and append entry into project changelog."""
    svc = ProjectService()
    try:
        return svc.update_project_progress(
            project_name=name,
            task=req.task,
            status=req.status,
            notes=req.notes or "",
            agent=req.agent,
        )
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

