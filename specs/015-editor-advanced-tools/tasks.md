# Tasks: Editor Advanced Tools

**Input**: Design documents from `/specs/015-editor-advanced-tools/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type definitions

- [X] T001 Add Layer, Timeline, OnionSkinSettings interfaces to `src/lib/editor/types.ts`
- [X] T002 [P] Add PixelArtAssetV2 interface and migration types to `src/lib/editor/types.ts`
- [X] T003 [P] Add default constants (DEFAULT_TIMELINE, DEFAULT_ONION_SKIN) to `src/lib/editor/types.ts`
- [X] T004 Create clipboard module directory `src/lib/editor/clipboard/`
- [X] T005 [P] Create animation module directory `src/lib/editor/animation/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**WARNING**: No user story work can begin until this phase is complete

- [X] T006 Extend EditorState interface with activeLayerId, currentFrame, timeline, onionSkin in `src/lib/editor/types.ts`
- [X] T007 Update DEFAULT_EDITOR_STATE with new fields in `src/lib/editor/types.ts`
- [X] T008 Implement v1 to v2 asset migration function in `src/lib/editor/io/json.js`
- [X] T009 Update loadAssetFromJSON to auto-migrate v1 assets in `src/lib/editor/io/json.ts`
- [X] T010 Update saveAssetToJSON to always use v2 format in `src/lib/editor/io/json.ts`
- [X] T011 Create layer compositing utility in `src/lib/editor/canvas/composite.ts`
- [X] T012 Update render functions to use layer compositing in `src/lib/editor/canvas/render.ts`

**Checkpoint**: Foundation ready - layered rendering and v2 format working, user story implementation can begin

---

## Phase 3: User Story 1 - Paste External Images (Priority: P1) MVP

**Goal**: Users can paste images from clipboard into the editor at position (0,0), creating a new layer

**Independent Test**: Copy any image, press Ctrl/Cmd+V in editor, verify pixels appear on canvas with correct colors and transparency

### Implementation for User Story 1

- [X] T013 [US1] Create clipboard image reading function in `src/lib/editor/clipboard/paste.ts`
- [X] T014 [US1] Implement image-to-pixels conversion (crop, transparency) in `src/lib/editor/clipboard/paste.ts`
- [X] T015 [US1] Implement color extraction for palette update in `src/lib/editor/clipboard/paste.ts`
- [X] T016 [US1] Add pasteFromClipboard store operation in `src/lib/editor/state/editor.svelte.ts`
- [X] T017 [US1] Add keyboard handler for Ctrl/Cmd+V in `src/lib/editor/utils/keyboard.ts`
- [X] T018 [US1] Verify paste creates new layer with pasted pixels
- [X] T019 [US1] Handle edge cases: non-image data, oversized images, many colors

**Checkpoint**: Paste functionality complete - users can import external images via clipboard

---

## Phase 4: User Story 2 - Multiple Layers (Priority: P2)

**Goal**: Users can create, manage, and edit multiple layers with visibility, opacity, and ordering controls

**Independent Test**: Create multiple layers, draw on each, toggle visibility, reorder, verify composite output, save/load preserves structure

### Implementation for User Story 2

- [X] T020 [US2] Add layer CRUD operations (create, delete, select) to `src/lib/editor/state/editor.svelte.ts`
- [X] T021 [US2] Add layer property operations (rename, visibility, opacity) to `src/lib/editor/state/editor.svelte.ts`
- [X] T022 [US2] Add layer reorder and merge operations to `src/lib/editor/state/editor.svelte.ts`
- [X] T023 [US2] Add flattenAllLayers operation to `src/lib/editor/state/editor.svelte.ts`
- [X] T024 [US2] Update drawing operations to target active layer only in `src/lib/editor/canvas/drawing.ts`
- [X] T025 [P] [US2] Create LayerPanel.svelte component in `src/lib/editor/components/LayerPanel.svelte`
- [X] T026 [US2] Implement layer list with selection, visibility toggle, opacity slider in LayerPanel
- [X] T027 [US2] Implement drag-to-reorder layers in LayerPanel
- [X] T028 [US2] Implement layer rename (double-click) in LayerPanel
- [X] T029 [US2] Add "New Layer", "Delete", "Merge Down", "Flatten" buttons to LayerPanel
- [X] T030 [US2] Integrate LayerPanel into main editor layout in `src/routes/editor/+page.svelte`
- [X] T031 [US2] Update PNG export to flatten visible layers in `src/lib/editor/io/png.ts`
- [X] T032 [US2] Add layer count warning (>32 layers) in `src/lib/editor/state/editor.svelte.ts`
- [X] T033 [US2] Handle edge case: prevent deleting last layer

**Checkpoint**: Layer system complete - full layer management with UI and persistence

---

## Phase 5: User Story 3 - Animation Timeline (Priority: P3)

**Goal**: Users can manage animation frames with timeline UI, preview playback, and frame editing

**Independent Test**: Add frames, navigate between them, play preview at different FPS, verify exported sprite sheet contains all frames in order

### Implementation for User Story 3

