# Implementation Plan: Climbing Mechanics

**Branch**: `011-climbing-mechanics` | **Date**: 2025-12-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-climbing-mechanics/spec.md`

## Summary

Implement a climbing system that allows gnomes to navigate vertical terrain by climbing surfaces (block edges, background blocks, cave backgrounds) with speed penalties and fall risk. The system introduces gnome health, fall damage, and an incapacitated state with auto-recovery.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode enabled)
**Primary Dependencies**: SvelteKit 2.48.5, Svelte 5.43.8, PixiJS 8.0.0
**Storage**: Browser localStorage (existing serialization system)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Browser (WebGPU/WebGL via PixiJS)
**Project Type**: Single SvelteKit application
**Performance Goals**: 60 FPS game loop with tick-based simulation
**Constraints**: Deterministic game state (seeded RNG), ECS architecture (components are pure data)
**Scale/Scope**: Small-scale 2D colony sim with ~10-50 gnomes, 100x100+ tile world

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. Type Safety First | PASS | All new components/systems will have explicit types; strict mode enabled |
| II. Entity-Component Architecture | PASS | New Health component (pure data), extended GnomeState enum, ClimbingSystem function |
| III. Documentation as Specification | PASS | This plan serves as specification; system docs will be added |
| IV. Simplicity and YAGNI | PASS | Minimal new complexity; reuses existing pathfinding, physics patterns |
| V. Deterministic Game State | PASS | Fall chance uses seeded PRNG from tick; no wall-clock time |

**Gate Status**: PASS - All constitution principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/011-climbing-mechanics/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no external APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/lib/
├── components/
│   ├── gnome.ts          # Extend GnomeState enum, add Health interface
│   └── climbing.ts       # New: ClimbableSurface, SurfaceModifier types
├── config/
│   ├── physics.ts        # Add GNOME_CLIMB_SPEED, GNOME_HEALTH constants
│   └── climbing.ts       # New: Surface modifiers, fall chance, damage formula
├── systems/
│   ├── climbing.ts       # New: Climbing state management, fall chance check
│   ├── health.ts         # New: Health tracking, damage, recovery
│   ├── physics.ts        # Extend: Handle Climbing state movement
│   └── pathfinding.ts    # Extend: Add climbing cost modifiers by surface type
├── ecs/
│   └── world.ts          # Add health component accessors
└── game/
    ├── state.ts          # Add healths Map to GameState
    └── loop.ts           # Add climbing and health systems to game loop

tests/
├── unit/
│   ├── climbing.test.ts  # Climbing state transitions, surface detection
│   ├── health.test.ts    # Damage calculation, recovery, incapacitation
│   └── pathfinding.test.ts # Climbing route costs
└── integration/
    └── gnome-climbing.test.ts # End-to-end climbing scenarios
```

**Structure Decision**: Single project structure following existing ECS patterns. New systems follow the stateless function pattern. Configuration constants centralized in `config/`.

## Complexity Tracking

> No constitution violations requiring justification.

| Item | Decision | Rationale |
|------|----------|-----------|
| Health as separate component | Yes | Follows ECS principle - pure data, reusable for future combat/hazards |
| Climbing in physics.ts vs new system | Separate climbing.ts | Cleaner separation of concerns; climbing logic is substantial |

## Constitution Check (Post-Design)

*Re-evaluated after Phase 1 design completion.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. Type Safety First | PASS | Health, ClimbableSurfaceType, SurfaceModifier all have explicit types |
| II. Entity-Component Architecture | PASS | Health is pure data component; systems are stateless functions |
| III. Documentation as Specification | PASS | data-model.md documents all entities; quickstart.md provides implementation guide |
| IV. Simplicity and YAGNI | PASS | Reuses existing PRNG, pathfinding patterns; no unnecessary abstractions |
| V. Deterministic Game State | PASS | Fall chance uses seeded PRNG (entity+tick); Health serializes correctly |

**Post-Design Gate Status**: PASS - Design adheres to all constitution principles.
