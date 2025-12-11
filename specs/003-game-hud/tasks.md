# Tasks: Game HUD/UI

**Input**: Design documents from `/specs/003-game-hud/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No tests requested in feature specification. Manual testing checklist provided in quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Based on plan.md: `src/lib/components/hud/` for new HUD components

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create HUD directory structure and shared types

- [ ] T001 Create HUD component directory at src/lib/components/hud/
- [ ] T002 [P] Create HUD TypeScript interfaces in src/lib/components/hud/types.ts (copy from contracts/components.ts)
- [ ] T003 [P] Add selectedGnomes field to GameState interface in src/lib/game/state.ts
- [ ] T004 [P] Initialize selectedGnomes as empty array in createEmptyState() in src/lib/game/state.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core command infrastructure that MUST be complete before ANY user story can be implemented

**Warning**: No user story work can begin until this phase is complete

- [ ] T005 Add SELECT_GNOMES command type to CommandType enum in src/lib/game/commands.ts
- [ ] T006 [P] Add CLEAR_SELECTION command type to CommandType enum in src/lib/game/commands.ts
- [ ] T007 [P] Add CANCEL_DIG command type to CommandType enum in src/lib/game/commands.ts
- [ ] T008 [P] Implement selectGnomes() command factory function in src/lib/game/commands.ts
- [ ] T009 [P] Implement clearSelection() command factory function in src/lib/game/commands.ts
- [ ] T010 [P] Implement cancelDig() command factory function in src/lib/game/commands.ts
- [ ] T011 Add SELECT_GNOMES command processor in src/lib/game/command-processor.ts
- [ ] T012 [P] Add CLEAR_SELECTION command processor in src/lib/game/command-processor.ts
- [ ] T013 [P] Add CANCEL_DIG command processor in src/lib/game/command-processor.ts
- [ ] T014 Add selectedGnomes to serialize() function in src/lib/game/state.ts
- [ ] T015 Add selectedGnomes to deserialize() function in src/lib/game/state.ts

**Checkpoint**: Foundation ready - commands can be queued and processed, user story implementation can begin

---

## Phase 3: User Story 1 - View Game Status at a Glance (Priority: P1)

**Goal**: Display gnome count, task progress (X/Y), and tick counter in a top bar

**Independent Test**: Start game, verify counters update as gnomes spawn and tasks are created/completed

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create HudOverlay.svelte container with pointer-events pattern in src/lib/components/hud/HudOverlay.svelte
- [ ] T017 [P] [US1] Create TopBar.svelte skeleton with left and right sections in src/lib/components/hud/TopBar.svelte
- [ ] T018 [US1] Implement gnome counter display using $derived(gameLoop.state.gnomes.size) in src/lib/components/hud/TopBar.svelte
- [ ] T019 [US1] Implement task progress display with assigned/total calculation in src/lib/components/hud/TopBar.svelte
- [ ] T020 [US1] Implement tick counter display using $derived(gameLoop.state.tick) in src/lib/components/hud/TopBar.svelte
- [ ] T021 [US1] Add placeholder styling (dark background, white text) to TopBar.svelte in src/lib/components/hud/TopBar.svelte
- [ ] T022 [US1] Integrate HudOverlay into Game.svelte, remove inline tick/gnome/task display in src/lib/components/Game.svelte

**Checkpoint**: Top bar displays gnome count, task progress, tick counter - all reactive to state changes

---

## Phase 4: User Story 2 - Control Game Speed (Priority: P1)

**Goal**: Add pause button and speed buttons (1x/2x/3x) to top bar with keyboard support

**Independent Test**: Click speed buttons and press 1/2/3/Space, observe tick counter speed changes

### Implementation for User Story 2

- [ ] T023 [P] [US2] Add speed control section to TopBar.svelte with pause button in src/lib/components/hud/TopBar.svelte
- [ ] T024 [US2] Implement speed buttons (1x, 2x, 3x) with active state highlight in src/lib/components/hud/TopBar.svelte
- [ ] T025 [US2] Wire pause button to emit togglePause() command in src/lib/components/hud/TopBar.svelte
- [ ] T026 [US2] Wire speed buttons to emit setSpeed() commands in src/lib/components/hud/TopBar.svelte
- [ ] T027 [US2] Display pause indicator when game is paused in src/lib/components/hud/TopBar.svelte
- [ ] T028 [US2] Verify existing keyboard shortcuts (Space, 1, 2, 3) work with HUD visible in src/lib/input/handler.ts

**Checkpoint**: Speed controls work via buttons and keyboard, active speed is highlighted, pause shows indicator

---

## Phase 5: User Story 3 - View Selection Information (Priority: P2)

**Goal**: Display selection info (tile/gnome details or count summary) in bottom-left panel, add gnome click selection

**Independent Test**: Select tiles and gnomes, verify panel shows correct info for each selection type

### Implementation for User Story 3

- [ ] T029 [P] [US3] Create BottomBar.svelte container with left and right sections in src/lib/components/hud/BottomBar.svelte
- [ ] T030 [P] [US3] Create SelectionPanel.svelte component in src/lib/components/hud/SelectionPanel.svelte
- [ ] T031 [US3] Implement computeSelectionInfo() utility in src/lib/components/hud/types.ts
- [ ] T032 [US3] Implement "Nenhuma seleção" display when nothing selected in src/lib/components/hud/SelectionPanel.svelte
- [ ] T033 [US3] Implement single tile info display (type, durability, task status) in src/lib/components/hud/SelectionPanel.svelte
- [ ] T034 [US3] Implement single gnome info display (state, task, position) in src/lib/components/hud/SelectionPanel.svelte
- [ ] T035 [US3] Implement multiple selection count summary display in src/lib/components/hud/SelectionPanel.svelte
- [ ] T036 [US3] Add findGnomeAtTile() helper function in src/lib/input/handler.ts
- [ ] T037 [US3] Modify onMouseDown to check for gnome before tile selection in src/lib/input/handler.ts
- [ ] T038 [US3] Implement Shift+click toggle for gnome selection in src/lib/input/handler.ts
- [ ] T039 [US3] Add air tile filtering to getTilesInRect() function in src/lib/input/handler.ts
- [ ] T040 [US3] Integrate BottomBar into HudOverlay.svelte in src/lib/components/hud/HudOverlay.svelte
- [ ] T041 [US3] Add placeholder styling to SelectionPanel.svelte in src/lib/components/hud/SelectionPanel.svelte

**Checkpoint**: Selection panel shows correct info for: no selection, single tile, single gnome, multiple items. Gnomes can be clicked to select.

---

## Phase 6: User Story 4 - Execute Contextual Actions (Priority: P2)

**Goal**: Display contextual Dig/Cancel Dig button that enables/disables based on selection

**Independent Test**: Select tiles, verify Dig button creates tasks. Select tiles with tasks, verify Cancel Dig removes tasks.

### Implementation for User Story 4

- [ ] T042 [P] [US4] Create ActionBar.svelte component in src/lib/components/hud/ActionBar.svelte
- [ ] T043 [US4] Implement computeActionButtonState() utility in src/lib/components/hud/types.ts
- [ ] T044 [US4] Display Dig button with shortcut label "Dig (D)" in src/lib/components/hud/ActionBar.svelte
- [ ] T045 [US4] Implement enabled/disabled state based on selection in src/lib/components/hud/ActionBar.svelte
- [ ] T046 [US4] Toggle label between "Dig (D)" and "Cancel Dig (D)" based on tile task state in src/lib/components/hud/ActionBar.svelte
- [ ] T047 [US4] Wire button click to emit dig() or cancelDig() command in src/lib/components/hud/ActionBar.svelte
- [ ] T048 [US4] Disable button when gnomes selected or mixed selection in src/lib/components/hud/ActionBar.svelte
- [ ] T049 [US4] Integrate ActionBar into BottomBar.svelte right section in src/lib/components/hud/BottomBar.svelte
- [ ] T050 [US4] Add placeholder styling to ActionBar.svelte in src/lib/components/hud/ActionBar.svelte

**Checkpoint**: Dig button shows correct label, enables/disables correctly, executes appropriate action

---

## Phase 7: User Story 5 - Non-Intrusive HUD Overlay (Priority: P3)

**Goal**: Ensure HUD doesn't block game interactions and repositions on window resize

**Independent Test**: Click/drag on game area near HUD elements, verify game interactions work

### Implementation for User Story 5

- [ ] T051 [US5] Verify pointer-events: none on HudOverlay container in src/lib/components/hud/HudOverlay.svelte
- [ ] T052 [US5] Verify pointer-events: auto on interactive HUD elements in src/lib/components/hud/TopBar.svelte
- [ ] T053 [US5] Verify pointer-events: auto on interactive HUD elements in src/lib/components/hud/ActionBar.svelte
- [ ] T054 [US5] Test click-through on game canvas near HUD edges in src/lib/components/Game.svelte
- [ ] T055 [US5] Ensure HUD uses fixed positioning for proper overlay behavior in src/lib/components/hud/HudOverlay.svelte
- [ ] T056 [US5] Test window resize behavior - HUD stays in corners in src/lib/components/hud/HudOverlay.svelte

**Checkpoint**: HUD doesn't block game clicks, repositions correctly on resize

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and validation across all user stories

- [ ] T057 Remove old inline HUD code from Game.svelte in src/lib/components/Game.svelte
- [ ] T058 Clean up dead gnomes from selectedGnomes when gnome dies in src/lib/game/command-processor.ts or systems
- [ ] T059 Clean up destroyed tiles from selectedTiles when tile becomes air in src/lib/systems/mining.ts
- [ ] T060 Run pnpm check to verify TypeScript types pass
- [ ] T061 Run pnpm lint and fix any linting errors
- [ ] T062 Manual testing using checklist from quickstart.md
- [ ] T063 Verify all keyboard shortcuts work (D, Space, 1, 2, 3, Escape)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories 1 & 2 (P1)**: Both depend on Foundational, can run in parallel
- **User Stories 3 & 4 (P2)**: Depend on Foundational, can run in parallel
- **User Story 5 (P3)**: Depends on Foundational, minimal implementation needed
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundational → HudOverlay + TopBar basics
- **User Story 2 (P1)**: Foundational → TopBar speed controls (can parallel with US1)
- **User Story 3 (P2)**: Foundational → BottomBar + SelectionPanel + gnome selection logic
- **User Story 4 (P2)**: Foundational + US3 (needs BottomBar) → ActionBar (can mostly parallel with US3)
- **User Story 5 (P3)**: Foundational → CSS verification (can parallel with any)

### Within Each User Story

- Container components before child components
- Utility functions before components that use them
- Core display before styling
- Integration into parent last

### Parallel Opportunities

- T002, T003, T004 can run in parallel (different files)
- T006, T007, T008, T009, T010 can run in parallel (command definitions)
- T012, T013 can run in parallel (command processors)
- T016, T017 can run in parallel (container components)
- T023 can run in parallel with T018-T022 (different section of TopBar)
- T029, T030, T042 can run in parallel (different components)
- US1 and US2 can be developed in parallel (both P1, TopBar sections)
- US3 and US4 can be developed mostly in parallel (BottomBar sections)
- US5 can be developed in parallel with any other story

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch command type additions together:
Task: "Add SELECT_GNOMES command type in src/lib/game/commands.ts"
Task: "Add CLEAR_SELECTION command type in src/lib/game/commands.ts"
Task: "Add CANCEL_DIG command type in src/lib/game/commands.ts"

# Then launch factory functions together:
Task: "Implement selectGnomes() in src/lib/game/commands.ts"
Task: "Implement clearSelection() in src/lib/game/commands.ts"
Task: "Implement cancelDig() in src/lib/game/commands.ts"

# Then launch command processors together:
Task: "Add SELECT_GNOMES processor in src/lib/game/command-processor.ts"
Task: "Add CLEAR_SELECTION processor in src/lib/game/command-processor.ts"
Task: "Add CANCEL_DIG processor in src/lib/game/command-processor.ts"
```

