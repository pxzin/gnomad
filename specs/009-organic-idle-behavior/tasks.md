# Tasks: Organic Idle Behavior for Gnomes

**Input**: Design documents from `/specs/009-organic-idle-behavior/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested for this feature. Manual testing via gameplay.

**Organization**: Tasks grouped by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)

## Path Conventions

Single project structure: `src/lib/` at repository root

---

## Phase 1: Setup (Configuration & Types)

**Purpose**: Add configuration constants and type definitions needed by all user stories

- [x] T001 [P] Add GNOME_IDLE_SPEED constant in src/lib/config/physics.ts
- [x] T002 [P] Add idle behavior throttle constants in src/lib/config/performance.ts
- [x] T003 [P] Create idle behavior configuration file src/lib/config/idle-behavior.ts with weights and durations
- [x] T004 [P] Add IdleBehavior interface and types in src/lib/components/gnome.ts
- [x] T005 Add idleBehavior optional field to Gnome interface in src/lib/components/gnome.ts

**Checkpoint**: Types and configuration available for all user stories

---

## Phase 2: Foundational (Core System Infrastructure)

**Purpose**: Create idle behavior system shell and game loop integration

- [x] T006 Create idle behavior system skeleton in src/lib/systems/idle-behavior.ts with findColonyCenter helper
- [x] T007 Add seeded PRNG utility function for deterministic behavior selection in src/lib/systems/idle-behavior.ts
- [x] T008 Add idleBehaviorSystem to game loop in src/lib/components/Game.svelte (after task-assignment)

**Checkpoint**: System infrastructure ready - user story implementation can begin

---

## Phase 3: User Story 1+2 - Casual Stroll + Work Interruption (Priority: P1) 🎯 MVP

**Goal**: Gnomes take casual strolls near Storage when idle, and immediately stop for work tasks

**Why Combined**: US1 (strolling) and US2 (work interruption) are tightly coupled - strolling is meaningless without interruption, and interruption needs an active behavior to interrupt.

**Independent Test**:
1. Spawn gnomes with no tasks → observe them walking slowly near Storage
2. Create a dig task → gnome immediately abandons stroll and goes to work

### Implementation

- [x] T009 [US1+2] Implement selectRandomStrollDestination() with radius limits in src/lib/systems/idle-behavior.ts
- [x] T010 [US1+2] Implement assignStrollBehavior() that sets path and idleBehavior in src/lib/systems/idle-behavior.ts
- [x] T011 [US1+2] Implement updateStrollBehavior() to handle destination reached in src/lib/systems/idle-behavior.ts
- [x] T012 [US1+2] Apply GNOME_IDLE_SPEED for strolling gnomes in src/lib/systems/physics.ts
- [x] T013 [US1+2] Clear idleBehavior when task assigned in src/lib/systems/task-assignment.ts
- [x] T014 [US1+2] Wire stroll behavior into main idleBehaviorSystem function in src/lib/systems/idle-behavior.ts

**Checkpoint**: MVP complete. Gnomes now stroll when idle and immediately respond to tasks. Manually test:
- Idle gnome walks slowly around Storage area
- Creating dig task interrupts stroll immediately
- Gnome doesn't walk into walls or unreachable areas

---

## Phase 4: User Story 3 - Gnome Socialization (Priority: P2)

**Goal**: Nearby idle gnomes can engage in brief conversations with visual indicator

**Independent Test**: Have 2+ idle gnomes near each other → observe them pair up and show "..." indicator

### Implementation

- [x] T015 [US3] Implement findNearbyIdleGnome() for partner detection in src/lib/systems/idle-behavior.ts
- [x] T016 [US3] Implement assignSocializeBehavior() that pairs two gnomes in src/lib/systems/idle-behavior.ts
- [x] T017 [US3] Implement updateSocializeBehavior() to handle duration end in src/lib/systems/idle-behavior.ts
- [x] T018 [US3] Add renderSocializationIndicators() for "..." ellipsis in src/lib/render/renderer.ts
- [x] T019 [US3] Call indicator render after renderGnomes() when gnome is socializing in src/lib/render/renderer.ts
- [x] T020 [US3] Wire socialize behavior into idleBehaviorSystem with weighted selection in src/lib/systems/idle-behavior.ts

**Checkpoint**: Socialization complete. Manually test:
- Two nearby idle gnomes sometimes start chatting
- "..." appears above both gnomes while socializing
- Only 2 gnomes pair up (not 3+)
- Task interrupts socialization immediately

---

## Phase 5: User Story 4 - Rest and Nap (Priority: P3)

**Goal**: Idle gnomes can rest in place as a third behavior option

**Independent Test**: Observe idle gnomes occasionally staying stationary (resting) instead of walking

### Implementation

- [x] T021 [US4] Implement assignRestBehavior() with random duration in src/lib/systems/idle-behavior.ts
- [x] T022 [US4] Implement updateRestBehavior() to handle duration end in src/lib/systems/idle-behavior.ts
- [x] T023 [US4] Wire rest behavior into idleBehaviorSystem with weighted selection in src/lib/systems/idle-behavior.ts

**Checkpoint**: All behaviors complete. Manually test:
- Gnomes show all 3 behaviors (stroll, socialize, rest)
- Rest is least common (~15%)
- Task interrupts rest immediately

---

## Phase 6: Polish & Validation

**Purpose**: Verify all acceptance criteria and edge cases

- [x] T024 Verify edge case: gnome doesn't stroll into walls or unreachable tiles
- [x] T025 Verify edge case: behavior varies (not all gnomes doing same thing)
- [x] T026 Verify edge case: fallback when no Storage exists (gnome stays in place)
- [x] T027 Verify performance: 60 FPS maintained with 10+ idle gnomes
- [x] T028 Run pnpm check to verify TypeScript compliance
- [x] T029 Run pnpm build to verify production build works

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Setup) ──┐
                  ├──→ Phase 2 (Foundational) ──→ Phase 3 (US1+2 MVP)
                  │                                    │
                  └────────────────────────────────────┤
                                                       ▼
                                      Phase 4 (US3 Socialize)
                                                       │
                                                       ▼
                                      Phase 5 (US4 Rest)
                                                       │
                                                       ▼
                                      Phase 6 (Polish)
```

