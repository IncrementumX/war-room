# Claude Design Review — War Room V1

**Reviewer:** Claude (senior frontend/product design perspective)
**Skill:** frontend-design:frontend-design (Karpathy principles applied)
**Date:** 2026-05-02
**Scope:** Product and visual design review of current `index.html`. No code was written or edited.

---

## Critical Finding

Codex's review was written against the **old version** of the app (using `warroom_v4` localStorage, with Incrementum categories and the old badge system). The **current `index.html`** is already a meaningful step forward. Many of Codex's "to do" items are already implemented:

| Codex proposed | Current state |
|---|---|
| Replace badge system with P1/P2/P3 | Already done |
| Create explicit OOTD section | Already done |
| Flatten data model to `tasks[]` with proper fields | Already done |
| Group task areas by Topic > Subtopic | Already done |
| Remove Incrementum framing | Already done |
| Migration from old schema | Already done |

Codex's execution prompt, if sent as-is, would produce redundant churn or fight the current implementation. The engineer brief below is written against the actual current state.

---

## What Codex Got Right

1. **Data model is correct.** The flat `tasks[]` array with `{id, title, note, priority, topic, subtopic, inOrderOfDay, done}` is the right shape. Simple, localStorage-friendly, not over-nested. Keep it exactly as-is.
2. **Two-section layout is correct.** OOTD on top, Task Areas below. Matches the product soul.
3. **Drag-drop is the right reorder mechanism.** No need for up/down arrows. The existing implementation is solid.
4. **Hard delete for V1 is fine.** No archive view needed yet.
5. **Priority color system is semantically correct.** P1 = red, P2 = amber, P3 = neutral gray.

---

## Where Codex Missed Design Nuance

**1. The edit experience is broken — Codex did not flag it.**

Clicking "Editar" launches five sequential browser `prompt()` dialogs. This is the single most jarring interaction in the app. It completely breaks the "calm, lightweight" principle. This is the highest-priority UX fix.

**2. The OOTD add form demands too much.**

The OOTD form requires: title, topic, subtopic, priority. Order of the Day is meant to be a fast "what am I attacking today" list. Forcing topic/subtopic before adding a quick morning task adds unnecessary friction. For OOTD, topic/subtopic are secondary context — they should default or be optional.

**3. Three always-visible action buttons per task create chronic visual noise.**

Every task renders "Ordem/Retirar" + "Editar" + "Excluir" at all times. On a list of 15 tasks, that is 45 buttons visible simultaneously. Calm means revealing controls when needed, not displaying all of them always.

**4. The topic grouping nesting is one level too heavy.**

The visual hierarchy is: `panel border → topic card (border + bg) → subtopic label → task card (border + bg)`. Three nested box levels before the user sees a task. This makes the task areas feel heavier than the OOTD section.

**5. Done tasks have no exit path.**

Completed tasks stay in place with a strikethrough indefinitely. Over a day of use they accumulate and push uncompleted items down. There is no clear/sweep mechanism. This will make the app feel progressively cluttered.

**6. P3 tasks are visually equal to P1 and P2.**

INSTRUCTIONS.md says "P3 tasks can exist, but should not dominate the screen." Currently they render at identical visual weight, just sorted last. A full backlog of P3 items will dominate the screen exactly as warned.

---

## What Should Be Removed

- The browser `prompt()` edit flow — entirely. No degraded prompt fallback.
- The OOTD form's `required` attribute on topic/subtopic fields.
- Always-visible "Editar" and "Excluir" buttons from passive task state.
- The topic card box (border + background) as a container — replace with a plain label.

## What Should Be Preserved

- The entire CSS variable system — clean and well-chosen.
- The data model — do not touch `S.tasks` shape.
- The drag-drop implementation — it works.
- The P1/P2/P3 badge styling and color semantics.
- The `escapeHtml()` safety function.
- The localStorage key and migration logic.
- The header (title + date + count). The count "X/Y concluídas" is appropriately subtle.
- The single-column layout.

---

## Ideal V1 Structure

### Layout

