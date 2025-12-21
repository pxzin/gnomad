# Tasks: Climbing Mechanics

**Input**: Design documents from `/specs/011-climbing-mechanics/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in spec - tests NOT included in task list.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and core type definitions

- [ ] T001 [P] Create ClimbableSurfaceType enum and SurfaceModifier interface in src/lib/components/climbing.ts
- [ ] T002 [P] Create Health interface with current/max fields in src/lib/components/gnome.ts
- [ ] T003 [P] Add climbing constants (GNOME_CLIMB_SPEED, BASE_FALL_CHANCE, FALL_DAMAGE_THRESHOLD, FALL_DAMAGE_PER_TILE) in src/lib/config/climbing.ts
- [ ] T004 [P] Add health constants (GNOME_MAX_HEALTH, HEALTH_RECOVERY_RATE) in src/lib/config/physics.ts
- [ ] T005 Add SURFACE_MODIFIERS lookup object with speed/fall/pathfinding costs per surface type in src/lib/config/climbing.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Extend GnomeState enum with Climbing and Incapacitated values in src/lib/components/gnome.ts
- [ ] T007 Add fallStartY field to Gnome interface in src/lib/components/gnome.ts
- [ ] T008 Update createGnome() factory to initialize fallStartY: null in src/lib/components/gnome.ts
- [ ] T009 Add healths Map<Entity, Health> to GameState interface in src/lib/game/state.ts
- [ ] T010 Add healths to createEmptyState() initialization in src/lib/game/state.ts
- [ ] T011 Update serialize() to include healths in src/lib/game/state.ts
- [ ] T012 Update deserialize() with backwards compatibility for healths (create 100/100 for existing gnomes) in src/lib/game/state.ts
- [ ] T013 [P] Add getHealth, updateHealth, hasHealth accessors in src/lib/ecs/world.ts
- [ ] T014 [P] Create getClimbableSurface() function to detect surface type at position in src/lib/systems/climbing.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Gnome Escapes from Pit (Priority: P1) 🎯 MVP

**Goal**: Gnomes can climb out of pits using available surfaces at 30% walking speed

**Independent Test**: Place a gnome in a 3-block deep pit and observe it climb out

### Implementation for User Story 1

- [ ] T015 [US1] Create climbingSystem() main function shell in src/lib/systems/climbing.ts
- [ ] T016 [US1] Implement climbing state transition logic (Idle/Walking → Climbing) in src/lib/systems/climbing.ts
- [ ] T017 [US1] Add Climbing state movement handling in updateGnomePhysics() in src/lib/systems/physics.ts
- [ ] T018 [US1] Apply GNOME_CLIMB_SPEED (30% of normal) for vertical movement while climbing in src/lib/systems/physics.ts
- [ ] T019 [US1] Add climbingSystem() call to game loop before physics in src/lib/game/loop.ts
- [ ] T020 [US1] Update pathfinding getNeighbors() to detect climbable surfaces in src/lib/systems/pathfinding.ts

**Checkpoint**: Gnomes can climb out of pits - core MVP complete

---

## Phase 4: User Story 2 - Fall Risk During Climbing (Priority: P2)

**Goal**: Gnomes have a per-tick chance to fall while climbing

**Independent Test**: Have gnomes perform extended climbing and observe occasional falls

### Implementation for User Story 2

- [ ] T021 [US2] Create shouldFall() deterministic fall chance check using seeded PRNG in src/lib/systems/climbing.ts
- [ ] T022 [US2] Implement fall trigger in climbingSystem() when shouldFall() returns true in src/lib/systems/climbing.ts
- [ ] T023 [US2] Transition gnome from Climbing to Falling state on fall trigger in src/lib/systems/climbing.ts
- [ ] T024 [US2] Set fallStartY when gnome starts falling in src/lib/systems/physics.ts

**Checkpoint**: Gnomes have fall risk while climbing

---

## Phase 5: User Story 3 - Fall Damage and Incapacitation (Priority: P2)

**Goal**: Gnomes take damage from significant falls and become incapacitated at zero health

**Independent Test**: Drop gnomes from various heights and observe health reduction/incapacitation

### Implementation for User Story 3

- [ ] T025 [US3] Create applyDamage() function to reduce health in src/lib/systems/health.ts
- [ ] T026 [US3] Create healthSystem() main function with recovery logic for incapacitated gnomes in src/lib/systems/health.ts
- [ ] T027 [US3] Implement fall damage calculation on landing (damage = (height - 2) * 10) in src/lib/systems/physics.ts
- [ ] T028 [US3] Call applyDamage() when gnome lands from significant fall in src/lib/systems/physics.ts
- [ ] T029 [US3] Transition gnome to Incapacitated state when health reaches 0 in src/lib/systems/health.ts
- [ ] T030 [US3] Add healthSystem() call to game loop after physics in src/lib/game/loop.ts
- [ ] T031 [US3] Update task assignment to skip Incapacitated gnomes in src/lib/systems/task-assignment.ts
- [ ] T032 [US3] Initialize Health component for newly spawned gnomes in src/lib/game/spawn.ts

**Checkpoint**: Fall damage and incapacitation working

---

## Phase 6: User Story 4 - Pathfinding with Climbing Routes (Priority: P3)

**Goal**: Pathfinding considers climbing routes with higher costs

**Independent Test**: Setup scenarios where climbing is only path vs. walking route exists

### Implementation for User Story 4

- [ ] T033 [US4] Create getClimbCost() function using SURFACE_MODIFIERS lookup in src/lib/systems/pathfinding.ts
- [ ] T034 [US4] Replace hardcoded COST_CLIMB with getClimbCost() in getNeighbors() in src/lib/systems/pathfinding.ts
- [ ] T035 [US4] Ensure pathfinding prefers non-climbing routes when travel time similar in src/lib/systems/pathfinding.ts

**Checkpoint**: Pathfinding uses intelligent climbing route costs

---

## Phase 7: User Story 5 - Surface-Specific Climbing Behavior (Priority: P3)

**Goal**: Different surfaces have different climbing speeds and fall risks

**Independent Test**: Have gnomes climb different surface types and measure speed/fall differences

### Implementation for User Story 5

- [ ] T036 [US5] Apply surface-specific speed modifier from SURFACE_MODIFIERS in climbing movement in src/lib/systems/physics.ts
- [ ] T037 [US5] Apply surface-specific fall chance modifier in shouldFall() in src/lib/systems/climbing.ts
- [ ] T038 [US5] Verify sky background (above horizon) returns ClimbableSurfaceType.None in src/lib/systems/climbing.ts
- [ ] T039 [US5] Handle edge case: gnome falling when surface is destroyed in src/lib/systems/climbing.ts

**Checkpoint**: All surface types have distinct climbing behaviors

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T040 Clear fallStartY when gnome lands to prevent stale data in src/lib/systems/physics.ts
- [ ] T041 Add backwards compatibility for fallStartY in deserialize() in src/lib/game/state.ts
- [ ] T042 Run pnpm check to verify TypeScript compilation succeeds
- [ ] T043 Run pnpm lint to verify code style compliance
- [ ] T044 Manual testing: verify gnome escapes pit (US1)
- [ ] T045 Manual testing: verify fall risk during climb (US2)
- [ ] T046 Manual testing: verify fall damage and incapacitation (US3)
- [ ] T047 Manual testing: verify pathfinding prefers easier routes (US4)
- [ ] T048 Manual testing: verify surface speed differences (US5)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - US2 depends on US1 (climbing must work to test fall risk)
  - US3 depends on US2 (fall damage requires falling)
  - US4 and US5 can run in parallel after US1
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - MVP, no story dependencies
- **User Story 2 (P2)**: Requires US1 complete (climbing must work)
- **User Story 3 (P2)**: Requires US2 complete (need fall mechanics)
- **User Story 4 (P3)**: Can start after US1 (just pathfinding costs)
- **User Story 5 (P3)**: Can start after US2 (needs fall chance infrastructure)

### Parallel Opportunities

Within Phase 1 (Setup):
- T001, T002, T003, T004 can run in parallel (different files)
- T005 depends on T001 (needs ClimbableSurfaceType)

Within Phase 2 (Foundational):
- T006-T012 are sequential (same files, dependent changes)
- T013, T014 can run in parallel with each other

---

## Parallel Example: Phase 1

```bash
# Launch all independent setup tasks together:
Task: T001 "Create ClimbableSurfaceType enum in src/lib/components/climbing.ts"
Task: T002 "Create Health interface in src/lib/components/gnome.ts"
Task: T003 "Add climbing constants in src/lib/config/climbing.ts"
Task: T004 "Add health constants in src/lib/config/physics.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T014)
3. Complete Phase 3: User Story 1 (T015-T020)
4. **STOP and VALIDATE**: Test gnome escaping pit independently
5. Deploy/demo if ready - gnomes can climb!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test pit escape → MVP!
3. Add User Story 2 → Test fall risk → Demo
4. Add User Story 3 → Test damage/incapacitation → Demo
5. Add User Story 4 + 5 → Test pathfinding + surfaces → Complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable after completion
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All constants go in config/ per CLAUDE.md guidelines
- Systems are stateless functions per constitution
