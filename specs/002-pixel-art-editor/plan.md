# Implementation Plan: Pixel Art Editor

**Branch**: `002-pixel-art-editor` | **Date**: 2025-12-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-pixel-art-editor/spec.md`

## Summary

Build a browser-based pixel art editor as a separate SvelteKit route (`/editor`) for creating and editing game assets. The editor enables:

- Creating pixel art on a zoomable canvas with preset sizes (16x16 tiles, sprites, etc.)
- Drawing tools: pencil, eraser, fill, color picker
- Saving/loading assets as human-readable JSON files (AI-writable format)
- Exporting to PNG for use in the game engine
- Undo/redo history and real-time PixiJS preview

This is a development tool, not part of the game itself. Uses Canvas 2D API for pixel manipulation and Svelte 5 runes for state management.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: SvelteKit 2.x, Canvas 2D API (editing), PixiJS v8 (preview), browser-fs-access (file operations)
**Storage**: JSON files (source assets), PNG files (exports), no database
**Testing**: Vitest (unit tests)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge) with ES2020+ support
**Project Type**: Web application (SvelteKit route within existing project)
**Performance Goals**: 60fps canvas updates, <100ms undo/redo, <1s fill on 128x128
**Constraints**: Single-user tool, offline-capable, no backend required, max canvas 128x128
**Scale/Scope**: ~15 asset presets, 4 drawing tools, single-layer editing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Type Safety First ✅ PASS

- All editor code will use TypeScript strict mode
- Explicit types for all public APIs (asset format, editor state, tool interfaces)
- Asset data structures will be fully typed interfaces
- No `any` types without documented justification

### Principle II: Entity-Component Architecture ⚠️ NOT APPLICABLE

- The pixel art editor is a **development tool**, not game logic
- It does not operate on game entities or run in the game loop
- **Justification**: ECS pattern is for game state management; editor uses standard Svelte component architecture which is appropriate for a UI tool
- Components in this context are Svelte UI components, not ECS data structures

### Principle III: Documentation as Specification ✅ PASS

- This plan serves as specification
- Asset format documented in `data-model.md`
- API contracts in `contracts/`
- System documentation provided via quickstart.md

### Principle IV: Simplicity and YAGNI ✅ PASS

- Start with minimal viable tools (pencil, eraser, fill, picker)
- No layers system in MVP
- No selection/transform tools in MVP
- No abstraction layers—direct canvas manipulation
- Add features only when demonstrated necessary

### Principle V: Deterministic Game State ⚠️ NOT APPLICABLE

- Editor is a tool, not game logic—determinism not required
- Asset export is deterministic: same JSON input → same PNG output
- No random operations in editor
- **Note**: Editor state (undo history) is session-only, not serialized

### Gate Status: **PASS**

All applicable principles satisfied. Principles II and V are explicitly not applicable to development tools (documented deviation with justification).

## Project Structure

### Documentation (this feature)

```text
specs/002-pixel-art-editor/
├── plan.md              # This file
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Asset format & state types
├── quickstart.md        # Phase 1: Quick start guide
├── contracts/           # Phase 1: API contracts
│   └── editor-api.md    # Editor function signatures
└── tasks.md             # Phase 2: Implementation tasks (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── routes/
│   ├── +layout.svelte        # Existing root layout
│   ├── +page.svelte          # Existing game page
│   └── editor/               # NEW: Pixel art editor route
│       └── +page.svelte      # Editor page entry
├── lib/
│   ├── assets/               # Asset storage
│   │   ├── source/           # NEW: JSON source files
│   │   └── sprites/          # NEW: PNG exports
│   │       ├── tiles/
│   │       ├── gnomes/
│   │       ├── structures/
│   │       ├── ui/
│   │       ├── resources/
│   │       └── vegetation/
│   └── editor/               # NEW: Editor module
│       ├── components/       # Svelte UI components
│       │   ├── Canvas.svelte
│       │   ├── ToolPalette.svelte
│       │   ├── ColorPicker.svelte
│       │   ├── PresetSelector.svelte
│       │   └── Preview.svelte
│       ├── state/            # State management
│       │   └── editor.svelte.ts
│       ├── tools/            # Drawing tools
│       │   ├── pencil.ts
│       │   ├── eraser.ts
│       │   ├── fill.ts
│       │   ├── picker.ts
│       │   └── types.ts
│       ├── io/               # Import/export
│       │   ├── json.ts
│       │   ├── png.ts
│       │   └── presets.ts
│       └── types.ts          # Type definitions
└── tests/
    └── editor/               # Editor tests
        ├── io.test.ts
        └── tools.test.ts
```

**Structure Decision**: Extend existing SvelteKit structure with `/editor` route. Editor code isolated in `src/lib/editor/` module. Assets stored in `src/lib/assets/` with `source/` (JSON) and `sprites/` (PNG) subdirectories.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Not using ECS for editor | Editor is a UI tool, not game logic | ECS provides no benefit for pixel manipulation UI |
| Editor state not deterministic | Session-only tool state | Determinism needed for game replay, not editor sessions |

## Asset Presets

Based on Gnomes At Work game requirements (from 001-colony-sim-core spec):

| Preset | Dimensions | Category | Purpose |
|--------|------------|----------|---------|
| `tile-16` | 16×16 | tiles | Standard terrain tile (FR-004) |
| `tile-32` | 32×32 | tiles | Large terrain features |
| `gnome-idle` | 16×24 | gnomes | Character idle pose |
| `gnome-walk` | 64×24 | gnomes | Walk animation (4 frames) |
| `gnome-dig` | 64×24 | gnomes | Mining animation (4 frames) |
| `gnome-climb` | 48×24 | gnomes | Climbing animation (3 frames) |
| `structure-wall` | 16×16 | structures | Wall piece |
| `structure-door` | 16×32 | structures | Door (2 tiles high) |
| `structure-ladder` | 16×16 | structures | Ladder segment |
| `ui-button` | 32×32 | ui | UI button base |
| `ui-icon` | 16×16 | ui | Small icons |
| `resource-item` | 12×12 | resources | Resource icons |
| `tree` | 48×64 | vegetation | Surface tree |
| `bush` | 24×16 | vegetation | Small plants |
| `custom` | User-defined | - | Up to 128×128 |
