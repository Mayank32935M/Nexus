---
id: ADR-001
title: Dual-Store Memory Architecture (Markdown Files + SQLite Index)
date: 2026-11-11
status: ACCEPTED
author: NEXUS Architect
permission: APPROVAL_REQUIRED
tags: [decision, architecture, storage]
---

# ADR-001: Dual-Store Memory Architecture

## Context
NEXUS requires a memory storage mechanism that is permanent, human-readable, future-proof, portable across different operating systems, and natively compatible with knowledge tools like Obsidian. At the same time, the system requires fast structured querying, full-text search, pending approval tracking, and immutable audit logging.

## Decision
We adopt a Dual-Store Architecture:
1. **Primary Source of Truth**: Standard Markdown files with YAML frontmatter organized in `nexus_memory/`. These files can be opened in Obsidian or any text editor with zero proprietary locks.
2. **Indexing & Governance Layer**: A local SQLite database (`nexus.db`) that maintains an automated FTS5 full-text search index, metadata cache, staged change proposals (approval queue), and an immutable audit log.

## Consequences
- **Pros**: Instant human readability, 100% portable, Git-friendly, sub-millisecond search query speeds, atomic transaction safety for approvals.
- **Cons**: Requires synchronization between filesystem writes and SQLite indices, which is automated by `VaultIndexer`.

