# Tasks: Background Blocks & Horizon System

**Input**: Design documents from `/specs/010-background-blocks-horizon/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested - omitting test tasks per template guidelines.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/lib/` at repository root (SvelteKit structure)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create new type definitions and component files needed by all user stories

- [ ] T001 [P] Create PermanentBackgroundType enum in src/lib/components/background.ts
- [ ] T002 [P] Add BackgroundTile interface and creation functions in src/lib/components/tile.ts
- [ ] T003 [P] Add background color constants and getBackgroundBlockColor function in src/lib/config/colors.ts
- [ ] T004 [P] Add BACKGROUND_TILE_COLORS pre-computed record in src/lib/config/colors.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend GameState and create ECS functions that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Add backgroundTileGrid, backgroundTiles Map, and horizonY to GameState interface in src/lib/game/state.ts
- [ ] T006 Extend createEmptyState to initialize backgroundTileGrid and horizonY in src/lib/game/state.ts
- [ ] T007 Create src/lib/ecs/background.ts with getBackgroundTileAt, setBackgroundTileAt functions
- [ ] T008 Add addBackgroundTile, removeBackgroundTile, getBackgroundTile, updateBackgroundTile functions in src/lib/ecs/background.ts
- [ ] T009 Add horizonY parameter to WorldConfig interface in src/lib/world-gen/generator.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Visual Depth Through Background Layers (Priority: P1)

**Goal**: When foreground blocks are mined, background blocks become visible behind them, providing visual depth.

**Independent Test**: Mine any foreground block and verify a darker background block appears behind it.

### Implementation for User Story 1

- [ ] T010 [US1] Modify generateWorld to create background entities for each solid foreground tile in src/lib/world-gen/generator.ts
- [ ] T011 [US1] Add permanentBackgroundContainer and backgroundContainer to Renderer interface in src/lib/render/renderer.ts
- [ ] T012 [US1] Add backgroundTileGraphics Map cache to Renderer interface in src/lib/render/renderer.ts
- [ ] T013 [US1] Create permanentBackgroundContainer and backgroundContainer in createRenderer, add to stage in correct z-order in src/lib/render/renderer.ts
- [ ] T014 [US1] Implement renderBackgroundTiles function with frustum culling and dirty checking in src/lib/render/renderer.ts
- [ ] T015 [US1] Call renderBackgroundTiles in main render function after permanent background in src/lib/render/renderer.ts
- [ ] T016 [US1] Verify background blocks use BACKGROUND_TILE_COLORS (darker colors) in renderer

**Checkpoint**: At this point, mining any foreground block reveals a darker background behind it. User Story 1 is complete.

---

## Phase 4: User Story 2 - Horizon Distinguishes Surface from Underground (Priority: P2)

**Goal**: World has a clear horizon line separating sky (above) from cave rock (below).

**Independent Test**: Generate a new world and observe the visual transition between sky and cave backgrounds at the horizon line.

### Implementation for User Story 2

- [ ] T017 [US2] Add skyFillGraphics and caveFillGraphics to Renderer interface in src/lib/render/renderer.ts
- [ ] T018 [US2] Create sky and cave Graphics objects in createRenderer, add to permanentBackgroundContainer in src/lib/render/renderer.ts
- [ ] T019 [US2] Implement renderPermanentBackground function that draws sky above horizonY and cave below in src/lib/render/renderer.ts
- [ ] T020 [US2] Call renderPermanentBackground in main render function as first rendering step in src/lib/render/renderer.ts
- [ ] T021 [US2] Set horizonY during world generation based on surfaceLevel in src/lib/world-gen/generator.ts
- [ ] T022 [US2] Add getPermanentBackgroundType helper function in src/lib/world-gen/generator.ts

**Checkpoint**: At this point, the world shows sky above horizon and cave below. User Story 2 is complete.

---

## Phase 5: User Story 3 - Mineable Background Blocks (Priority: P3)

**Goal**: Background blocks can be mined when no foreground block is present, revealing the permanent background.

