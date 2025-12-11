# Implementation Plan: Colony Simulation Core (MVP)

**Branch**: `001-colony-sim-core` | **Date**: 2025-12-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-colony-sim-core/spec.md`

**MVP Scope**: Basic setup with 1 gnome and mineable ground. Colored squares for all visuals (no pixel art assets yet).

## Summary

Build the foundational game loop: a 2D tile-based world rendered with PixiJS v8, a single controllable gnome that can pathfind and dig terrain, and basic camera controls. This MVP validates the core tech stack (SvelteKit + PixiJS + ECS architecture) before adding complexity like multiple gnomes, resources, or building systems.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: SvelteKit 2.x (app framework), PixiJS v8 (2D rendering with WebGPU/WebGL)
**Storage**: Browser localStorage for save/load (JSON serialization)
**Testing**: Vitest (unit tests), Playwright (e2e browser tests)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge) with WebGPU preferred, WebGL2 fallback
**Project Type**: Web application (SvelteKit single project)
**Performance Goals**: 60 FPS with 10,000+ visible tiles, world generation < 5 seconds
**Constraints**: No external runtime dependencies, offline-capable, < 5MB initial bundle
**Scale/Scope**: MVP: 100x50 tile world, 1 gnome, 3 terrain types (air, dirt, stone)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Type Safety First | `strict: true`, explicit types for entities/events | ✅ PASS | TypeScript strict mode, all game entities typed |
| II. Entity-Component Architecture | Entities as IDs, Components as data, Systems as functions | ✅ PASS | Simple ECS for MVP (Entity ID + component maps) |
| III. Documentation as Specification | System docs in `docs/systems/` before implementation | ✅ PASS | Plan artifacts serve as initial docs; expand during implementation |
| IV. Simplicity and YAGNI | No premature abstraction, build game not engine | ✅ PASS | MVP uses minimal abstractions—direct PixiJS, simple ECS |
| V. Deterministic Game State | Seeded PRNG, tick-based logic, JSON-serializable state | ✅ PASS | Game loop tick-driven, world state serializable |

**Gate Status**: PASS - No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-colony-sim-core/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal game events/APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── ecs/                 # Entity-Component-System core
│   │   ├── types.ts         # Entity, Component, World types
│   │   ├── world.ts         # World state container
│   │   └── systems/         # Game systems
│   │       ├── movement.ts
│   │       ├── mining.ts
│   │       ├── pathfinding.ts
│   │       └── gravity.ts
│   ├── components/          # Component definitions
│   │   ├── position.ts
│   │   ├── velocity.ts
│   │   ├── tile.ts
│   │   ├── gnome.ts
│   │   └── task.ts
│   ├── rendering/           # PixiJS rendering layer
│   │   ├── renderer.ts      # Main renderer setup
│   │   ├── tile-renderer.ts # Tile grid rendering
│   │   └── entity-renderer.ts # Gnome/entity sprites
│   ├── input/               # Input handling
│   │   ├── mouse.ts
│   │   └── keyboard.ts
│   ├── world-gen/           # World generation
│   │   ├── generator.ts
│   │   └── noise.ts         # Simple noise for terrain
│   └── game/                # Game loop and state
│       ├── loop.ts          # Main game loop (tick-based)
│       ├── state.ts         # Game state management
│       └── commands.ts      # Player command processing
├── routes/
│   ├── +page.svelte         # Main game page
│   └── +layout.svelte       # App layout
└── app.html                 # HTML entry point

tests/
├── unit/
│   ├── ecs/
│   ├── systems/
│   └── world-gen/
└── e2e/
    └── game.spec.ts

docs/
└── systems/                 # System documentation (per constitution)
    ├── ecs.md
    ├── movement.md
    ├── mining.md
    └── pathfinding.md
```

**Structure Decision**: Single SvelteKit project. Game logic lives in `src/lib/` (importable modules), Svelte routes handle UI chrome. PixiJS canvas managed outside Svelte reactivity for performance.

## Complexity Tracking

No constitution violations requiring justification. MVP follows all principles:
- Simple ECS without frameworks (just Maps and functions)
- No DI containers or service locators
- Direct PixiJS usage without abstraction layer
- Hardcoded MVP values (world size, terrain types)
