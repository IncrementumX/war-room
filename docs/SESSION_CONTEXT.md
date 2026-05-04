# War Room Session Context

## Current State

War Room is a standalone HTML/CSS/JS prototype.

Files:
- index.html = current implementation
- index_backup_original.html = untouched original backup
- INSTRUCTIONS.md = product direction and constraints
- docs/CODEX_REVIEW.md = Codex technical/product review
- docs/CLAUDE_DESIGN_REVIEW.md = future Claude frontend/design review

## Product Direction

War Room is a minimalist, visual, personal command panel for organizing personal and professional to-dos.

It is not:
- Incrementum Dashboard
- an operating system
- a complex productivity app
- a metrics dashboard
- a gamified app

Core requirements:
- to-dos organized by topics and subtopics
- a dedicated Order of the Day section
- P1/P2/P3 priorities only
- simple editing
- calm, lightweight visual UX
- standalone localStorage V0

## Workflow Decision

Claude should be used as a product/frontend design reviewer only.

Codex should be used as the implementation executor after final approval.

No agent should edit index.html until explicitly approved.

## Current Workflow

1. Codex has completed a planning/review pass.
2. The next step is Claude frontend/design review.
3. After Claude review, Codex will implement the approved changes.
