# Tasks: Resource Logistics System

**Input**: Design documents from `/specs/007-resource-logistics/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested. Manual playtests per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- All file paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend existing components and state for resource logistics

- [x] T001 Add isGrounded field to Resource interface in src/lib/components/resource.ts
- [x] T002 [P] Update createResource() to initialize isGrounded: false in src/lib/components/resource.ts
- [x] T003 Add GnomeInventoryItem interface and GNOME_INVENTORY_CAPACITY constant in src/lib/components/gnome.ts
- [x] T004 Add inventory field to Gnome interface in src/lib/components/gnome.ts
- [x] T005 [P] Update createGnome() to initialize empty inventory array in src/lib/components/gnome.ts
- [x] T006 [P] Add hasInventorySpace(), addToGnomeInventory(), clearGnomeInventory() helper functions in src/lib/components/gnome.ts
- [x] T007 Add GnomeState.Collecting and GnomeState.Depositing to GnomeState enum in src/lib/components/gnome.ts
- [x] T008 Add targetEntity field to Task interface in src/lib/components/task.ts
- [x] T009 [P] Add TaskType.Collect to TaskType enum in src/lib/components/task.ts
- [x] T010 [P] Add createCollectTask() factory function in src/lib/components/task.ts
- [x] T011 [P] Update createDigTask() to include targetEntity: null in src/lib/components/task.ts

**Checkpoint**: Component interfaces extended, ready for new components

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add new components and extend GameState - MUST complete before user stories

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T012 Create Building component with BuildingType enum, Building interface, BUILDING_CONFIG in src/lib/components/building.ts
- [x] T013 [P] Add createBuilding() factory function in src/lib/components/building.ts
- [x] T014 Create Storage component with Storage interface, createStorage(), addToStorage() functions in src/lib/components/storage.ts
- [x] T015 [P] Add getStorageCount(), getStorageTotal() helper functions in src/lib/components/storage.ts
- [x] T016 Add buildings Map<Entity, Building> and storages Map<Entity, Storage> to GameState interface in src/lib/game/state.ts
- [x] T017 Update createEmptyState() to initialize empty buildings and storages Maps in src/lib/game/state.ts
- [x] T018 [P] Add SerializedStorage interface to handle Map serialization in src/lib/game/state.ts
- [x] T019 Update serialize() to include buildings and storages in src/lib/game/state.ts
- [x] T020 Update deserialize() to restore buildings and storages (with backwards compatibility) in src/lib/game/state.ts
- [x] T021 Add addBuilding(), removeBuilding(), getEntitiesWithBuilding() functions in src/lib/ecs/world.ts
- [x] T022 [P] Add addStorage(), removeStorage(), getEntitiesWithStorage() functions in src/lib/ecs/world.ts
- [x] T023 [P] Add STORAGE_COLOR constant to src/lib/config/colors.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Resource Physics (Priority: P1)

**Goal**: Dropped resources fall with gravity and land on solid ground

**Independent Test**: Mine a tile above empty space and verify the dropped resource falls until it lands on a solid tile below.

### Implementation for User Story 1

- [x] T024 [US1] Create resourcePhysicsSystem() function skeleton in src/lib/systems/resource-physics.ts
- [x] T025 [US1] Implement gravity application to non-grounded resources in src/lib/systems/resource-physics.ts
- [x] T026 [US1] Implement solid ground detection and landing logic in src/lib/systems/resource-physics.ts
- [x] T027 [US1] Implement isGrounded state transition (false → true) when landing in src/lib/systems/resource-physics.ts
- [x] T028 [US1] Implement re-fall detection when supporting tile is removed in src/lib/systems/resource-physics.ts
- [x] T029 [US1] Export resourcePhysicsSystem from src/lib/systems/resource-physics.ts
- [x] T030 [US1] Import and add resourcePhysicsSystem to game loop in src/lib/components/Game.svelte
- [x] T031 [US1] Update dropResource() in src/lib/systems/mining.ts to create resource with isGrounded: false

**Checkpoint**: Resources fall with gravity and land on solid ground - User Story 1 complete and testable

---

## Phase 4: User Story 2 - Collect Task System (Priority: P2)

**Goal**: Grounded resources generate Collect tasks; gnomes can be assigned to collect them

**Independent Test**: Mine a tile, let the resource land, observe a Collect task is created, assign a gnome, and verify the gnome picks up the resource.

### Implementation for User Story 2

- [ ] T032 [US2] Add Collect task auto-generation when resource becomes grounded in src/lib/systems/resource-physics.ts
- [ ] T033 [US2] Create collectTaskSystem() function skeleton in src/lib/systems/collect-task.ts
- [ ] T034 [US2] Implement gnome walking to resource location (reuse pathfinding) in src/lib/systems/collect-task.ts
- [ ] T035 [US2] Implement resource pickup: remove resource entity, add to gnome inventory in src/lib/systems/collect-task.ts
- [ ] T036 [US2] Implement Collect task completion and removal in src/lib/systems/collect-task.ts
- [ ] T037 [US2] Export collectTaskSystem from src/lib/systems/collect-task.ts
- [ ] T038 [US2] Import and add collectTaskSystem to game loop in src/lib/components/Game.svelte
- [ ] T039 [US2] Update task assignment to handle TaskType.Collect in src/lib/systems/task-assignment.ts
- [ ] T040 [US2] Remove auto-collection logic from src/lib/systems/resource-collection.ts (replace with collect-task based collection)

**Checkpoint**: Collect tasks auto-generated for grounded resources, gnomes collect via tasks - User Story 2 complete and testable

---

## Phase 5: User Story 3 - Gnome Inventory (Priority: P3)

**Goal**: Gnomes have limited inventory (max 5), visible when selected

**Independent Test**: Have a gnome collect 3 resources, select the gnome, and verify the inventory shows 3 items. Then try to collect a 6th resource and verify it's rejected.

### Implementation for User Story 3

- [ ] T041 [US3] Update task assignment to check gnome inventory capacity before assigning Collect tasks in src/lib/systems/task-assignment.ts
- [ ] T042 [US3] Implement inventory capacity enforcement (reject when full) in src/lib/systems/collect-task.ts
- [ ] T043 [US3] Add gnome inventory display section to SelectionPanel in src/lib/components/hud/SelectionPanel.svelte
- [ ] T044 [US3] Style gnome inventory display (item types and counts) in src/lib/components/hud/SelectionPanel.svelte

**Checkpoint**: Gnome inventory works with 5-item limit, visible in UI - User Story 3 complete and testable

---

## Phase 6: User Story 4 - Storage Building (Priority: P4)

**Goal**: Player can place Storage; gnomes automatically deposit collected resources

**Independent Test**: Place a Storage building, have a gnome collect resources, verify the gnome automatically goes to Storage and deposits items.

### Implementation for User Story 4

- [ ] T045 [US4] Add PlaceBuilding command type to src/lib/game/commands.ts
- [ ] T046 [US4] Implement PlaceBuilding command handler in src/lib/game/command-processor.ts
- [ ] T047 [US4] Create BuildPanel.svelte with Storage build button in src/lib/components/hud/BuildPanel.svelte
- [ ] T048 [US4] Add build mode state and placement validation (solid ground check) in src/lib/components/Game.svelte
- [ ] T049 [US4] Implement placement preview (valid/invalid visual feedback) in src/lib/render/renderer.ts
- [ ] T050 [US4] Create depositSystem() function skeleton in src/lib/systems/deposit.ts
- [ ] T051 [US4] Implement gnome auto-deposit behavior: detect inventory not empty + Storage exists in src/lib/systems/deposit.ts
- [ ] T052 [US4] Implement pathfinding to nearest Storage in src/lib/systems/deposit.ts
- [ ] T053 [US4] Implement deposit action: transfer all inventory items to Storage contents in src/lib/systems/deposit.ts
- [ ] T054 [US4] Export depositSystem from src/lib/systems/deposit.ts
- [ ] T055 [US4] Import and add depositSystem to game loop in src/lib/components/Game.svelte
- [ ] T056 [US4] Add Storage building rendering (2x2 colored rectangle) in src/lib/render/renderer.ts
- [ ] T057 [US4] Add Storage contents display to SelectionPanel when Storage selected in src/lib/components/hud/SelectionPanel.svelte

**Checkpoint**: Storage buildings can be placed, gnomes auto-deposit - User Story 4 complete and testable

---

## Phase 7: User Story 5 - Global Resource Availability (Priority: P5)

**Goal**: HUD shows only resources deposited in Storage (sum of all Storages)

**Independent Test**: Mine tiles, collect resources with gnome, check HUD shows 0 until gnome deposits in Storage, then verify HUD count increases.

### Implementation for User Story 5

- [ ] T058 [US5] Create getStoredResources() helper to sum all Storage contents in src/lib/game/state.ts
- [ ] T059 [US5] Update ResourcePanel to use getStoredResources() instead of state.inventory in src/lib/components/hud/ResourcePanel.svelte
- [ ] T060 [US5] Update TopBar to pass storages to ResourcePanel in src/lib/components/hud/TopBar.svelte
- [ ] T061 [US5] Remove or repurpose state.inventory field (optional cleanup) in src/lib/game/state.ts

**Checkpoint**: HUD shows accurate stored resource counts - User Story 5 complete and testable

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and edge case handling

- [ ] T062 Verify resources persist across save/load using quickstart.md Test 10 scenarios
- [ ] T063 [P] Verify gnome inventory persists across save/load
- [ ] T064 [P] Verify Storage contents persist across save/load
- [ ] T065 Verify resource re-fall when supporting tile removed (quickstart.md Test 9)
- [ ] T066 [P] Verify multiple resources on same tile have visual offset (no overlap)
- [ ] T067 [P] Verify gnome with full inventory doesn't accept new Collect tasks
- [ ] T068 [P] Verify gnome without Storage available remains idle with full inventory
- [ ] T069 Run full quickstart.md test scenarios 1-10 for complete validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T001-T011 completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T012-T023)
- **User Story 2 (Phase 4)**: Depends on US1 (resources must fall and land first)
- **User Story 3 (Phase 5)**: Depends on US2 (gnomes must collect first)
- **User Story 4 (Phase 6)**: Depends on US3 (gnomes need inventory to deposit from)
- **User Story 5 (Phase 7)**: Depends on US4 (Storage must exist to sum contents)
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 - Resources must land to generate Collect tasks
- **User Story 3 (P3)**: Depends on US2 - Must collect to test inventory limits
- **User Story 4 (P4)**: Depends on US3 - Must have inventory to deposit
- **User Story 5 (P5)**: Depends on US4 - Must have Storage to compute totals

**Note**: These stories are sequential by design (per spec). Each builds on the previous.

### Within Each User Story

- System creation before game loop integration
- Core logic before UI integration
- Functionality before polish

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T005, T006 can run in parallel (different functions)
- T009, T010, T011 can run in parallel (same file, different functions)

**Phase 2 (Foundational)**:
- T013, T015 can run in parallel (different files)
- T018, T022, T023 can run in parallel (different files)

**Phase 8 (Polish)**:
- T063, T064, T066, T067, T068 can run in parallel (independent test scenarios)

---

## Parallel Example: Phase 1 Setup

```bash
# After T001 (isGrounded field), these can run in parallel:
Task: "Update createResource() to initialize isGrounded: false" (T002)
# Separate from gnome tasks

