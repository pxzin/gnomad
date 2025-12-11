# Tasks: Performance Optimization

**Input**: Design documents from `/specs/005-performance-optimization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested - validation via `pnpm check` and manual FPS testing.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/lib/` at repository root
- Config files: `src/lib/config/`
- Utils: `src/lib/utils/`
- Systems: `src/lib/systems/`
- Render: `src/lib/render/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create performance config and utility files

- [ ] T001 Create performance config file at `src/lib/config/performance.ts` with TASK_ASSIGNMENT_THROTTLE_TICKS, MAX_PATHFIND_ATTEMPTS_PER_GNOME constants
- [ ] T002 Update barrel file `src/lib/config/index.ts` to export performance module
- [ ] T003 [P] Create utils directory structure with `src/lib/utils/binary-heap.ts` (empty placeholder)

**Checkpoint**: Config structure ready for optimization implementations

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Binary heap implementation needed by multiple user stories

**⚠️ Note**: Binary heap is used by US3 (Pathfinding) but created here as it's a reusable utility

- [ ] T004 Implement BinaryHeap class in `src/lib/utils/binary-heap.ts` with push, pop, peek, size, isEmpty, clear methods
- [ ] T005 Run `pnpm check` to validate BinaryHeap types

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Smooth Gameplay at Scale (Priority: P1) 🎯 MVP

**Goal**: Achieve 55+ FPS with 100 gnomes and 2000 tasks through quick wins

**Independent Test**: Start game, spawn 100 gnomes, create 2000 dig tasks. FPS should stay at 55+.

### Implementation for User Story 1

- [ ] T006 [US1] Add throttling to `src/lib/systems/task-assignment.ts` - check `tick % TASK_ASSIGNMENT_THROTTLE_TICKS`
- [ ] T007 [US1] Add pathfinding attempt limit to `findReachableTask` in `src/lib/systems/task-assignment.ts` - max MAX_PATHFIND_ATTEMPTS_PER_GNOME attempts
- [ ] T008 [US1] Batch task marker rendering in `src/lib/render/renderer.ts` - single stroke() call for all markers
- [ ] T009 [US1] Run `pnpm check` to validate US1 changes
- [ ] T010 [US1] Manual test: Verify FPS with 44 gnomes + 2000 tasks (baseline improvement)

**Checkpoint**: Core performance issue resolved. Game should be playable at scale.

---

## Phase 4: User Story 2 - Responsive Task Assignment (Priority: P2)

**Goal**: Task assignment completes efficiently without redundant calculations

**Independent Test**: Create 1000 tasks rapidly. Gnomes should pick up tasks without visible lag.

### Implementation for User Story 2

- [ ] T011 [US2] Extract `getUnassignedTasks` sorting logic in `src/lib/systems/task-assignment.ts` to use cached result
- [ ] T012 [US2] Add task cache invalidation hook in `src/lib/game/commands.ts` for dig/cancelDig commands
- [ ] T013 [US2] Run `pnpm check` to validate US2 changes
- [ ] T014 [US2] Manual test: Rapid task creation (100 tasks in 1 second) - no frame drops

**Checkpoint**: Task assignment is efficient with large task queues.

---

## Phase 5: User Story 3 - Efficient Pathfinding (Priority: P3)

**Goal**: A* pathfinding optimized with binary heap and Map lookups

**Independent Test**: 50 gnomes simultaneously pathfinding to distant targets with no FPS impact.

### Implementation for User Story 3

- [ ] T015 [US3] Replace array-based openSet with BinaryHeap in `src/lib/systems/pathfinding.ts`
- [ ] T016 [US3] Add Map-based lookup for openSet nodes in `src/lib/systems/pathfinding.ts` (numeric key: x*10000+y)
- [ ] T017 [US3] Replace string keys in closedSet with numeric keys in `src/lib/systems/pathfinding.ts`
- [ ] T018 [US3] Run `pnpm check` to validate US3 changes
- [ ] T019 [US3] Manual test: 50 gnomes pathfinding simultaneously - FPS stays at 55+

**Checkpoint**: Pathfinding is significantly faster with O(log n) heap operations.

---

## Phase 6: User Story 4 - Smooth Rendering (Priority: P4)

**Goal**: Rendering optimized with dirty flags to avoid unnecessary redraws

**Independent Test**: Pan camera across 100+ visible gnomes. Movement should be smooth.

### Implementation for User Story 4

- [ ] T020 [US4] Add position tracking to gnome rendering in `src/lib/render/renderer.ts` - only clear/redraw if position changed
- [ ] T021 [US4] Add color tracking to tile rendering in `src/lib/render/renderer.ts` - skip redraw if tile unchanged
- [ ] T022 [US4] Run `pnpm check` to validate US4 changes
- [ ] T023 [US4] Manual test: Camera panning with 100+ entities - smooth, no stuttering

**Checkpoint**: Rendering is efficient with minimal unnecessary redraws.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T024 [P] Update CLAUDE.md with performance optimization patterns
- [ ] T025 Run `pnpm check` final validation
- [ ] T026 Manual test: Full scenario - 100 gnomes, 2000 tasks, camera panning - 55+ FPS
- [ ] T027 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - Binary heap needed by US3
- **User Stories (Phase 3-6)**: All can proceed after Foundational
  - US1 (P1): No dependencies on other stories - delivers MVP
  - US2 (P2): Independent of US1 - can run in parallel
  - US3 (P3): Depends on BinaryHeap from Foundational
  - US4 (P4): Independent of other stories
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup - MVP, biggest impact
- **User Story 2 (P2)**: Can start after Setup - Independent optimization
- **User Story 3 (P3)**: Depends on Foundational (BinaryHeap) - Core algorithm improvement
- **User Story 4 (P4)**: Can start after Setup - Independent rendering optimization

### Within Each User Story

- Implementation tasks before validation
- `pnpm check` before manual testing
- Manual test to verify acceptance criteria

### Parallel Opportunities

- T001, T003 can run in parallel (different files)
- US1, US2, US4 can run in parallel after Setup (different systems)
- US3 must wait for Foundational phase
- T024 can run in parallel with T025

---

## Parallel Example: Setup Phase

```bash
# Launch config and utils creation together:
Task: "Create performance config at src/lib/config/performance.ts"
Task: "Create binary-heap placeholder at src/lib/utils/binary-heap.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T010)
4. **STOP and VALIDATE**: Test with 44+ gnomes and 2000+ tasks
5. If FPS is 55+, MVP is delivered

### Incremental Delivery

1. Complete Setup → Config files ready
2. Complete Foundational → BinaryHeap ready
3. Add User Story 1 → 10-50x improvement in task assignment → **MVP!**
4. Add User Story 3 → 5-10x improvement in pathfinding
5. Add User Story 2 → Additional task assignment efficiency
6. Add User Story 4 → Rendering optimization
7. Polish → Final validation

### Recommended Execution Order

For single developer (optimal impact order):

1. Setup (3 tasks)
2. Foundational (2 tasks)
3. **US1 (P1)** - Task throttling + attempt limits → Major impact
4. **US3 (P3)** - Pathfinding optimization → Uses BinaryHeap
5. **US2 (P2)** - Task cache → Secondary optimization
6. **US4 (P4)** - Render optimization → Polish
7. Polish (4 tasks)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable
- Validation: `pnpm check` + manual FPS testing
- Commit after each user story completion
- Stop at any checkpoint to validate progress
- Target: 55+ FPS with 100 gnomes and 2000 tasks
