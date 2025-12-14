# Implementation Plan: Task Priority and Distance System

**Branch**: `008-task-priority` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-task-priority/spec.md`

## Summary

Refactor the task assignment system so gnomes consider both **priority** and **distance** when selecting tasks. Currently, gnomes pick tasks based on priority + FIFO ordering, ignoring proximity. The new algorithm will:
1. Group tasks by priority level
2. Within each priority group, sort by path distance (closest first)
3. Fall back to creation time as final tiebreaker
4. Display color-coded task markers (Red=Urgent, Yellow=High, Blue=Normal, Gray=Low)

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode enabled)
**Primary Dependencies**: SvelteKit 2.48.5, Svelte 5.43.8, PixiJS 8.0.0
**Storage**: N/A (in-memory game state, localStorage for saves)
**Testing**: Vitest 3.0.0, Playwright for E2E
**Target Platform**: Web browser (modern browsers with WebGPU/WebGL support)
**Project Type**: Single web application
**Performance Goals**: 60 FPS, task assignment within existing throttle budget
**Constraints**: Must not regress existing performance, deterministic behavior required
**Scale/Scope**: ~100 concurrent tasks, ~10 gnomes typical gameplay

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety First | ✅ PASS | All new code will use explicit types, no `any` |
| II. Entity-Component Architecture | ✅ PASS | Task is existing component, taskAssignmentSystem is pure function |
| III. Documentation as Specification | ✅ PASS | spec.md complete, plan.md in progress |
| IV. Simplicity and YAGNI | ✅ PASS | Simple sorting change, no new abstractions |
| V. Deterministic Game State | ✅ PASS | Path length calculation is deterministic |

**All gates passed. Proceeding to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/008-task-priority/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (affected files)

```text
src/lib/
├── systems/
│   └── task-assignment.ts    # MODIFY: Add distance-based sorting
├── components/
│   └── task.ts               # NO CHANGE: TaskPriority already exists
├── config/
│   └── colors.ts             # MODIFY: Add priority color constants
├── render/
│   └── renderer.ts           # MODIFY: Color-code task markers by priority
└── components/hud/
    └── SelectionPanel.svelte # MODIFY: Show priority name in selection
```

**Structure Decision**: Single project structure (existing). Changes limited to task-assignment system and rendering. No new modules required.

## Complexity Tracking

> No constitution violations. Table not needed.
