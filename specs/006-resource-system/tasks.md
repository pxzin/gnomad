# Tasks: Resource System

**Input**: Design documents from `/specs/006-resource-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested. Manual playtests per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All file paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create base component and extend state for resource entities

- [ ] T001 Create ResourceType enum and Resource interface in src/lib/components/resource.ts
- [ ] T002 [P] Add RESOURCE_CONFIG with colors for each resource type in src/lib/components/resource.ts
- [ ] T003 [P] Add getResourceTypeForTile() mapping function in src/lib/components/resource.ts
- [ ] T004 Add resources Map and inventory to GameState interface in src/lib/game/state.ts
- [ ] T005 Update createInitialState() with empty resources and inventory in src/lib/game/state.ts
- [ ] T006 [P] Update serialize() to include resources and inventory in src/lib/game/state.ts
- [ ] T007 [P] Update deserialize() to restore resources and inventory in src/lib/game/state.ts

**Checkpoint**: Resource data structures defined, state extended, serialization ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add ECS functions for resource entity management

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Add addResource() function to add Resource component in src/lib/ecs/world.ts
- [ ] T009 [P] Add removeResource() function in src/lib/ecs/world.ts
- [ ] T010 [P] Add getEntitiesWithResource() query function in src/lib/ecs/world.ts
- [ ] T011 Export resource functions from src/lib/ecs/world.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Resource Drop on Mining (Priority: P1) 🎯 MVP

**Goal**: When a gnome mines a tile, the tile drops a resource item onto the ground

**Independent Test**: Mine a single dirt tile and verify a dirt resource entity appears at the mined location

### Implementation for User Story 1

- [ ] T012 [US1] Create dropResource() helper function in src/lib/systems/mining.ts
- [ ] T013 [US1] Modify mining system to call dropResource() when tile durability reaches 0 in src/lib/systems/mining.ts
- [ ] T014 [P] [US1] Add RESOURCE_ENTITY_COLOR constant to src/lib/config/colors.ts
- [ ] T015 [P] [US1] Add resourceGraphics Map and resourceCache to Renderer interface in src/lib/render/renderer.ts
- [ ] T016 [US1] Initialize resourceGraphics and resourceCache in createRenderer() in src/lib/render/renderer.ts
- [ ] T017 [US1] Clear resourceGraphics in destroyRenderer() in src/lib/render/renderer.ts
- [ ] T018 [US1] Implement renderResources() function in src/lib/render/renderer.ts
- [ ] T019 [US1] Call renderResources() from render() function in src/lib/render/renderer.ts

**Checkpoint**: Mining tiles drops visible resource entities - User Story 1 complete and testable

---

## Phase 4: User Story 2 - Resource Collection (Priority: P2)

**Goal**: Gnomes automatically collect resource items when they walk over them, adding to global resource counter

**Independent Test**: Drop a resource item, have a gnome walk over it, verify resource disappears and counter increases

### Implementation for User Story 2

- [ ] T020 [US2] Create resourceCollectionSystem() function in src/lib/systems/resource-collection.ts
- [ ] T021 [US2] Implement gnome-resource collision detection (same tile) in src/lib/systems/resource-collection.ts
- [ ] T022 [US2] Implement inventory update logic (increment by resource type) in src/lib/systems/resource-collection.ts
- [ ] T023 [US2] Implement resource entity destruction on collection in src/lib/systems/resource-collection.ts
- [ ] T024 [US2] Export resourceCollectionSystem from src/lib/systems/resource-collection.ts
- [ ] T025 [US2] Import and add resourceCollectionSystem to systems array in src/lib/components/Game.svelte

**Checkpoint**: Gnomes collect resources, inventory updates - User Story 2 complete and testable

---

## Phase 5: User Story 3 - Resource Display in HUD (Priority: P3)

**Goal**: The player can see current resource counts displayed in the game HUD

**Independent Test**: Collect resources and verify the HUD displays accurate counts for each resource type

### Implementation for User Story 3

- [ ] T026 [P] [US3] Add ResourceInventory type export to src/lib/components/hud/types.ts
- [ ] T027 [US3] Create ResourcePanel.svelte component in src/lib/components/hud/ResourcePanel.svelte
- [ ] T028 [US3] Style ResourcePanel with dirt and stone counts display in src/lib/components/hud/ResourcePanel.svelte
- [ ] T029 [US3] Import and add ResourcePanel to HUD layout in src/lib/components/hud/HUD.svelte

**Checkpoint**: HUD displays resource counts - User Story 3 complete and testable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and edge case handling

- [ ] T030 Verify resources persist across save/load using quickstart.md test scenarios
- [ ] T031 [P] Verify multiple resources on same tile are all collected
- [ ] T032 [P] Verify resources outside viewport still exist when scrolling
- [ ] T033 Verify bedrock tiles do not drop resources

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T001-T007 completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T008-T011)
- **User Story 2 (Phase 4)**: Depends on Foundational (T008-T011)
- **User Story 3 (Phase 5)**: Depends on Foundational (T008-T011)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Relies on resources existing (from US1) for testing
- **User Story 3 (P3)**: Can start after Foundational - Relies on inventory values (from US2) for display

**Note**: While stories can be implemented in parallel, testing requires sequential completion (US1→US2→US3) because each story builds on the previous.

### Within Each User Story

- Mining integration before rendering (US1)
- System creation before game loop integration (US2)
- Types before components before HUD integration (US3)

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003 can run in parallel (same file, different functions)
- T006, T007 can run in parallel (serialize/deserialize are independent)

**Phase 2 (Foundational)**:
- T009, T010 can run in parallel (different ECS functions)

**Phase 3 (User Story 1)**:
- T014, T015 can run in parallel (different files)

**Phase 5 (User Story 3)**:
- T026 can run in parallel with T027 (types before component)

**Phase 6 (Polish)**:
- T031, T032 can run in parallel (independent test scenarios)

---

## Parallel Example: User Story 1

```bash
# After T012-T013 complete (mining integration), these can run in parallel:
Task: "Add RESOURCE_ENTITY_COLOR constant to src/lib/config/colors.ts" (T014)
Task: "Add resourceGraphics Map and resourceCache to Renderer interface" (T015)

# Then sequential: T016 → T017 → T018 → T019
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T011)
3. Complete Phase 3: User Story 1 (T012-T019)
4. **STOP and VALIDATE**: Mine tiles, see resources drop
5. Can demo resource drop mechanic

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test: Resources drop → Demo (MVP!)
3. Add User Story 2 → Test: Resources collected → Demo
4. Add User Story 3 → Test: HUD shows counts → Demo
5. Complete Polish → Full validation

### Suggested MVP Scope

**User Story 1 only** - This delivers the core mechanic (resources drop when mining) and proves the ECS integration works. Stories 2 and 3 add polish but aren't required for initial validation.

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|----------------------|
| Setup | 7 (T001-T007) | 4 tasks parallelizable |
| Foundational | 4 (T008-T011) | 2 tasks parallelizable |
| User Story 1 | 8 (T012-T019) | 2 tasks parallelizable |
| User Story 2 | 6 (T020-T025) | 0 (sequential dependency) |
| User Story 3 | 4 (T026-T029) | 1 task parallelizable |
| Polish | 4 (T030-T033) | 2 tasks parallelizable |
| **Total** | **33 tasks** | **11 parallel opportunities** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story is independently completable
- No automated tests - use quickstart.md for manual validation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
