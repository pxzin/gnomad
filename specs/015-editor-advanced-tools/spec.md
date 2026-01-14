# Feature Specification: Editor Advanced Tools

**Feature Branch**: `015-editor-advanced-tools`
**Created**: 2026-01-12
**Status**: Draft
**Input**: User description: "editor advanced tools: colar imagens, multiplos layers, ferramentas de animação"

## Clarifications

### Session 2026-01-12

- Q: Where should pasted images be placed on the canvas? → A: Always at origin (0,0), top-left corner
- Q: Do animation frames share the same layer structure, or does each frame have independent layers? → A: Shared layers - each layer exists across all frames
- Q: Where should pasted content go in a layered document? → A: Always create a new layer for pasted content
- Q: What should be the maximum number of layers allowed? → A: Unlimited, with performance warning above 32 layers
- Q: Can users add animation capabilities to any asset, or only animation presets? → A: Any asset can enable animation features

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Paste External Images (Priority: P1)

As a pixel artist, I want to paste images from my clipboard into the editor so that I can quickly import reference art or existing sprites without manual file operations.

**Why this priority**: This is the most impactful productivity feature. Artists frequently need to import existing artwork, screenshots, or reference images. Without paste support, users must manually recreate or export/import through files.

**Independent Test**: Can be fully tested by copying any image to clipboard, pasting into editor, and verifying pixels appear correctly on the canvas.

**Acceptance Scenarios**:

1. **Given** user has an image in clipboard, **When** user presses Ctrl/Cmd+V, **Then** the image pixels are placed on the canvas starting at position (0,0)
2. **Given** pasted image is larger than canvas, **When** paste occurs, **Then** image is cropped to fit canvas bounds
3. **Given** pasted image has colors not in current palette, **When** paste occurs, **Then** new colors are automatically added to palette
4. **Given** clipboard contains non-image data (text, files), **When** user pastes, **Then** nothing happens (no error, silent ignore)
5. **Given** pasted image has transparency, **When** paste occurs, **Then** transparent pixels are preserved (not converted to a color)

---

### User Story 2 - Multiple Layers (Priority: P2)

As a pixel artist, I want to work with multiple layers so that I can organize different parts of my artwork (outline, fill, shadows, highlights) separately and edit them independently.

**Why this priority**: Layers are fundamental to professional pixel art workflow. They enable non-destructive editing and organization. However, the editor can still function as MVP without layers (flat editing).

**Independent Test**: Can be fully tested by creating multiple layers, drawing on each, toggling visibility, reordering, and verifying correct composite output.

**Acceptance Scenarios**:

1. **Given** editor is open with an asset, **When** user creates a new layer, **Then** a new transparent layer appears above current layer
2. **Given** multiple layers exist, **When** user selects a layer, **Then** drawing operations only affect the selected layer
3. **Given** multiple layers exist, **When** user toggles layer visibility off, **Then** that layer's pixels are hidden from canvas and preview
4. **Given** multiple layers exist, **When** user reorders layers (drag up/down), **Then** the visual stacking order updates accordingly
5. **Given** multiple layers exist, **When** user exports asset, **Then** all visible layers are flattened into a single image
6. **Given** asset has layers, **When** user saves JSON, **Then** layer structure is preserved and reloaded correctly
7. **Given** user wants to simplify, **When** user flattens all layers, **Then** all visible layers merge into one

---

### User Story 3 - Animation Timeline (Priority: P3)

As a pixel artist creating sprite animations, I want an animation timeline with frame management so that I can preview, edit, and organize animation frames efficiently.

**Why this priority**: Animation tools enhance the workflow for sprite sheets but require layers and basic editing to be solid first. The editor can export animations via preset-based frame dimensions even without dedicated timeline tools.

**Independent Test**: Can be fully tested by creating frames, playing animation preview, adjusting timing, and verifying exported sprite sheet matches timeline.

**Acceptance Scenarios**:

1. **Given** an asset with animation metadata, **When** user opens timeline panel, **Then** frames are displayed as thumbnails in sequence
2. **Given** timeline is visible, **When** user clicks play, **Then** animation preview plays at the defined FPS
3. **Given** timeline is visible, **When** user clicks a frame thumbnail, **Then** canvas shows that frame for editing
4. **Given** user wants to adjust timing, **When** user changes FPS value, **Then** preview updates to new speed
5. **Given** user wants more frames, **When** user adds a new frame, **Then** a blank frame is inserted after current frame
6. **Given** user wants to remove a frame, **When** user deletes frame, **Then** frame is removed and timeline adjusts
7. **Given** user wants to reorder, **When** user drags frame to new position, **Then** frame order updates in timeline and sprite sheet

---

### User Story 4 - Onion Skinning (Priority: P4)

As an animator, I want onion skinning to see previous and next frames as semi-transparent overlays so that I can create smooth animations with proper motion continuity.

**Why this priority**: Onion skinning is an advanced animation aid. It's valuable but not essential for basic animation creation.