## Parallel Example: User Stories 1 & 2

```bash
# US1 and US2 can be developed in parallel since they work on different TopBar sections:

# Developer A (US1 - Status Display):
Task: "Create HudOverlay.svelte in src/lib/components/hud/HudOverlay.svelte"
Task: "Implement gnome counter in src/lib/components/hud/TopBar.svelte"
Task: "Implement task progress in src/lib/components/hud/TopBar.svelte"

# Developer B (US2 - Speed Controls):
Task: "Add speed control section in src/lib/components/hud/TopBar.svelte"
Task: "Wire speed buttons to commands in src/lib/components/hud/TopBar.svelte"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (status display)
4. Complete Phase 4: User Story 2 (speed controls)
5. **STOP and VALIDATE**: Top bar fully functional with counters and speed control
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Status visible → Demo (counters work!)
3. Add User Story 2 → Speed controls → Demo (pause/speed works!)
4. Add User Story 3 → Selection info → Demo (selection panel works!)
5. Add User Story 4 → Action buttons → Demo (Dig button works!)
6. Add User Story 5 → Polish overlay → Demo (click-through verified!)
7. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after completion
- No automated tests included (not requested in spec)
- Manual testing checklist in quickstart.md should be used for validation
- Svelte 5 runes syntax must be used ($state, $derived, $props)
- All HUD elements need pointer-events: auto for interactivity
