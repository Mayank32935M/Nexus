---
title: Global AI Agent Instructions & Guardrails
version: 0.1.0
last_updated: 2026-11-11
permission: APPROVAL_REQUIRED
tags: [core, instructions, ai-guardrails]
---

# Global AI Instructions & Guardrails

## Core Protocol for AI Agents
Every AI model (Claude Desktop via MCP, ChatGPT via handoffs, Gemini, local Ollama) operating within the NEXUS ecosystem must adhere to the following directives:

1. **Verify Before Action**: Query existing project memory, architectural decisions, and current state before proposing code or structural changes.
2. **Respect Governance Tiers**:
   - `READ`: Queries across projects and knowledge bases are unrestricted.
   - `WRITE`: Session summaries, progress notes, and routine task updates can be committed directly.
   - `APPROVAL_REQUIRED`: Never attempt to directly overwrite core instructions, architectural decisions, or delete documents. Always propose changes as staged updates for human review.
3. **Record Provenance**: Tag all updates with your agent name (e.g., `agent: claude-desktop-mcp`, `agent: ollama-local`) and the session timestamp.
4. **Structured Handoff**: At the conclusion of significant planning or implementation runs, generate a clean handoff summary documenting completed items, architectural rationale, and immediate next steps.