### User Story Dependencies

- **US1+2 (Stroll + Interruption)**: Requires Phase 1 + 2 complete. No dependencies on US3/US4.
- **US3 (Socialization)**: Requires Phase 3 complete (needs behavior system working). Adds new behavior type.
- **US4 (Rest)**: Requires Phase 3 complete. Adds new behavior type.

### Within Phases

- Phase 1: All tasks [P] - can run in parallel (different files)
- Phase 2: T006 → T007 → T008 (sequential in same file, then loop integration)
- Phase 3: T009 → T010 → T011 → T012 → T013 → T014 (algorithm evolution)
- Phase 4: T015 → T016 → T017 → T018 → T019 → T020 (detection → behavior → render)
- Phase 5: T021 → T022 → T023 (simple additions)
- Phase 6: All tasks are independent verification steps

### Parallel Opportunities

```bash
# Phase 1 - All can run in parallel:
Task T001: "Add GNOME_IDLE_SPEED in physics.ts"
Task T002: "Add throttle constants in performance.ts"
Task T003: "Create idle-behavior.ts config"
Task T004: "Add IdleBehavior types in gnome.ts"
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T008)
3. Complete Phase 3: US1+2 Stroll + Interruption (T009-T014)
4. **STOP and VALIDATE**: Test strolling and task interruption
5. Deploy/demo: Gnomes now look alive when idle!

### Full Feature

1. Complete MVP (above)
2. Complete Phase 4: US3 Socialization (T015-T020)
3. Complete Phase 5: US4 Rest (T021-T023)
4. Complete Phase 6: Polish (T024-T029)
5. Full feature ready for merge

### Suggested Order (Single Developer)

T001-T005 (parallel) → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → [Validate MVP] → T015 → T016 → T017 → T018 → T019 → T020 → T021 → T022 → T023 → T024-T029

---

## Notes

- US1 and US2 are combined because they're both P1 and tightly coupled
- No automated tests specified - manual testing via gameplay
- Determinism ensured via seeded PRNG using game seed + entity + tick
- Performance maintained via existing throttling pattern (10 ticks)
- All changes to existing files are minimal (adding fields, clearing state)
