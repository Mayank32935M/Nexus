from datetime import datetime, timezone
from typing import Dict


def get_current_iso_date() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def create_project_templates(project_name: str, description: str = "", author: str = "User") -> Dict[str, str]:
    """
    Generates the standard 6 markdown template documents for a project.
    Empty templates preferable to invented info.
    """
    date_str = get_current_iso_date()
    p_upper = project_name.strip()

    templates = {
        "PROJECT-OVERVIEW.md": f"""---
title: {p_upper} — Project Overview
project: {p_upper}
date_created: {date_str}
last_updated: {date_str}
author: {author}
tags: [project, {p_upper.lower()}, overview]
---

# {p_upper} — Project Overview

## 1. Description & Objectives
{description if description else "[Provide high-level description and primary goals here]"}

## 2. Core Features & Capabilities
- [Feature 1]
- [Feature 2]
- [Feature 3]

## 3. Technology Stack & External Dependencies
- **Frontend**: 
- **Backend**: 
- **Storage**: 
- **AI Integrations**: 

## 4. Key Links & Repository Information
- Repository: 
- Documentation: 
""",

        "CURRENT-STATE.md": f"""---
title: {p_upper} — Current Operational State
project: {p_upper}
last_updated: {date_str}
author: {author}
tags: [project, {p_upper.lower()}, state]
---

# {p_upper} — Current State

## 1. Milestone Status
- **Current Milestone**: Phase 1 / Foundation
- **Overall Status**: In Development

## 2. Active Focus & Immediate Priorities
- [ ] Initial scaffolding and architecture setup
- [ ] Core business logic verification

## 3. Known Issues & Blockers
- None currently reported.

## 4. Environment & Deployment Notes
- Local environment: Active
""",

        "ARCHITECTURE.md": f"""---
title: {p_upper} — Architecture & System Design
project: {p_upper}
last_updated: {date_str}
permission: APPROVAL_REQUIRED
tags: [project, {p_upper.lower()}, architecture]
---

# {p_upper} — Architecture & Design

## 1. Architectural Philosophy & Patterns
[Document system boundaries, architectural patterns, and separation of concerns]

## 2. Component Diagram
```mermaid
graph TD
    UI[Frontend Client] --> API[Backend API]
    API --> DB[(Data Store)]
```

## 3. Data Flow & Communication
- [Describe request/response cycles, event handling, or background processes]

## 4. Security & Isolation Boundaries
- [Describe authentication, path security, secret management, and isolation]
""",

        "DECISIONS.md": f"""---
title: {p_upper} — Architectural Decisions Log
project: {p_upper}
last_updated: {date_str}
permission: APPROVAL_REQUIRED
tags: [project, {p_upper.lower()}, decisions]
---

# {p_upper} — Architectural Decisions (ADR Index)

| ID | Title | Date | Status | Rationale Summary |
|---|---|---|---|---|
| ADR-001 | Initial Architecture | {date_str} | PROPOSED | Initial setup of {p_upper} |

---

### Record Template
```markdown
### ADR-XXX: [Title]
- **Date**: YYYY-MM-DD
- **Status**: [PROPOSED | ACCEPTED | DEPRECATED]
- **Context**: 
- **Decision**: 
- **Consequences**: 
```
""",

        "TASKS.md": f"""---
title: {p_upper} — Tasks & Work Breakdown
project: {p_upper}
last_updated: {date_str}
permission: WRITE
tags: [project, {p_upper.lower()}, tasks]
---

# {p_upper} — Tasks & Roadmap

## Active Tasks
- [ ] Initial project workspace configuration
- [ ] Core module implementation
- [ ] Test coverage and validation

## Completed Tasks
- [x] Project initialized in NEXUS ({date_str})

## Backlog / Future Enhancements
- [ ] Integration with automated pipelines
""",

        "CHANGELOG.md": f"""---
title: {p_upper} — Changelog & Evolution History
project: {p_upper}
last_updated: {date_str}
permission: WRITE
tags: [project, {p_upper.lower()}, changelog]
---

# {p_upper} — Changelog

## [{date_str}] — Initialization
- Project workspace created in NEXUS memory vault.
- Standard 6-document documentation architecture seeded.
"""
    }

    return templates


def create_decision_template(title: str, adr_id: str = "ADR-002", author: str = "User", project: str = "") -> str:
    """Generates an Architectural Decision Record document."""
    date_str = get_current_iso_date()
    p_tag = f", {project.lower()}" if project else ""
    return f"""---
id: {adr_id}
title: {title}
date: {date_str}
status: PROPOSED
author: {author}
permission: APPROVAL_REQUIRED
tags: [decision, architecture{p_tag}]
---

# {adr_id}: {title}

## Context
[Describe the problem, requirements, and constraints that motivate this decision.]

## Decision
[State the exact architectural choice, libraries, patterns, or workflows adopted.]

## Consequences
- **Positive**: 
- **Trade-offs / Mitigations**: 
"""

