# Tasks: Colony Simulation Core (MVP)

**Input**: Design documents from `/specs/001-colony-sim-core/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**MVP Scope**: 1 gnome, basic mineable ground (dirt/stone layers), colored squares for visuals. Implements User Stories 1 (P1) and 2 (P2) only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **SvelteKit project**: `src/lib/` for game logic, `src/routes/` for pages
- Paths follow plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and SvelteKit + PixiJS setup

- [X] T001 Initialize SvelteKit project with TypeScript strict mode in project root
- [X] T002 Install dependencies (pixi.js, vitest, playwright) using pnpm
- [X] T003 [P] Configure tsconfig.json with strict: true, noImplicitAny, strictNullChecks
- [X] T004 [P] Configure ESLint and Prettier for TypeScript/Svelte
- [X] T005 Create directory structure per plan.md (src/lib/ecs, src/lib/components, src/lib/rendering, src/lib/input, src/lib/world-gen, src/lib/game)
- [X] T006 [P] Create docs/systems/ directory for system documentation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core ECS infrastructure and types that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Define Entity type and core ECS types in src/lib/ecs/types.ts
- [X] T008 Define GameState interface with all component Maps in src/lib/game/state.ts
- [X] T009 [P] Define Position component interface in src/lib/components/position.ts
- [X] T010 [P] Define Velocity component interface in src/lib/components/velocity.ts
- [X] T011 [P] Define Tile component with TileType enum in src/lib/components/tile.ts
- [X] T012 [P] Define Gnome component with GnomeState enum in src/lib/components/gnome.ts
- [X] T013 [P] Define Task component with TaskType and TaskPriority enums in src/lib/components/task.ts
- [X] T014 [P] Define Camera interface in src/lib/components/camera.ts
- [X] T015 [P] Define Command types (player input) in src/lib/game/commands.ts
- [X] T016 Implement createEntity, destroyEntity, addComponent, getComponent in src/lib/ecs/world.ts
- [X] T017 Implement seeded PRNG (mulberry32) in src/lib/world-gen/noise.ts
- [X] T018 Implement serialize/deserialize functions for save/load in src/lib/game/state.ts
- [X] T019 [P] Write system documentation for ECS in docs/systems/ecs.md

**Checkpoint**: Foundation ready - ECS types defined, entity management working

---

## Phase 3: User Story 1 - Start New Game and Explore World (Priority: P1)

**Goal**: Player can launch game, see procedurally generated terrain with colored squares, pan/zoom camera, and see 1 gnome on surface

**Independent Test**: Launch game in browser, verify world renders with distinct terrain layers (blue sky, brown dirt, gray stone), camera responds to mouse drag/scroll, gnome visible as colored square

### Implementation for User Story 1

#### World Generation

- [X] T020 [US1] Implement generateWorld function with layered terrain in src/lib/world-gen/generator.ts
- [X] T021 [US1] Implement getTileAt, isInBounds, isSolid helper functions in src/lib/world-gen/generator.ts
- [X] T022 [US1] Create initial gnome entity at surface spawn point in src/lib/world-gen/generator.ts
- [X] T023 [P] [US1] Write system documentation for world generation in docs/systems/world-gen.md

#### Rendering

- [X] T024 [US1] Implement createRenderer with PixiJS v8 Application init in src/lib/rendering/renderer.ts
- [X] T025 [US1] Implement tile rendering (colored rectangles) with viewport culling in src/lib/rendering/tile-renderer.ts
- [X] T026 [US1] Implement gnome rendering (colored square) in src/lib/rendering/entity-renderer.ts
- [X] T027 [US1] Implement getVisibleTileRange for camera culling in src/lib/rendering/renderer.ts
- [X] T028 [US1] Implement screenToTile coordinate conversion in src/lib/rendering/renderer.ts

#### Camera Controls

- [X] T029 [US1] Implement panCamera and zoomCamera functions in src/lib/game/state.ts
- [X] T030 [US1] Implement updateCamera for smooth interpolation in src/lib/game/state.ts
- [X] T031 [US1] Implement mouse drag for camera pan in src/lib/input/mouse.ts
- [X] T032 [US1] Implement scroll wheel for camera zoom in src/lib/input/mouse.ts
- [X] T033 [US1] Implement InputManager with flushCommands in src/lib/input/mouse.ts

#### Game Loop

- [X] T034 [US1] Implement fixed timestep game loop (60 ticks/s) in src/lib/game/loop.ts
- [X] T035 [US1] Implement tick function processing commands in src/lib/game/loop.ts
- [X] T036 [US1] Implement pause/resume and speed controls in src/lib/game/loop.ts
- [X] T037 [US1] Implement startGameLoop with render interpolation in src/lib/game/loop.ts

#### Svelte Integration

- [X] T038 [US1] Create main game page with PixiJS canvas in src/routes/+page.svelte
- [X] T039 [US1] Wire up game initialization (createGame, createRenderer, startGameLoop) in src/routes/+page.svelte
- [X] T040 [US1] Add basic UI for pause button and speed controls in src/routes/+page.svelte

**Checkpoint**: User Story 1 complete - world renders, camera works, gnome visible

---

## Phase 4: User Story 2 - Command Gnomes to Dig Terrain (Priority: P2)

**Goal**: Player can click terrain to select tiles, issue dig command, gnome pathfinds to target, mines tile, tile disappears

**Independent Test**: Click on a dirt tile, gnome walks to adjacent position, gnome mines tile (progress visible), tile removed from world

### Implementation for User Story 2

#### Tile Selection

- [X] T041 [US2] Implement tile selection on click in src/lib/input/mouse.ts
- [X] T042 [US2] Implement visual selection highlight in src/lib/rendering/tile-renderer.ts
- [X] T043 [US2] Add DIG command creation on selection + button/key in src/lib/input/mouse.ts

#### Task System

- [X] T044 [US2] Implement createDigTask function in src/lib/ecs/systems/task-system.ts
- [X] T045 [US2] Implement getTaskQueue (priority + FIFO sorting) in src/lib/ecs/systems/task-system.ts
- [X] T046 [US2] Implement assignNextTask to idle gnome in src/lib/ecs/systems/task-system.ts
- [X] T047 [US2] Implement completeTask and cancelTask in src/lib/ecs/systems/task-system.ts
- [X] T048 [P] [US2] Write system documentation for task system in docs/systems/tasks.md

#### Pathfinding

- [X] T049 [US2] Implement A* pathfinding with Manhattan heuristic in src/lib/ecs/systems/pathfinding.ts
- [X] T050 [US2] Implement findAdjacentPosition for mining approach in src/lib/ecs/systems/pathfinding.ts
- [X] T051 [P] [US2] Write system documentation for pathfinding in docs/systems/pathfinding.md

#### Movement System

- [X] T052 [US2] Implement movement system (gnome follows path) in src/lib/ecs/systems/movement.ts
- [X] T053 [US2] Handle gnome state transitions (Idle → Walking → Mining) in src/lib/ecs/systems/movement.ts
- [X] T054 [P] [US2] Write system documentation for movement in docs/systems/movement.md

#### Mining System

- [X] T055 [US2] Implement processMining (reduce durability per tick) in src/lib/ecs/systems/mining.ts
- [X] T056 [US2] Implement destroyTile (remove from grid, update rendering) in src/lib/ecs/systems/mining.ts
- [X] T057 [US2] Implement getMiningRate (base rate for MVP) in src/lib/ecs/systems/mining.ts
- [X] T058 [P] [US2] Write system documentation for mining in docs/systems/mining.md

#### Gravity System

- [X] T059 [US2] Implement shouldFall check in src/lib/ecs/systems/gravity.ts
- [X] T060 [US2] Implement applyGravity to gnome after tile destruction in src/lib/ecs/systems/gravity.ts
- [X] T061 [US2] Handle Falling state and landing in src/lib/ecs/systems/gravity.ts
- [X] T062 [P] [US2] Write system documentation for gravity in docs/systems/gravity.md

#### System Integration

- [X] T063 [US2] Integrate all systems into tick function (order: input → tasks → pathfinding → movement → mining → gravity → render)
- [X] T064 [US2] Add dig task indicator in tile rendering in src/lib/rendering/tile-renderer.ts

**Checkpoint**: User Story 2 complete - dig command works end-to-end

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T065 [P] Implement save to localStorage in src/lib/game/state.ts
- [X] T066 [P] Implement load from localStorage in src/lib/game/state.ts
- [X] T067 Add save/load buttons to UI in src/routes/+page.svelte
- [X] T068 [P] Add keyboard shortcuts (Space=pause, 1/2/3=speed) in src/lib/input/keyboard.ts
- [X] T069 Performance check: verify 60 FPS with 100x50 world
- [X] T070 Run quickstart.md validation (follow setup steps, verify game works)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (needs rendering, game loop)
- **Polish (Phase 5)**: Depends on User Story 2 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 for rendering and game loop infrastructure

### Within Each Phase

- Tasks marked [P] can run in parallel
- Within US1: World gen → Rendering → Camera → Game loop → Svelte (sequential with some parallel)
- Within US2: Selection → Tasks → Pathfinding → Movement → Mining → Gravity → Integration

### Parallel Opportunities

- T003, T004, T006 can run in parallel (Setup phase)
- T009-T015, T019 can run in parallel (component definitions)
- T023, T048, T051, T054, T058, T062 can run in parallel (documentation tasks)
- T065, T066, T068 can run in parallel (Polish phase)

---

## Parallel Example: User Story 2

```bash
# Launch documentation tasks in parallel:
Task: "Write system documentation for task system in docs/systems/tasks.md"
Task: "Write system documentation for pathfinding in docs/systems/pathfinding.md"
Task: "Write system documentation for movement in docs/systems/movement.md"
Task: "Write system documentation for mining in docs/systems/mining.md"
Task: "Write system documentation for gravity in docs/systems/gravity.md"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (world + rendering + camera)
4. **VALIDATE**: Can see world, pan camera, see gnome
5. Complete Phase 4: User Story 2 (digging)
6. **VALIDATE**: Can select tile, gnome digs it
7. Complete Phase 5: Polish (save/load, keyboard shortcuts)
8. MVP COMPLETE

### Post-MVP (Future User Stories)

After MVP validation, continue with:
- User Story 3 (Building) - requires stockpile from mining
- User Story 4 (Resource Management) - requires building
- User Story 5 (Crafting) - requires resources + building
- User Story 6 (Survival) - requires all above

---

## Notes

- [P] tasks = different files, no dependencies
- [US1], [US2] labels map task to user story
- MVP scope: US1 + US2 only (1 gnome, colored squares, basic digging)
- No tests included (not explicitly requested in spec)
- Constitution compliance: All code must have strict types, ECS pattern, deterministic state
- Commit after each task or logical group
