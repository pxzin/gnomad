# Tasks: Pixel Art Editor

**Input**: Design documents from `/specs/002-pixel-art-editor/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in specification. Tests omitted from task list.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Editor code in `src/lib/editor/`
- Route in `src/routes/editor/`
- Assets in `src/lib/assets/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and directory structure

- [ ] T001 Install browser-fs-access dependency with `pnpm add browser-fs-access`
- [ ] T002 [P] Create editor directory structure: `src/lib/editor/{components,state,tools,io}`
- [ ] T003 [P] Create assets directory structure: `src/lib/assets/{source,sprites/{tiles,gnomes,structures,ui,resources,vegetation}}`
- [ ] T004 [P] Create editor route directory: `src/routes/editor/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Define TypeScript types in `src/lib/editor/types.ts` (PixelArtAsset, Pixel, AnimationMetadata, AssetPreset, AssetCategory, PresetConfig, EditorState, EditorTool, Tool, ToolContext, RGBAColor)
- [ ] T006 Implement color utilities in `src/lib/editor/utils/color.ts` (parseHexColor, formatHexColor, colorsEqual, isValidHexColor, extractPalette)
- [ ] T007 Implement coordinate utilities in `src/lib/editor/utils/coordinates.ts` (eventToPixel, isInBounds, clampToBounds)
- [ ] T008 [P] Implement validation utilities in `src/lib/editor/utils/validation.ts` (validateAsset, validateAssetDetailed, isValidPixel)
- [ ] T009 Implement editor state store using Svelte 5 runes in `src/lib/editor/state/editor.svelte.ts` (createEditorStore with reactive state, tool/color/zoom/grid methods)
- [ ] T010 Define preset configurations in `src/lib/editor/io/presets.ts` (PRESET_CONFIGS array, getPresets, getPresetsByCategory, getPreset, createAssetFromPreset, createCustomAsset)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create New Asset from Preset (Priority: P1) 🎯 MVP

**Goal**: Developer can create a new pixel art asset from a preset and draw pixels on canvas with pencil tool

**Independent Test**: Navigate to /editor, select a preset, click on canvas pixels, and visually confirm pixels are drawn with no gaps during drag

### Implementation for User Story 1

- [ ] T011 [P] [US1] Implement canvas pixel operations in `src/lib/editor/canvas/operations.ts` (setPixel, clearPixel, getPixel, setPixels)
- [ ] T012 [P] [US1] Implement Bresenham line drawing in `src/lib/editor/canvas/drawing.ts` (drawLine, bresenhamLine algorithm)
- [ ] T013 [P] [US1] Implement canvas rendering functions in `src/lib/editor/canvas/render.ts` (renderAssetToCanvas, renderAssetZoomed, renderTransparencyPattern, renderGrid)
- [ ] T014 [US1] Implement pencil tool in `src/lib/editor/tools/pencil.ts` (onMouseDown, onMouseMove, onMouseUp with line interpolation)
- [ ] T015 [US1] Implement tool types and base interface in `src/lib/editor/tools/types.ts` (Tool interface, tool registration)
- [ ] T016 [US1] Create Canvas component in `src/lib/editor/components/Canvas.svelte` (canvas element, zoom display, grid overlay, mouse event handlers)
- [ ] T017 [US1] Create PresetSelector component in `src/lib/editor/components/PresetSelector.svelte` (preset dropdown grouped by category, new asset action)
- [ ] T018 [US1] Create ColorPicker component in `src/lib/editor/components/ColorPicker.svelte` (color input, current/secondary color display, swap colors)
- [ ] T019 [US1] Create ToolPalette component in `src/lib/editor/components/ToolPalette.svelte` (tool buttons with active state, pencil tool only for MVP)
- [ ] T020 [US1] Create editor page in `src/routes/editor/+page.svelte` (layout with toolbar, canvas area, integrate all US1 components)
- [ ] T021 [US1] Implement keyboard shortcuts for US1 in `src/lib/editor/utils/keyboard.ts` (P for pencil, +/- for zoom, 0 for reset zoom, # for toggle grid, X for swap colors)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Save and Load JSON Source Files (Priority: P2)

**Goal**: Developer can save asset to JSON file and load previously saved JSON files to continue editing

**Independent Test**: Draw pixels, save to JSON, close editor, reopen, load JSON, verify pixels are restored

### Implementation for User Story 2

- [ ] T022 [US2] Implement JSON serialization in `src/lib/editor/io/json.ts` (loadAssetFromJson, saveAssetToJson with validation and pretty-print)
- [ ] T023 [US2] Implement file system operations in `src/lib/editor/io/file.ts` (openAssetFile, saveAssetFile using browser-fs-access with fallback)
- [ ] T024 [US2] Add dirty tracking to editor state in `src/lib/editor/state/editor.svelte.ts` (isDirty flag, markDirty, markClean, file handle storage)
- [ ] T025 [US2] Add save/load UI to toolbar in `src/routes/editor/+page.svelte` (Save JSON, Load JSON buttons)
- [ ] T026 [US2] Add unsaved changes warning in `src/routes/editor/+page.svelte` (beforeunload event, confirm dialog)
- [ ] T027 [US2] Implement keyboard shortcuts for US2 in `src/lib/editor/utils/keyboard.ts` (Ctrl+S for save, Ctrl+Shift+S for save as, Ctrl+O for open)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Export to PNG (Priority: P3)

**Goal**: Developer can export finished asset as PNG file for use in game

**Independent Test**: Create asset, export to PNG, verify PNG file contains correct pixel data with transparency

### Implementation for User Story 3

- [ ] T028 [US3] Implement PNG export in `src/lib/editor/io/png.ts` (exportToPngBlob using canvas.toBlob, exportPng with file save)
- [ ] T029 [US3] Add export UI to toolbar in `src/routes/editor/+page.svelte` (Export PNG button with filename input)
- [ ] T030 [US3] Implement keyboard shortcut for US3 in `src/lib/editor/utils/keyboard.ts` (Ctrl+E for export PNG)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Use Basic Drawing Tools (Priority: P4)

**Goal**: Developer can use eraser, fill, and color picker tools to efficiently create and refine pixel art

**Independent Test**: Use each tool on canvas and verify expected pixel changes (eraser removes, fill floods, picker samples)

### Implementation for User Story 4

- [ ] T031 [P] [US4] Implement eraser tool in `src/lib/editor/tools/eraser.ts` (clear pixels with line interpolation like pencil)
- [ ] T032 [P] [US4] Implement flood fill algorithm in `src/lib/editor/canvas/drawing.ts` (floodFill with stack-based 4-connectivity)
- [ ] T033 [US4] Implement fill tool in `src/lib/editor/tools/fill.ts` (flood fill from click position)
- [ ] T034 [US4] Implement color picker tool in `src/lib/editor/tools/picker.ts` (sample pixel color, set as current color)
- [ ] T035 [US4] Update ToolPalette component in `src/lib/editor/components/ToolPalette.svelte` (add eraser, fill, picker buttons)
- [ ] T036 [US4] Implement keyboard shortcuts for US4 in `src/lib/editor/utils/keyboard.ts` (E for eraser, G for fill, I for picker)

**Checkpoint**: At this point, all basic drawing tools should work independently

---

## Phase 7: User Story 5 - Undo and Redo Actions (Priority: P5)

**Goal**: Developer can undo mistakes and redo undone actions while drawing

**Independent Test**: Draw pixels, press undo, verify pixels removed, press redo, verify pixels return

### Implementation for User Story 5

- [ ] T037 [US5] Implement history management in `src/lib/editor/state/editor.svelte.ts` (undoStack, redoStack, pushUndo, undo, redo, canUndo, canRedo)
- [ ] T038 [US5] Integrate undo push into drawing operations in `src/lib/editor/tools/*.ts` (push state before modifying pixels)
- [ ] T039 [US5] Add undo/redo UI to toolbar in `src/routes/editor/+page.svelte` (Undo, Redo buttons with disabled states)
- [ ] T040 [US5] Implement keyboard shortcuts for US5 in `src/lib/editor/utils/keyboard.ts` (Ctrl+Z for undo, Ctrl+Y and Ctrl+Shift+Z for redo)

**Checkpoint**: At this point, undo/redo should work across all tools

---

## Phase 8: User Story 6 - Preview Asset in Game Context (Priority: P6)

**Goal**: Developer can see real-time PixiJS preview of how asset will appear in game

**Independent Test**: Create asset, observe preview panel showing sprite rendered with PixiJS, edit pixel, verify preview updates

### Implementation for User Story 6

- [ ] T041 [US6] Implement PixiJS preview renderer in `src/lib/editor/preview/renderer.ts` (createPreviewRenderer, update, setScale, playAnimation, stopAnimation, destroy)
- [ ] T042 [US6] Create Preview component in `src/lib/editor/components/Preview.svelte` (PixiJS canvas container, scale controls, animation playback for sprite sheets)
- [ ] T043 [US6] Integrate Preview component into editor layout in `src/routes/editor/+page.svelte` (preview panel in aside, toggle visibility)
- [ ] T044 [US6] Implement real-time preview updates in `src/lib/editor/state/editor.svelte.ts` (subscribe to asset changes, update preview)

**Checkpoint**: At this point, all user stories should be fully functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T045 [P] Add error handling for invalid JSON files in `src/lib/editor/io/json.ts` (try-catch, user-friendly error messages)
- [ ] T046 [P] Add error handling for file system operations in `src/lib/editor/io/file.ts` (permission denied, cancelled dialog)
- [ ] T047 Implement complete keyboard shortcut handler in `src/lib/editor/utils/keyboard.ts` (consolidate all shortcuts, prevent default browser behavior)
- [ ] T048 Add loading states to UI in `src/routes/editor/+page.svelte` (file operations in progress indicator)
- [ ] T049 Optimize fill operation for large canvases in `src/lib/editor/canvas/drawing.ts` (ensure <1s for 128x128)
- [ ] T050 Run quickstart.md validation (verify all features work per checklist)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5 → P6)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses asset from US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses asset from US1 but independently testable
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Extends tools from US1 but independently testable
- **User Story 5 (P5)**: Depends on US1 completion (needs drawing tools to test undo)
- **User Story 6 (P6)**: Can start after Foundational (Phase 2) - Uses asset from US1 but independently testable

### Within Each User Story

- Canvas operations before tools
- Tools before UI components
- UI components before page integration
- Core implementation before keyboard shortcuts
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003, T004)
- Foundational tasks T006, T007, T008 can run in parallel
- US1 tasks T011, T012, T013 can run in parallel (different files)
- US4 tasks T031, T032 can run in parallel (different files)
- Polish tasks T045, T046 can run in parallel (different files)
- Different user stories can be worked on in parallel by different team members (except US5 depends on US1)

---

## Parallel Example: User Story 1

```bash
# Launch canvas operations in parallel:
Task: "Implement canvas pixel operations in src/lib/editor/canvas/operations.ts"
Task: "Implement Bresenham line drawing in src/lib/editor/canvas/drawing.ts"
Task: "Implement canvas rendering functions in src/lib/editor/canvas/render.ts"

# Then implement pencil tool (depends on canvas operations)
Task: "Implement pencil tool in src/lib/editor/tools/pencil.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently at /editor
5. Deploy/demo if ready - editor can create and draw pixels

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - can draw!)
3. Add User Story 2 → Test independently → Deploy/Demo (can save/load!)
4. Add User Story 3 → Test independently → Deploy/Demo (can export PNG!)
5. Add User Story 4 → Test independently → Deploy/Demo (full tool set!)
6. Add User Story 5 → Test independently → Deploy/Demo (undo/redo!)
7. Add User Story 6 → Test independently → Deploy/Demo (preview!)
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP priority)
   - Developer B: User Story 2 (can work on JSON/file ops while A does canvas)
   - Developer C: User Story 3 (can work on PNG export while A does canvas)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Browser-fs-access handles File System Access API with fallback automatically
- Canvas 2D API for editing, PixiJS v8 only for preview panel
- Svelte 5 runes for reactive state ($state, $derived)
