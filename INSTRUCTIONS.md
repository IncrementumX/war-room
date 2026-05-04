# War Room Soul

## Essence

War Room is a minimalist, visual, personal command panel for organizing my personal and professional to-dos.

It is not an operating system.
It is not a complex productivity app.
It is not a metrics dashboard.
It is not part of Incrementum Dashboard.
It is a separate standalone project.

The goal is to give me one clean place to see, organize, prioritize, edit, and execute my tasks.

## Core Product

The War Room should contain:

1. A clean list of to-dos
2. Organization by topics and subtopics
3. A dedicated Order of the Day section
4. Priorities using only P1, P2, and P3
5. Simple editing
6. Minimal visual hierarchy
7. A calm, lightweight interface

## Priority System

Use only:

- P1 = highest priority / critical / should be attacked first
- P2 = important but not as urgent
- P3 = backlog / lower priority / later

Do not use:
- quick
- manual
- agent
- hot
- complex tags
- excessive metadata

## Desired Layout

The interface should feel like a clean personal task board.

Suggested structure:

1. Header
   - War Room
   - current date
   - simple progress or count, if useful

2. Order of the Day
   - a dedicated section for the tasks I want to attack today
   - manually ordered
   - visually prominent but not noisy

3. Task Areas
   - personal and professional tasks
   - grouped by topic and subtopic
   - easy to scan

4. Backlog
   - P3 tasks can exist, but should not dominate the screen

## UX Principles

- Minimalist
- Fast
- Editable
- Visual
- Calm
- No clutter
- No dashboards for the sake of dashboards
- No charts
- No gamification
- No excessive colors
- No fake productivity complexity

## Required Functionality

The user should be able to:

- Add a task
- Edit a task
- Mark a task as done
- Delete or archive a task
- Reorder tasks
- Assign P1, P2, or P3
- Assign topic and subtopic
- Move tasks into or out of Order of the Day

## Technical Direction for V0

Keep this as a standalone HTML/CSS/JS prototype.

Use localStorage for now.

Do not add:
- React
- Supabase
- backend
- dependencies
- build system
- complex architecture

The immediate goal is to make the standalone War Room useful and beautiful.