**Independent Test**: Can be fully tested by enabling onion skinning, navigating frames, and verifying ghosted frames appear with correct opacity.

**Acceptance Scenarios**:

1. **Given** animation has multiple frames, **When** user enables onion skinning, **Then** previous frame appears as semi-transparent overlay
2. **Given** onion skinning is enabled, **When** user navigates to different frame, **Then** overlay updates to show adjacent frames
3. **Given** user wants to customize, **When** user adjusts onion skin opacity, **Then** overlay transparency changes accordingly
4. **Given** user wants to see future frames, **When** user enables "next frame" option, **Then** next frame also appears as overlay (different tint)
5. **Given** onion skinning is enabled, **When** user draws, **Then** drawing only affects current frame (overlays are view-only)

---

### Edge Cases

- What happens when pasting an image with thousands of colors? (Palette grows but may become unwieldy)
- What happens when deleting the only remaining layer? (Prevent deletion or create new empty layer)
- What happens when deleting the only remaining frame? (Prevent deletion or keep minimum 1 frame)
- How does layer system interact with existing flat JSON assets? (Auto-migrate to single layer)
- What happens when loading very large images (>128px)? (Crop to max canvas size with warning)

## Requirements *(mandatory)*

### Functional Requirements

**Image Paste**:
- **FR-001**: System MUST detect image data in clipboard on paste action (Ctrl/Cmd+V)
- **FR-002**: System MUST convert pasted image pixels to the sparse pixel format used by the editor
- **FR-003**: System MUST crop pasted images that exceed canvas dimensions
- **FR-004**: System MUST preserve alpha/transparency from pasted images
- **FR-005**: System MUST add new colors from pasted image to the asset palette
- **FR-005a**: System MUST create a new layer when pasting into a layered document

**Layers**:
- **FR-006**: System MUST support unlimited layers per asset, displaying a performance warning when exceeding 32 layers
- **FR-007**: System MUST allow creating, deleting, reordering, and merging layers
- **FR-008**: System MUST allow toggling layer visibility
- **FR-009**: System MUST allow renaming layers
- **FR-010**: System MUST support layer opacity adjustment
- **FR-011**: System MUST flatten layers on PNG export (composite visible layers)
- **FR-012**: System MUST preserve layer structure in JSON format
- **FR-013**: System MUST auto-migrate flat assets to single-layer format on load
- **FR-013a**: Layers MUST be shared across all animation frames (each layer spans entire animation)

**Animation Timeline**:
- **FR-014**: System MUST allow enabling animation on any asset type (not restricted to animation presets)
- **FR-015**: System MUST display frames as visual thumbnails in timeline view
- **FR-016**: System MUST support animation playback preview at configurable FPS
- **FR-017**: System MUST allow adding, removing, and reordering frames
- **FR-018**: System MUST allow duplicating existing frames
- **FR-019**: System MUST synchronize frame navigation with canvas editing

**Onion Skinning**:
- **FR-020**: System MUST display previous frame as semi-transparent overlay when enabled
- **FR-021**: System MUST allow toggling onion skinning on/off
- **FR-022**: System MUST allow adjusting onion skin opacity (0-100%)
- **FR-023**: System MUST support showing next frame overlay (optional toggle)

### Key Entities

- **Layer**: A single drawing surface shared across all animation frames. Has name, visibility state, opacity level, and pixel data per frame. Layers stack in defined order.
- **Frame**: A single moment in an animation. References the shared layer structure; each layer contains frame-specific pixel data. Frames share the same dimensions.
- **Timeline**: Ordered collection of frames with playback metadata (FPS, loop settings). Manages frame sequencing and preview state.
- **Clipboard Image**: External image data to be converted into pixel format. Has source dimensions, color data, and transparency information.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can paste an external image and see pixels on canvas within 1 second
- **SC-002**: Users can create and manage up to 32 layers without noticeable performance impact (warning shown above 32)
- **SC-003**: Layer operations (create, delete, reorder, toggle visibility) complete instantly (<100ms perceived)
- **SC-004**: Animation preview plays smoothly at up to 30 FPS
- **SC-005**: Users can navigate between 20+ animation frames without lag
- **SC-006**: Saved assets with layers reload with identical layer structure
- **SC-007**: Onion skinning overlay renders without affecting canvas responsiveness

## Assumptions

- Clipboard API is available in modern browsers for image paste functionality
- Maximum canvas size remains 128x128 pixels (existing constraint)
- Layer system is compatible with existing JSON asset format (extended, not replaced)
- Animation frames share the same dimensions (no per-frame resizing)
- Layers are shared across all frames (each layer spans entire animation timeline)
- Pasted images always placed at origin (0,0) and create a new layer
- Unlimited layers allowed; performance warning displayed above 32 layers
- Any asset type can have animation enabled (not restricted to animation presets)
- Default onion skin opacity is 30% for previous frame, 20% for next frame
- Maximum FPS for animation preview is 30 (sufficient for pixel art animations)