```
┌─────────────────────────────────┐
│  War Room          sex, 02 mai  │   ← header: restrained, one line
│                   3/12 feitas   │
├─────────────────────────────────┤
│  ORDEM DO DIA                   │   ← uppercase label, no box border
│  ┌─────────────────────────────┐│
│  │ ▌ Task title          [P1] ││   ← left border accent by priority
│  │   topic / subtopic          ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ ▌ Another task        [P2] ││
│  └─────────────────────────────┘│
│  [+ Adicionar à Ordem do Dia]   │   ← inline expand, not a permanent form
├─────────────────────────────────┤
│  TAREFAS                        │
│                                 │
│  Pessoal                        │   ← topic: plain bold label, no box
│    Geral                        │   ← subtopic: dim uppercase, smaller
│    ┌───────────────────────────┐│
│    │ Task title          [P2] ││
│    └───────────────────────────┘│
│                                 │
│  Trabalho                       │
│    ...                          │
│                                 │
│  [+ Adicionar tarefa]           │
└─────────────────────────────────┘
```

### Visual Hierarchy

- **Task title:** 13px, `--text` (dark)
- **Priority badge:** small pill, right-aligned or left-border accent
- **Topic label:** 13px, `--text`, font-weight 600 — plain label, no border/box
- **Subtopic label:** 11px, `--text-muted`, uppercase, letter-spacing
- **Note:** 12px, `--text-muted`, below title
- **Action buttons:** visible only on task hover/focus
- **Done task:** 40% opacity overall, not just strikethrough on title

### Inline Edit (replacing prompt())

On "Editar" click, the task card flips to an edit state in-place:

```
┌─────────────────────────────────────┐
│ [__________________________] title  │
│ [__________________________] note   │
│ [Pessoal___] [Geral_______] [P2 ▾] │
│                     [Salvar] [✕]    │
└─────────────────────────────────────┘
```

No modal, no popup, no dialog. The card stays in position. Inputs replace the display. On Save: update task, `save()`, `render()`. On Cancel or Escape: `render()`.

---

## Addendum — frontend-design Skill

### Typography — the one gap understated in the initial review

The current font stack is `Inter, system-ui, sans-serif`. Inter is the canonical "generic AI aesthetic" font. For a tool called **War Room** — a personal command panel — this is a thematic miss, not just a style preference.

War Room implies precision, command, strategic clarity. A monospaced or semi-monospaced font reinforces that identity without any extra dependencies:

```css
font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
```

Zero-dependency change (all system fonts). Transforms the feel from "generic to-do app" to "personal command interface." This is the single highest-impact visual change that touches neither layout nor behavior.

### Micro-transitions — two specific additions

Two transitions are warranted, both CSS-only:

1. **Action button reveal:** `transition: opacity 0.12s ease` — fast enough to feel snappy, not animated.
2. **Inline edit state:** `transition: background 0.1s` on the card when entering edit mode (shift to `--surface2`) to signal the mode change without a flash.

No page-load animations, no stagger reveals. This is a functional tool, not a landing page.

### Header — let the name land

"War Room" at 15px, font-weight 600 is visually identical to a section header. It deserves slightly more presence: **17–18px, font-weight 700**. The date and count remain subtle beside it. One line change.

### What the skill confirms should NOT change

The existing warm-neutral palette (`#f5f4ef`, `--border`, P1/P2/P3 color semantics) is the right call for this product. The "unforgettable" quality for a daily-use personal tool comes from typographic precision and interaction quality — not from dramatic color or motion. Maximalism would be wrong here.

---

## Implementation Priorities

### P1 — Must-have for V1