- [X] T034 [US3] Add frame operations (add, delete, duplicate, reorder) to `src/lib/editor/state/editor.svelte.ts`
- [X] T035 [US3] Add frame navigation (selectFrame, currentFrame) to `src/lib/editor/state/editor.svelte.ts`
- [X] T036 [US3] Add animation toggle (enableAnimation on any asset) to `src/lib/editor/state/editor.svelte.ts`
- [X] T037 [US3] Create animation playback controller in `src/lib/editor/animation/playback.ts`
- [X] T038 [US3] Implement requestAnimationFrame-based preview loop in `src/lib/editor/animation/playback.ts`
- [X] T039 [P] [US3] Create Timeline.svelte component in `src/lib/editor/components/Timeline.svelte`
- [X] T040 [US3] Implement frame thumbnail strip in Timeline
- [X] T041 [US3] Implement play/pause/stop controls in Timeline
- [X] T042 [US3] Implement FPS slider in Timeline
- [X] T043 [US3] Implement frame add/delete/duplicate buttons in Timeline
- [X] T044 [US3] Implement drag-to-reorder frames in Timeline
- [X] T045 [US3] Integrate Timeline into main editor layout in `src/routes/editor/+page.svelte`
- [X] T046 [US3] Update canvas to show current frame based on timeline selection
- [X] T047 [US3] Handle edge case: prevent deleting last frame

**Checkpoint**: Animation timeline complete - full frame management with preview playback

---

## Phase 6: User Story 4 - Onion Skinning (Priority: P4)

**Goal**: Users can see previous/next frames as semi-transparent overlays while editing animations

**Independent Test**: Enable onion skinning on 3+ frame animation, navigate frames, verify adjacent frames appear as colored overlays with adjustable opacity

### Implementation for User Story 4

- [X] T048 [US4] Add onion skin toggle and settings to `src/lib/editor/state/editor.svelte.ts`
- [X] T049 [US4] Create onion skin renderer in `src/lib/editor/animation/onion-skin.ts`
- [X] T050 [US4] Implement previous frame overlay with red tint in `src/lib/editor/animation/onion-skin.ts`
- [X] T051 [US4] Implement next frame overlay with green tint in `src/lib/editor/animation/onion-skin.ts`
- [X] T052 [US4] Integrate onion skin rendering into canvas render pipeline in `src/lib/editor/canvas/render.ts`
- [X] T053 [US4] Add onion skin toggle button to Timeline.svelte
- [X] T054 [US4] Add onion skin opacity controls (previous/next) to Timeline.svelte

**Checkpoint**: Onion skinning complete - animators can see adjacent frames while editing

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, validation, and cleanup

- [X] T055 [P] Update validation.ts to validate v2 format with layers in `src/lib/editor/utils/validation.ts`
- [X] T056 [P] Update presets to create assets with single default layer in `src/lib/editor/io/presets.ts`
- [X] T057 Run quickstart.md validation checklist for all user stories
- [X] T058 Performance validation: verify <100ms layer operations, 30 FPS animation preview
- [X] T059 Test backward compatibility: load v1 assets, verify auto-migration

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP, can start immediately after Phase 2
- **User Story 2 (Phase 4)**: Depends on Foundational - can run parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational - can run parallel with US1/US2
- **User Story 4 (Phase 6)**: Depends on US3 (needs frames for onion skin to work)
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - fully independent paste feature
- **User Story 2 (P2)**: No dependencies on other stories - layers work without paste
- **User Story 3 (P3)**: No dependencies on other stories - animation works without layers (single implicit layer)
- **User Story 4 (P4)**: Depends on US3 - onion skinning requires animation frames to exist

### Within Each User Story

- State/store changes before UI components
- Core implementation before edge cases
- Integration with editor layout after component creation

### Parallel Opportunities

**Setup Phase**:
- T002 and T003 can run in parallel
- T004 and T005 can run in parallel

**User Story 2**:
- T025 (LayerPanel) can run parallel with T020-T024 (store operations)

**User Story 3**:
- T039 (Timeline) can run parallel with T034-T038 (store/playback)

**Polish Phase**:
- T055 and T056 can run in parallel

---

## Parallel Example: User Story 2 (Layers)

```bash
# Launch store operations and UI component in parallel:
Task: "T020-T024 Store operations in editor.svelte.ts"
Task: "T025 Create LayerPanel.svelte component"

# Then integrate:
Task: "T026-T029 LayerPanel features"
Task: "T030 Integrate into editor layout"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types)
2. Complete Phase 2: Foundational (v2 format, compositing)
3. Complete Phase 3: User Story 1 (paste)
4. **STOP and VALIDATE**: Test paste functionality independently
5. Deploy/demo paste feature

### Incremental Delivery

1. Setup + Foundational → v2 format and layer compositing ready
2. Add User Story 1 → Paste feature works (MVP!)
3. Add User Story 2 → Full layer management
4. Add User Story 3 → Animation timeline with preview
5. Add User Story 4 → Onion skinning for animators
6. Polish → Validation and cleanup

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US4 depends on US3 (onion skin needs frames)
- All other user stories are independent
- Commit after each task or logical group
- Validate per quickstart.md checklist after each story
