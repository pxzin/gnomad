# Feature Specification: Pixel Art Editor

**Feature Branch**: `002-pixel-art-editor`
**Created**: 2025-12-11
**Status**: Draft
**Input**: User description: "Criar uma ferramenta de desenho pixel art em uma rota separada da aplicação (/editor) para criar e editar assets do jogo Gnomes At Work."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create New Asset from Preset (Priority: P1)

A developer wants to create a new pixel art asset for the game. They navigate to the editor route, select a preset (e.g., "16x16 Tile"), and start drawing on a blank canvas using the pencil tool.

**Why this priority**: This is the foundation of the editor—without the ability to create and draw on a canvas, no other functionality is useful.

**Independent Test**: Can be fully tested by navigating to /editor, selecting a preset, clicking on canvas pixels, and visually confirming pixels are drawn.

**Acceptance Scenarios**:

1. **Given** the user is on the editor page, **When** they click "New Asset" and select a preset, **Then** a blank canvas of the preset dimensions appears
2. **Given** a canvas is displayed, **When** the user clicks on a pixel with the pencil tool selected, **Then** that pixel is filled with the current color
3. **Given** the user is drawing, **When** they drag the mouse while holding click, **Then** a continuous line of pixels is drawn (no gaps)

---

### User Story 2 - Save and Load JSON Source Files (Priority: P2)

A developer has created or modified an asset and wants to save their work as a JSON file. Later, they can reopen this JSON file to continue editing.

**Why this priority**: Persistence is essential for any useful editor—without save/load, work is lost when the page closes.

**Independent Test**: Can be fully tested by drawing pixels, saving to JSON, closing the editor, reopening, loading the JSON, and verifying the pixels are restored.

**Acceptance Scenarios**:

1. **Given** the user has an asset with drawn pixels, **When** they click "Save JSON", **Then** a JSON file is saved containing the asset data
2. **Given** the user has a previously saved JSON file, **When** they click "Load JSON" and select the file, **Then** the canvas displays the saved pixel data
3. **Given** the user loads a JSON file, **When** they make edits and save again, **Then** the JSON file is updated with the new pixel data

---

### User Story 3 - Export to PNG (Priority: P3)

A developer has finished creating an asset and wants to export it as a PNG image file to use in the game.

**Why this priority**: PNG export is the end goal of the editor—converting designs into usable game assets.

**Independent Test**: Can be fully tested by creating an asset, exporting to PNG, and verifying the PNG file contains the correct pixel data.

**Acceptance Scenarios**:

1. **Given** the user has an asset with drawn pixels, **When** they click "Export PNG", **Then** a PNG file is created with the exact pixel data
2. **Given** the user exports a PNG, **When** they specify a filename, **Then** the file is saved with that name
3. **Given** the PNG is exported, **When** opened in an image viewer, **Then** it displays transparent background for undrawn pixels

---

### User Story 4 - Use Basic Drawing Tools (Priority: P4)

A developer uses various tools to create and refine their pixel art: eraser to remove pixels, fill bucket to fill areas, and color picker to sample colors.

**Why this priority**: Additional tools improve efficiency but the editor is usable with just the pencil tool from P1.

**Independent Test**: Can be fully tested by using each tool on the canvas and verifying the expected pixel changes.

**Acceptance Scenarios**:

1. **Given** the eraser tool is selected, **When** the user clicks on a colored pixel, **Then** the pixel becomes transparent
2. **Given** the fill tool is selected, **When** the user clicks on an area, **Then** all connected pixels of the same color are filled with the current color
3. **Given** the color picker tool is selected, **When** the user clicks on a colored pixel, **Then** that color becomes the current drawing color

---

### User Story 5 - Undo and Redo Actions (Priority: P5)

A developer makes a mistake while drawing and wants to undo their last action. They can also redo if they undo too much.

**Why this priority**: Undo/redo is important for usability but not essential for basic functionality.

**Independent Test**: Can be fully tested by drawing pixels, pressing undo, verifying pixels are removed, pressing redo, verifying pixels return.

**Acceptance Scenarios**:

1. **Given** the user has drawn pixels, **When** they press undo, **Then** the last drawing action is reversed
2. **Given** the user has undone an action, **When** they press redo, **Then** the undone action is restored
3. **Given** the user performs multiple actions, **When** they press undo multiple times, **Then** each action is reversed in order

---

### User Story 6 - Preview Asset in Game Context (Priority: P6)

A developer wants to see how their pixel art will look when rendered in the actual game engine (PixiJS).

**Why this priority**: Preview is helpful for validation but the exported PNG can always be tested in the game directly.

**Independent Test**: Can be fully tested by creating an asset and observing the preview panel showing the sprite rendered with PixiJS.

**Acceptance Scenarios**:

1. **Given** the user has an asset on canvas, **When** the preview panel is visible, **Then** it shows the asset rendered as it would appear in-game
2. **Given** the user edits a pixel, **When** the change is made, **Then** the preview updates in real-time
3. **Given** the asset is a sprite sheet with animation data, **When** the preview is active, **Then** it plays the animation at the defined frame rate

