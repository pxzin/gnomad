# Tasks: Task Priority and Distance System

**Input**: Design documents from `/specs/008-task-priority/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested for this feature. Manual testing via gameplay.

**Organization**: Tasks grouped by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US4)
- Note: US3 is DEFERRED (priority tool - out of scope)

## Path Conventions

Single project structure: `src/lib/` at repository root

---

## Phase 1: Setup (Configuration)

**Purpose**: Add priority color constants and labels needed by all user stories

- [x] T001 [P] Add TASK_PRIORITY_COLORS mapping in src/lib/config/colors.ts
- [x] T002 [P] Add TASK_PRIORITY_LABELS mapping in src/lib/components/task.ts

**Checkpoint**: Color and label constants available for use

---

## Phase 2: User Story 1+2 - Priority-Aware Distance Sorting (Priority: P1) 🎯 MVP

**Goal**: Gnomes select tasks based on priority first, then distance (closest within same priority)

**Why Combined**: US1 and US2 are two aspects of the same algorithm - they must be implemented together for correct behavior.

**Independent Test**:
1. Create tasks at different distances with same priority → gnome picks closest
2. Create nearby Low priority task + distant High priority task → gnome picks High

### Implementation

- [x] T003 [US1+2] Add helper function to group tasks by priority in src/lib/systems/task-assignment.ts
- [x] T004 [US1+2] Modify findReachableTask() to iterate priority groups (highest first) in src/lib/systems/task-assignment.ts
- [x] T005 [US1+2] Within each priority group, find closest reachable task (by path length) in src/lib/systems/task-assignment.ts
- [x] T006 [US1+2] Add FIFO tiebreaker when path lengths are equal in src/lib/systems/task-assignment.ts
- [x] T007 [US1+2] Verify MAX_PATHFIND_ATTEMPTS_PER_GNOME is respected across groups in src/lib/systems/task-assignment.ts

**Checkpoint**: Core algorithm complete. Gnomes now select tasks by priority + distance. Manually test:
- Same priority: gnome picks closest reachable task
- Different priority: gnome picks higher priority even if farther
- Unreachable: gnome skips to next best option
- FIFO: equal priority+distance uses creation time

---

## Phase 3: User Story 4 - Visual Priority Indicators (Priority: P2)

**Goal**: Task markers display colors based on priority level

**Independent Test**: Create tasks with each priority level and verify marker colors match (Gray, Blue, Yellow, Red)

### Implementation

- [x] T008 [US4] Import TASK_PRIORITY_COLORS in src/lib/render/renderer.ts
- [x] T009 [US4] Modify renderTaskMarkers() to look up task priority from state in src/lib/render/renderer.ts
- [x] T010 [US4] Use priority-based color instead of fixed TASK_MARKER_COLOR in src/lib/render/renderer.ts
- [x] T011 [US4] Add priority label display in SelectionPanel when task tile selected in src/lib/components/hud/SelectionPanel.svelte

**Checkpoint**: Visual feedback complete. Task markers show priority colors:
- Urgent = Red (0xff4444)
- High = Yellow (0xffaa00)
- Normal = Blue (0x4a90d9)
- Low = Gray (0x888888)

---

## Phase 4: Polish & Validation

**Purpose**: Verify all acceptance criteria and edge cases

- [x] T012 Verify edge case: unreachable nearby task skipped for reachable distant task
- [x] T013 Verify edge case: FIFO tiebreaker when priority and distance equal
- [x] T014 Verify edge case: gnome continues to assigned task when priority changes
- [x] T015 Verify performance: no FPS regression during task assignment
- [x] T016 Run pnpm check to verify TypeScript compliance
- [x] T017 Run pnpm build to verify production build works

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──┐
                  ├──→ Phase 2 (Core Algorithm - US1+2) ──→ Phase 4 (Polish)
                  │                                            ↑
                  └──→ Phase 3 (Visual - US4) ─────────────────┘
```

### User Story Dependencies

- **US1+2 (Core Algorithm)**: Requires T001, T002 (colors/labels). No other dependencies.
- **US4 (Visual)**: Requires T001 (colors). Can run in parallel with US1+2 after Phase 1.

### Within Phases

- Phase 1: T001 and T002 are independent [P] - can run in parallel
- Phase 2: T003 → T004 → T005 → T006 → T007 (sequential - same file, algorithm evolution)
- Phase 3: T008 → T009 → T010 (sequential - same file), then T011 (different file)
- Phase 4: All tasks are independent verification steps

### Parallel Opportunities

```bash
# Phase 1 - Both can run in parallel:
Task T001: "Add TASK_PRIORITY_COLORS in src/lib/config/colors.ts"
Task T002: "Add TASK_PRIORITY_LABELS in src/lib/components/task.ts"

# After Phase 1, US1+2 and US4 can run in parallel (different files):
# Team member A: Phase 2 (task-assignment.ts)
# Team member B: Phase 3 (renderer.ts, SelectionPanel.svelte)
```

---

## Implementation Strategy

### MVP First (Phase 1 + Phase 2)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Core Algorithm (T003-T007)
3. **STOP and VALIDATE**: Test priority + distance selection
4. Deploy/demo: Gnomes now work more efficiently!

### Full Feature

1. Complete MVP (above)
2. Complete Phase 3: Visual Indicators (T008-T011)
3. Complete Phase 4: Polish (T012-T017)
4. Full feature ready for merge to main

### Suggested Order (Single Developer)

T001 → T002 → T003 → T004 → T005 → T006 → T007 → [Validate MVP] → T008 → T009 → T010 → T011 → T012-T017

---

## Notes

- US3 (Priority Tool UI) is DEFERRED to future iteration
- All tasks modify existing files - no new files created
- Priority enum and Task component already exist - no changes needed
- Existing throttling (TASK_ASSIGNMENT_THROTTLE_TICKS) must be preserved
- Manual testing via gameplay - no automated tests specified
