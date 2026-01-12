# Tasks: Visual Style & Resolution

**Input**: Design documents from `/specs/014-visual-style/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and rendering configuration

- [ ] T001 Create `src/lib/config/rendering.ts` with TILE_SIZE (32), SPRITE_WIDTH (32), SPRITE_HEIGHT (48), BACKGROUND_DIM_FACTOR (0.6), ZOOM_LEVELS, DEFAULT_ZOOM constants
- [ ] T002 [P] Create directory structure: `static/assets/tiles/terrain/`, `static/assets/tiles/backgrounds/`, `static/assets/sprites/gnome/`, `static/assets/ui/`
- [ ] T003 [P] Update PixiJS texture loading to use `scaleMode = 'nearest'` for pixel-perfect rendering in existing render initialization code

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core rendering changes that MUST be complete before ANY visual asset work can begin

**WARNING**: No user story work can begin until this phase is complete

- [ ] T004 Update all hardcoded tile size references (16) to use `TILE_SIZE` constant from `src/lib/config/rendering.ts`
- [ ] T005 Update camera/viewport calculations in `src/lib/render/` to account for new 32x32 tile size
- [ ] T006 [P] Update sprite frame rectangle calculations to use SPRITE_WIDTH and SPRITE_HEIGHT from config
- [ ] T007 [P] Implement background dimming function in `src/lib/render/` using BACKGROUND_DIM_FACTOR (apply tint 0x999999 to background tiles)
- [ ] T008 Update gnome sprite rendering to use new 32x48 dimensions from config

**Checkpoint**: Foundation ready - rendering supports 32x32 tiles and 32x48 sprites with background dimming

---

## Phase 3: User Story 1 - Art Direction Decision (Priority: P1) MVP

**Goal**: Finalize visual style and resolution with documented decision and proof-of-concept assets

**Independent Test**: Create sample dirt tile and gnome frame at 32x32/32x48, verify they render correctly in-game with proper scaling and background dimming

### Implementation for User Story 1

- [ ] T009 [US1] Create proof-of-concept dirt tile (32x32) with 1px dark outline in `static/assets/tiles/terrain/tile-dirt-surface.png`
- [ ] T010 [P] [US1] Create proof-of-concept stone tile (32x32) with 1px dark outline in `static/assets/tiles/terrain/tile-stone-light.png`
- [ ] T011 [P] [US1] Create proof-of-concept gnome idle frame (32x48) with 1px dark outline in `static/assets/sprites/gnome/` (single frame for validation)
- [ ] T012 [US1] Validate proof-of-concept assets render correctly at 1x, 2x zoom levels (pixel-perfect, no blur)
- [ ] T013 [US1] Document resolution decision with rationale in `specs/014-visual-style/decision-log.md` (32x32 tiles, 32x48 sprites per research.md findings)

**Checkpoint**: Art direction validated with working proof-of-concept assets

---

## Phase 4: User Story 2 - Background/Foreground Distinction (Priority: P1)

**Goal**: Players can clearly distinguish solid foreground blocks from passable background blocks

**Independent Test**: Place foreground and background dirt tiles side-by-side, verify background appears 40% dimmer and visually "behind"

### Implementation for User Story 2

- [ ] T014 [US2] Create background variant of dirt tile (32x32) for `static/assets/tiles/backgrounds/` using same source with dimming applied at render
- [ ] T015 [P] [US2] Create background variant of stone tile (32x32) for `static/assets/tiles/backgrounds/`
- [ ] T016 [US2] Verify background dimming renders correctly in-game (foreground at full brightness, background at 60%)
- [ ] T017 [US2] Create cave ambient background texture (32x32) for deep underground in `static/assets/tiles/backgrounds/bg-cave-ambient.png`
- [ ] T018 [US2] Validate foreground/background distinction is clear at different depth levels (surface, mid, deep cave)

**Checkpoint**: Foreground/background visual distinction complete and validated

---

## Phase 5: User Story 3 - Gnome Readability (Priority: P2)

**Goal**: Gnome sprites are clearly visible and their state is recognizable at a glance

**Independent Test**: Display gnome in each state, verify state is identifiable within 1 second against both foreground and background tiles

### Implementation for User Story 3

- [ ] T019 [US3] Create gnome sprite sheet layout (320x480 px, 10 cols x 10 rows) in `static/assets/sprites/gnome/sprite-gnome-sheet.png`
- [ ] T020 [US3] Create Idle animation frames (4 frames left, 4 frames right) - row 0-1 of sprite sheet
- [ ] T021 [US3] Create Walking animation frames (6 frames left, 6 frames right) - row 2-3 of sprite sheet
- [ ] T022 [US3] Create Mining animation frames (6 frames left, 6 frames right) - row 4-5 of sprite sheet
- [ ] T023 [US3] Create Climbing animation frames (4 frames) - row 6 of sprite sheet
- [ ] T024 [US3] Create Falling animation frames (2 frames) - row 7 of sprite sheet
- [ ] T025 [US3] Create Incapacitated frame (1 frame left, 1 frame right) - row 8-9 of sprite sheet
- [ ] T026 [US3] Update gnome sprite loading code in `src/lib/render/` to parse new sprite sheet dimensions (32x48 per frame, 10 frames per row)
- [ ] T027 [US3] Validate gnome visibility against foreground tiles, background tiles, and sky

**Checkpoint**: Gnome sprite sheet complete with all states visually distinguishable

---

## Phase 6: User Story 4 - Style Guide Creation (Priority: P3)

**Goal**: Documented style guide enabling consistent asset creation by any artist

**Independent Test**: Give style guide to someone unfamiliar with project, verify they can create a matching tile

### Implementation for User Story 4

- [ ] T028 [US4] Create comprehensive style guide document in `docs/style-guide.md` covering:
  - Resolution specifications (32x32 tiles, 32x48 sprites)
  - Outline requirements (1px dark: #000000, #3D2817, or #2A2A2A)
  - Color guidelines (unrestricted palette, top-left lighting)
  - Animation requirements (frame counts, timing)
  - File format contract (32-bit PNG, RGBA, sRGB)
  - Naming conventions (type-name-variant.png)
- [ ] T029 [P] [US4] Create asset compliance checklist as appendix to style guide
- [ ] T030 [P] [US4] Add example assets section with annotated reference images

**Checkpoint**: Style guide complete and usable by external artists

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Complete tileset and final validation

- [ ] T031 [P] Create remaining terrain tiles (32x32 each):
  - `tile-grass-standard.png`
  - `tile-sand-standard.png`
  - `tile-stone-dark.png`
  - `tile-stone-ore.png`
- [ ] T032 [P] Create sky gradient tiles/texture in `static/assets/tiles/backgrounds/bg-sky-gradient.png`
- [ ] T033 [P] Create water tiles (surface and deep variants) in `static/assets/tiles/terrain/`
- [ ] T034 Update any remaining hardcoded pixel values to use rendering.ts constants
- [ ] T035 Run full visual validation per quickstart.md checklist (all tiles 32x32, gnomes 32x48, no blur at zoom levels, background dimming working)
- [ ] T036 Performance validation: verify 60 FPS rendering with new 32x32 assets

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP proof of concept
- **User Story 2 (Phase 4)**: Depends on Foundational - can run parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational - can run parallel with US1/US2
- **User Story 4 (Phase 6)**: Depends on US1-US3 completion (needs finalized decisions)
- **Polish (Phase 7)**: Depends on US1-US4 completion

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - establishes core decisions
- **User Story 2 (P1)**: No dependencies on other stories - foreground/background specific
- **User Story 3 (P2)**: No dependencies on other stories - gnome sprites specific
- **User Story 4 (P3)**: Should follow US1-US3 to document finalized decisions

### Within Each User Story

- Config changes before asset creation
- Proof-of-concept before full implementation
- Validation after each asset group
- Documentation after implementation

### Parallel Opportunities

**Setup Phase**:
- T002 and T003 can run in parallel

**Foundational Phase**:
- T006 and T007 can run in parallel

**User Story 1**:
- T010 and T011 can run in parallel (different asset files)

**User Story 2**:
- T014 and T015 can run in parallel (different tile types)

**User Story 4**:
- T028, T029, T030 can run in parallel (different doc sections)

**Polish Phase**:
- T031, T032, T033 can run in parallel (independent asset files)

---

## Parallel Example: User Story 3 (Gnome Sprites)

```bash
# These tasks create different rows of the sprite sheet and can run in parallel:
Task: "T020 Create Idle animation frames (rows 0-1)"
Task: "T021 Create Walking animation frames (rows 2-3)"
Task: "T022 Create Mining animation frames (rows 4-5)"
Task: "T023 Create Climbing animation frames (row 6)"
Task: "T024 Create Falling animation frames (row 7)"
Task: "T025 Create Incapacitated frames (rows 8-9)"

# Then combine into final sprite sheet before:
Task: "T026 Update sprite loading code"
```

---

## Implementation Strategy

### MVP First (User Stories 1-2)

1. Complete Phase 1: Setup (rendering constants, directory structure)
2. Complete Phase 2: Foundational (update tile size references, dimming)
3. Complete Phase 3: User Story 1 (proof-of-concept assets)
4. **STOP and VALIDATE**: Verify 32x32 tiles render correctly
5. Complete Phase 4: User Story 2 (background/foreground distinction)
6. **VALIDATE**: Players can distinguish foreground from background

### Incremental Delivery

1. Setup + Foundational → Rendering ready for new assets
2. User Story 1 → Art direction proven with sample assets
3. User Story 2 → Core gameplay visual clarity achieved
4. User Story 3 → Gnome sprites complete
5. User Story 4 → Style guide enables future asset creation
6. Polish → Complete tileset and final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All assets MUST follow contracts/README.md specifications
- Use pixel art editor (Aseprite, Piskel) for asset creation
- Validate pixel-perfect rendering after each asset group
- Commit after each task or logical group
