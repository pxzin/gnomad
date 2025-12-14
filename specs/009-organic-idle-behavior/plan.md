# Implementation Plan: Organic Idle Behavior for Gnomes

**Branch**: `009-organic-idle-behavior` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-organic-idle-behavior/spec.md`

## Summary

Implement an organic idle behavior system where gnomes perform varied activities (casual strolls, socialization, resting) when not working, creating a lively colony atmosphere. The system uses weighted random selection (50% stroll, 35% socialize, 15% rest) with immediate task interruption. Gnomes stroll at 50% normal speed within 8 tiles of the Storage building (colony center).

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode enabled)
**Primary Dependencies**: SvelteKit 2.48.5, Svelte 5.43.8, PixiJS 8.0.0
**Storage**: N/A (in-memory game state, localStorage for saves)
**Testing**: Vitest 3.0.0, Playwright for E2E
**Target Platform**: Web browser (modern browsers with WebGPU/WebGL support)
**Project Type**: Single web application
**Performance Goals**: 60 FPS, idle behavior system within existing throttle budget
**Constraints**: Must not regress existing performance, deterministic behavior required, immediate task interruption
**Scale/Scope**: ~10 gnomes typical gameplay, ~100 concurrent entities

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety First | ✅ PASS | All new code will use explicit types, IdleBehavior interface defined |
| II. Entity-Component Architecture | ✅ PASS | IdleBehavior as component, idleBehaviorSystem as pure function |
| III. Documentation as Specification | ✅ PASS | spec.md complete, plan.md in progress |
| IV. Simplicity and YAGNI | ✅ PASS | Simple state machine, no unnecessary abstractions |
| V. Deterministic Game State | ✅ PASS | Will use seeded PRNG from game state, tick-based durations |

**All gates passed. Proceeding to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/009-organic-idle-behavior/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (affected files)

```text
src/lib/
├── components/
│   ├── gnome.ts             # MODIFY: Add IdleBehavior to Gnome, new GnomeState values
│   └── idle-behavior.ts     # NEW: IdleBehavior component and types
├── systems/
│   ├── idle-behavior.ts     # NEW: Main idle behavior system
│   └── task-assignment.ts   # MODIFY: Clear idle behavior on task assignment
├── config/
│   ├── physics.ts           # MODIFY: Add GNOME_IDLE_SPEED constant
│   └── performance.ts       # MODIFY: Add IDLE_BEHAVIOR_THROTTLE_TICKS
├── render/
│   └── renderer.ts          # MODIFY: Render socialization indicator
└── game/
    ├── state.ts             # VERIFY: Gnome component already stored
    └── loop.ts              # MODIFY: Add idleBehaviorSystem to update pipeline
```

**Structure Decision**: Single project structure (existing). Changes primarily add new idle-behavior system with minimal modifications to existing gnome component and task-assignment system.

## Complexity Tracking

> No constitution violations. Table not needed.