# After T003-T004 (inventory types), these can run in parallel:
Task: "Update createGnome() to initialize empty inventory array" (T005)
Task: "Add hasInventorySpace(), addToGnomeInventory(), clearGnomeInventory() helper functions" (T006)

# Task types can run in parallel:
Task: "Add TaskType.Collect to TaskType enum" (T009)
Task: "Add createCollectTask() factory function" (T010)
Task: "Update createDigTask() to include targetEntity: null" (T011)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T011)
2. Complete Phase 2: Foundational (T012-T023)
3. Complete Phase 3: User Story 1 (T024-T031)
4. **STOP and VALIDATE**: Mine tiles, see resources fall and land
5. Can demo resource physics mechanic

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test: Resources fall → Demo (MVP!)
3. Add User Story 2 → Test: Collect tasks work → Demo
4. Add User Story 3 → Test: Inventory limits work → Demo
5. Add User Story 4 → Test: Storage + deposit work → Demo
6. Add User Story 5 → Test: HUD shows stored only → Demo
7. Complete Polish → Full validation

### Suggested MVP Scope

**User Story 1 only** - This delivers the core mechanic (resource physics) and proves the extended component system works. Stories 2-5 build the logistics chain incrementally.

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|----------------------|
| Setup | 11 (T001-T011) | 6 tasks parallelizable |
| Foundational | 12 (T012-T023) | 4 tasks parallelizable |
| User Story 1 | 8 (T024-T031) | 0 (sequential dependency) |
| User Story 2 | 9 (T032-T040) | 0 (sequential dependency) |
| User Story 3 | 4 (T041-T044) | 0 (sequential dependency) |
| User Story 4 | 13 (T045-T057) | 0 (sequential dependency) |
| User Story 5 | 4 (T058-T061) | 0 (sequential dependency) |
| Polish | 8 (T062-T069) | 5 tasks parallelizable |
| **Total** | **69 tasks** | **15 parallel opportunities** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- User stories are sequential (US1→US2→US3→US4→US5) per spec design
- No automated tests - use quickstart.md for manual validation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