**Independent Test**: After mining a foreground block, designate the revealed background for mining. Verify the gnome mines it and the permanent background (sky/cave) becomes visible.

### Implementation for User Story 3

- [ ] T023 [US3] Add MiningLayer type and MiningTarget interface in src/lib/systems/mining.ts
- [ ] T024 [US3] Implement getMiningTarget function that checks foreground first, then background in src/lib/systems/mining.ts
- [ ] T025 [US3] Modify processMining to use getMiningTarget and handle both foreground and background layers in src/lib/systems/mining.ts
- [ ] T026 [US3] Implement mineBackgroundTile helper function (no resource drops) in src/lib/systems/mining.ts
- [ ] T027 [US3] Update task creation to use getMiningTarget for determining what can be mined at a position in src/lib/systems/task-system.ts (or equivalent)
- [ ] T028 [US3] Ensure background tile removal updates backgroundTileGrid correctly in mining.ts

**Checkpoint**: Background blocks can now be mined independently. User Story 3 is complete.

---

## Phase 6: Persistence & Compatibility

**Purpose**: Ensure save/load works correctly with new background data

- [ ] T029 Add backgroundTileGrid to serialize function output in src/lib/game/state.ts
- [ ] T030 Add backgroundTiles serialization (entity, type, durability tuples) in src/lib/game/state.ts
- [ ] T031 Add horizonY to serialize function output in src/lib/game/state.ts
- [ ] T032 Add backgroundTileGrid deserialization with backwards compatibility fallback in src/lib/game/state.ts
- [ ] T033 Add backgroundTiles Map reconstruction from serialized tuples in src/lib/game/state.ts
- [ ] T034 Add horizonY deserialization with default fallback (worldHeight * 0.3) in src/lib/game/state.ts

**Checkpoint**: Save/load preserves all background state, old saves remain compatible.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, performance validation, and edge cases

- [ ] T035 Clean up any orphaned background tile graphics when tiles are removed in src/lib/render/renderer.ts
- [ ] T036 Verify 60 FPS performance with full 100x50 world visible (foreground + background)
- [ ] T037 Validate container z-order: permanent → background → foreground → entities → UI
- [ ] T038 Run quickstart.md validation checklist manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed sequentially in priority order (P1 → P2 → P3)
  - US2 and US3 can theoretically start in parallel with US1, but sequential is safer
- **Persistence (Phase 6)**: Can start after Foundational, ideally after US1
- **Polish (Phase 7)**: Depends on all user stories and persistence being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2, but benefits from US1 being complete for testing

### Within Each User Story

- Renderer changes before calling new render functions
- Interface changes before implementation
- Helper functions before main logic

### Parallel Opportunities

- All Setup tasks (T001-T004) can run in parallel
- Within each phase, tasks marked [P] can run in parallel
- Persistence tasks (T029-T034) are in same file, run sequentially

---

## Parallel Example: Setup Phase

```bash
# Launch all setup tasks together:
Task: "Create PermanentBackgroundType enum in src/lib/components/background.ts"
Task: "Add BackgroundTile interface in src/lib/components/tile.ts"
Task: "Add background color constants in src/lib/config/colors.ts"
Task: "Add BACKGROUND_TILE_COLORS record in src/lib/config/colors.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Mine a block, verify background appears
5. Demo/validate core feature working

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Core feature works (MVP!)
3. Add User Story 2 → Test independently → Horizon visible
4. Add User Story 3 → Test independently → Backgrounds mineable
5. Add Persistence → Save/load works
6. Polish → Performance validated

### Recommended Order

For single developer, implement sequentially:
1. Phase 1 (Setup) - all parallel
2. Phase 2 (Foundational) - sequential
3. Phase 3 (US1) - sequential
4. Phase 6 (Persistence) - can interleave with US2
5. Phase 4 (US2) - sequential
6. Phase 5 (US3) - sequential
7. Phase 7 (Polish) - final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No test tasks included (not explicitly requested in spec)
- Background mining does NOT drop resources (spec assumption)
- Container z-order is critical for correct visual layering
