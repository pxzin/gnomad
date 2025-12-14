# Implementation Plan: Resource System

**Branch**: `006-resource-system` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-resource-system/spec.md`

## Summary

Implement a resource collection system where mining tiles drops resource entities that gnomes automatically collect, updating a global resource inventory displayed in the HUD. This follows the existing ECS pattern with pure functional state updates and integrates directly into the mining system completion flow.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: SvelteKit 2.x, PixiJS v8
**Storage**: Browser localStorage (existing serialization system)
**Testing**: Manual playtest (no automated test framework yet)
**Target Platform**: Web browser (WebGPU/WebGL via PixiJS)
**Project Type**: Web application (SvelteKit)
**Performance Goals**: 60 fps maintained with 100+ resource entities on screen
**Constraints**: No external state management libraries; pure functional ECS pattern
**Scale/Scope**: 2 resource types (dirt, stone), unlimited collection

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety First | PASS | All resource components will have explicit TypeScript interfaces |
| II. Entity-Component Architecture | PASS | Resource as component, collection as system function |
| III. Documentation as Specification | PASS | This plan serves as specification before implementation |
| IV. Simplicity and YAGNI | PASS | Simple drop-on-mine, auto-collect, global counter only |
| V. Deterministic Game State | PASS | Resource creation tied to tick, no randomness needed |

All gates pass. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/006-resource-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/lib/
├── components/
│   ├── resource.ts          # NEW: Resource component + ResourceType enum
│   ├── tile.ts              # MODIFY: Reference resource type mapping
│   └── hud/
│       ├── ResourcePanel.svelte  # NEW: Display resource counts
│       └── types.ts              # MODIFY: Add ResourceInventory type
├── ecs/
│   └── world.ts             # MODIFY: Add resource component functions
├── game/
│   └── state.ts             # MODIFY: Add resources Map and inventory to state
├── systems/
│   ├── mining.ts            # MODIFY: Drop resource on tile destruction
│   └── resource-collection.ts   # NEW: Auto-collect resources system
├── render/
│   └── renderer.ts          # MODIFY: Add resource entity rendering
└── config/
    └── colors.ts            # MODIFY: Add resource entity colors
```

**Structure Decision**: Single web application with SvelteKit. All game logic in `src/lib/`, components in `src/lib/components/`, systems in `src/lib/systems/`. Follows existing project structure.

## Complexity Tracking

No violations requiring justification. Design follows existing patterns exactly.