1. **Inline edit** — Replace all `prompt()` dialogs with an in-place card edit state. Inputs pre-filled with current values (title, note, topic, subtopic, priority select). "Salvar" and "Cancelar" inside the card. No modal, no dialog, no overlay.
2. **Task actions on hover only** — `.actions { opacity: 0; transition: opacity 0.12s ease; }` and `.task:hover .actions, .task:focus-within .actions { opacity: 1; }`. One CSS rule change.
3. **Simplify OOTD add form** — Remove `required` from topic/subtopic in `#form-ordem`. Keep placeholder and default values ("Pessoal", "Geral") so they save correctly when left blank.
4. **Clear done tasks** — A small "Limpar concluídas" link (12px, `--text-muted`, no border) at the bottom of each section. Visible only when done tasks exist in that section. On click: remove `done === true` tasks from that section, `save()`, `render()`.

### P2 — Useful improvement

5. **Font stack** — Replace `Inter, system-ui, sans-serif` with `ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace`.
6. **Header title size** — `font-size: 17px; font-weight: 700` for `.title`.
7. **Remove topic card box** — Replace `.topic` bordered box with a plain label. Use left-padding and top-margin for grouping. Reduces visual nesting from three levels to two.
8. **Left-border priority accent** — 3px left border on each task card in the priority color (`--p1`, `--p2`, `--p3`). More spatial, less text-heavy than badges alone (badges can remain as secondary indicator).
9. **Edit state transition** — `transition: background 0.1s` on `.task` when entering edit mode.
10. **Collapse P3 by default** — Within each topic, P3 tasks render as a collapsed "N tarefas P3 ▾" toggle. Respects "P3 should not dominate the screen."
11. **Note field in add forms** — Optional note input for initial task creation.

### P3 — Later / backlog

12. Keyboard navigation (Tab between tasks, Enter to toggle done)
13. Subtopic collapse toggle
14. Task count per topic header
15. Dark mode toggle

---

## Engineer Brief for Codex

> **Context:** The current `index.html` already implements P1/P2/P3 priorities, OOTD section, topic/subtopic grouping, flat data model, drag-drop, and localStorage migration. Do **not** reimplement these. Codex's earlier review was against the old version.

**Make exactly these four changes (P1), in this order:**

**1. Inline edit — replace `prompt()` flow**
- When the user clicks "Editar" on a task, re-render that `<li>` as an edit form: inputs pre-filled with title, note, topic, subtopic, and a priority `<select>`.
- Add "Salvar" and "Cancelar" buttons inside the card.
- On save: update the task object, call `save()`, call `render()`.
- On cancel or Escape keydown: call `render()`.
- No modal, no dialog, no overlay. In-place only.

**2. Hide task actions until hover**
- In CSS: `.actions { opacity: 0; transition: opacity 0.12s ease; }`
- `.task:hover .actions, .task:focus-within .actions { opacity: 1; }`
- One rule change. Do not restructure anything else.

**3. OOTD form — optional topic/subtopic**
- Remove `required` attribute from `name="topico"` and `name="subtopico"` in `#form-ordem`.
- Keep the placeholder text and default values ("Pessoal", "Geral") so they save correctly when left blank.

**4. Clear done tasks**
- After `<ul id="lista-ordem">`, add a `<button id="limpar-ordem">` visible only when at least one OOTD task is `done`.
- After the `#areas` div, add a similar `<button id="limpar-areas">`.
- On click: filter `S.tasks` removing tasks where `done === true` and the relevant `inOrderOfDay` condition matches. Call `save()`, `render()`.
- Style: `font-size: 12px; color: var(--text-muted); background: none; border: none; cursor: pointer; padding: 6px 0;`
- Text: "Limpar concluídas".

**Do not touch:** CSS variables, data model shape, drag-drop logic, localStorage key, `escapeHtml()`, `migrateOldState()`, header markup, or task card structure beyond what the four changes above require.

**Verify:**
1. Edit a task — no browser `prompt()` appears; card enters edit state inline; save persists; cancel restores.
2. Hover a task — buttons appear; mouse away — buttons hide.
3. Add a task to OOTD leaving topic/subtopic blank — saves with "Pessoal / Geral" defaults.
4. Mark tasks done; "Limpar concluídas" appears; click it; done tasks removed; button disappears.
5. Reload page — all state persists correctly.
6. Drag-drop still works across both sections.
7. No browser dialogs appear anywhere during normal use.
