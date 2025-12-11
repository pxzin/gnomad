# Implementation Plan: Game HUD/UI

**Branch**: `003-game-hud` | **Date**: 2025-12-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-game-hud/spec.md`

## Summary

Implement a non-intrusive HUD overlay for the colony simulation game with:
- Top bar: gnome count, task progress (X/Y format), tick counter, speed controls (1x/2x/3x), pause button
- Bottom bar: selection info panel (tiles/gnomes), contextual action buttons (Dig/Cancel Dig)
- Extended selection system: existing tile rectangle selection + new gnome click selection with Shift+click toggle

Technical approach: Svelte components overlaying PixiJS canvas, reactive to GameState, placeholder styling.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode enabled)
**Primary Dependencies**: SvelteKit 2.48.5, Svelte 5.43.8, PixiJS 8.0.0, Vite 7.2.2
**Storage**: N/A (uses existing GameState in memory)
**Testing**: Vitest 3.0.0 (unit), Playwright 1.40.0 (E2E)
**Target Platform**: Web browser (desktop-first)
**Project Type**: SvelteKit web application
**Performance Goals**: 60 fps game loop, HUD updates within 100ms of state changes
**Constraints**: HUD must not block game interactions, placeholder visual style
**Scale/Scope**: Single-player game, existing 100x50 tile world

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety First | PASS | TypeScript strict mode enabled, all HUD state will be explicitly typed |
| II. Entity-Component Architecture | PASS | Selection extends existing ECS pattern, gnome selection uses Entity IDs |
| III. Documentation as Specification | PASS | spec.md complete, plan.md in progress, system docs will be created |
| IV. Simplicity and YAGNI | PASS | Placeholder styling, minimal abstraction, direct state access |
| V. Deterministic Game State | PASS | Selection state already in GameState, speed/pause commands are deterministic |

**Gate Status**: PASS - No violations, proceed to Phase 0.

### Post-Design Check (Phase 1 Complete)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety First | PASS | All interfaces defined in contracts/components.ts, explicit types for SelectionInfo, ActionButtonState |
| II. Entity-Component Architecture | PASS | `selectedGnomes: Entity[]` follows ECS pattern, gnomes identified by Entity ID |
| III. Documentation as Specification | PASS | data-model.md, research.md, quickstart.md, contracts/ all complete |
| IV. Simplicity and YAGNI | PASS | No factory patterns, no DI containers. Direct state access via Svelte 5 runes. 5 focused components. |
| V. Deterministic Game State | PASS | Commands (SELECT_GNOMES, CLEAR_SELECTION, CANCEL_DIG) are deterministic, selection state serializable |

**Post-Design Gate Status**: PASS - Design adheres to all constitution principles.

## Project Structure

### Documentation (this feature)

```text
specs/003-game-hud/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal component contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   ├── Game.svelte           # Existing - will be refactored
│   │   └── hud/                   # NEW - HUD components
│   │       ├── HudOverlay.svelte  # Main HUD container
│   │       ├── TopBar.svelte      # Counters + time controls
│   │       ├── BottomBar.svelte   # Selection panel + action bar
│   │       ├── SelectionPanel.svelte
│   │       └── ActionBar.svelte
│   ├── game/
│   │   └── state.ts              # Existing - extend selection model
│   └── input/
│       └── handler.ts            # Existing - add gnome click selection

tests/
├── unit/
│   └── hud/                      # NEW - HUD unit tests
└── e2e/
    └── hud.spec.ts               # NEW - HUD E2E tests
```

**Structure Decision**: Single SvelteKit project. HUD components organized in `src/lib/components/hud/` subdirectory for modularity while keeping existing Game.svelte as the integration point.

## Complexity Tracking

> No constitution violations - table not required.