---

### Edge Cases

- What happens when the user tries to save without drawing anything?
  - System saves an empty asset (all transparent pixels) with the preset metadata
- What happens when the user loads an invalid or corrupted JSON file?
  - System shows an error message and does not modify the current canvas
- What happens when the user tries to undo with no history?
  - Undo button is disabled; no action is taken
- What happens when the browser doesn't support File System Access API?
  - System falls back to browser download dialog for saving files
- What happens when the user draws outside canvas bounds?
  - Mouse events outside canvas are ignored
- What happens when the user tries to fill a very large area?
  - Fill operation completes within reasonable time (under 1 second for max canvas size)

## Requirements *(mandatory)*

### Functional Requirements

#### Editor Access

- **FR-001**: System MUST provide the editor at a dedicated route (/editor) separate from the main game
- **FR-002**: System MUST display a canvas area for pixel editing
- **FR-003**: System MUST provide a toolbar with available tools and actions

#### Asset Creation

- **FR-004**: System MUST offer preset canvas sizes appropriate for game assets (16x16 tiles, 16x24 gnome sprites, sprite sheets, etc.)
- **FR-005**: System MUST allow creating custom canvas sizes up to 128x128 pixels
- **FR-006**: System MUST display a zoomed view of the canvas for precise pixel editing
- **FR-007**: System MUST show a pixel grid overlay to distinguish individual pixels

#### Drawing Tools

- **FR-008**: System MUST provide a pencil tool to draw individual pixels
- **FR-009**: System MUST provide an eraser tool to remove pixels (make transparent)
- **FR-010**: System MUST provide a fill tool to flood-fill connected areas
- **FR-011**: System MUST provide a color picker tool to sample colors from canvas
- **FR-012**: System MUST provide a color selector to choose the current drawing color
- **FR-013**: System MUST interpolate pixels when drawing quickly (no gaps in strokes)

#### File Operations

- **FR-014**: System MUST save assets to a human-readable JSON format
- **FR-015**: System MUST load assets from JSON files
- **FR-016**: System MUST export assets as PNG image files
- **FR-017**: System MUST support direct file system saving when browser supports File System Access API
- **FR-018**: System MUST fall back to download dialog when File System Access API is unavailable

#### History

- **FR-019**: System MUST support undo functionality for drawing actions
- **FR-020**: System MUST support redo functionality for undone actions
- **FR-021**: System MUST maintain history across tool changes within the same session

#### Preview

- **FR-022**: System MUST display a real-time preview of the asset as it would appear in-game
- **FR-023**: System MUST update the preview immediately when pixels change
- **FR-024**: System MUST animate sprite sheets in the preview when animation data is present

#### JSON Format

- **FR-025**: JSON format MUST include asset name and dimensions
- **FR-026**: JSON format MUST store pixel data in a format that can be programmatically generated
- **FR-027**: JSON format MUST support transparency information
- **FR-028**: JSON format MUST include preset identifier for context

### Key Entities

- **Asset**: A pixel art document with name, dimensions, preset type, and pixel data; can be saved as JSON or exported as PNG
- **Pixel**: Individual color point on the canvas; has x/y coordinates and color value (including transparency)
- **Preset**: Predefined canvas configuration with dimensions and category (tiles, sprites, UI, etc.)
- **Tool**: Drawing instrument (pencil, eraser, fill, picker) with specific behavior when interacting with canvas
- **History Entry**: Snapshot of canvas state for undo/redo functionality

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new asset and draw their first pixel within 30 seconds of opening the editor
- **SC-002**: A saved JSON file can be loaded and displays identical pixel data to what was saved
- **SC-003**: Exported PNG files are pixel-perfect matches to the canvas content (no compression artifacts, correct transparency)
- **SC-004**: Undo/redo operations complete instantaneously (under 100ms perceived delay)
- **SC-005**: Preview updates reflect canvas changes within 100ms
- **SC-006**: Fill operation on maximum canvas size (128x128) completes within 1 second
- **SC-007**: JSON format is readable enough that a simple asset can be created by writing JSON directly (for AI generation)
- **SC-008**: All preset sizes match the requirements of the Gnomes At Work game (16x16 tiles, 16x24 sprites, etc.)

## Assumptions

The following reasonable defaults have been applied:

- **Single asset editing**: Editor works with one asset at a time; no multi-tab or split view
- **No layers**: MVP uses single-layer editing; layers may be added in future versions
- **No selection tools**: MVP does not include rectangle select, move, or copy/paste
- **Color format**: Colors stored as hex strings (#RRGGBB or #RRGGBBAA)
- **Maximum canvas**: 128x128 pixels is sufficient for all current game asset needs
- **Zoom levels**: Default zoom shows pixels clearly; zoom in/out available but specific levels not specified
- **Keyboard shortcuts**: Standard shortcuts (Ctrl+Z undo, Ctrl+Y redo, Ctrl+S save) will be implemented
- **Browser support**: Modern browsers (Chrome, Firefox, Safari, Edge) with ES2020+ support
