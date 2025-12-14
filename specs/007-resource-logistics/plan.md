# Implementation Plan: Resource Logistics System

**Branch**: `007-resource-logistics` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-resource-logistics/spec.md`

## Summary

Implement a complete resource logistics system with physics-based resource dropping, collect tasks, gnome personal inventories (5-item limit), and Storage buildings for depositing resources. This replaces the automatic collection from 006-resource-system with an active logistics gameplay loop: Mine → Drop → Fall → Collect Task → Gnome Picks Up → Carries → Deposits at Storage → Available in HUD.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: SvelteKit 2.x, PixiJS v8
**Storage**: Browser localStorage (existing serialization system)
**Testing**: Manual playtest (no automated test framework yet)
**Target Platform**: Web browser (WebGPU/WebGL via PixiJS)
**Project Type**: Web application (SvelteKit)
**Performance Goals**: 60 fps maintained with 100+ resource entities, gnomes, and buildings
**Constraints**: No external state management libraries; pure functional ECS pattern
**Scale/Scope**: 2 resource types, unlimited gnomes/storage, 5-item gnome inventory

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety First | PASS | All new components (GnomeInventory, Storage, CollectTask) will have explicit TypeScript interfaces |
| II. Entity-Component Architecture | PASS | Storage as entity with Building component, GnomeInventory as component, CollectTask as task type |
| III. Documentation as Specification | PASS | This plan serves as specification before implementation |
| IV. Simplicity and YAGNI | PASS | Extends existing physics/task systems rather than creating new frameworks |
| V. Deterministic Game State | PASS | Resource physics uses existing tick-based physics; all state serializable |

All gates pass. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/007-resource-logistics/
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
│   ├── resource.ts              # MODIFY: Add velocity, isGrounded fields
│   ├── gnome.ts                 # MODIFY: Add inventory field to Gnome component
│   ├── building.ts              # NEW: Building component + BuildingType enum
│   ├── storage.ts               # NEW: Storage component with contents
│   ├── task.ts                  # MODIFY: Add TaskType.Collect
│   └── hud/
│       ├── SelectionPanel.svelte    # MODIFY: Show gnome inventory, storage contents
│       ├── ResourcePanel.svelte     # MODIFY: Display stored resources only
│       └── BuildPanel.svelte        # NEW: Building placement UI
├── ecs/
│   └── world.ts                 # MODIFY: Add building/storage component functions
├── game/
│   ├── state.ts                 # MODIFY: Add buildings Map, storages Map
│   └── command-processor.ts     # MODIFY: Handle PlaceBuilding command
├── systems/
│   ├── physics.ts               # MODIFY: Apply gravity to resources
│   ├── resource-collection.ts   # REWRITE: Remove auto-collect, add collect task handling
│   ├── resource-physics.ts      # NEW: Resource-specific physics (grounding detection)
│   ├── collect-task.ts          # NEW: Process collect tasks, create deposit tasks
│   └── deposit.ts               # NEW: Handle resource deposit at Storage
├── render/
│   └── renderer.ts              # MODIFY: Render Storage buildings
└── config/
    └── colors.ts                # MODIFY: Add Storage building color
```

**Structure Decision**: Single web application with SvelteKit. Follows existing project structure. New systems integrate with existing game loop.

## Complexity Tracking

No violations requiring justification. Design follows existing patterns exactly.
