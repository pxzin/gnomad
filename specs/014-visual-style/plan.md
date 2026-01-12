# Implementation Plan: Visual Style & Resolution

**Branch**: `014-visual-style` | **Date**: 2025-12-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-visual-style/spec.md`

## Summary

Define and implement the final visual style for Gnomes At Work: 32x32 pixel tiles with proportional sprites (32x48), dark outlines, dimmed backgrounds for depth, and unrestricted color palette. Create comprehensive style guide documentation and update existing placeholder assets.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) - for config constants only
**Primary Dependencies**: PixiJS v8 (rendering), PNG files (assets)
**Storage**: PNG sprite sheets and individual tile images in `static/assets/`
**Testing**: Visual validation (manual), style guide compliance check
**Target Platform**: Desktop browsers (Chrome, Firefox, Safari)
**Project Type**: Single project - SvelteKit web application
**Performance Goals**: 60 FPS rendering with new 32x32 assets
**Constraints**: Assets must be 2x current size (16x16 → 32x32), maintain crisp pixel-perfect rendering
**Scale/Scope**: ~20 tile types, 1 gnome sprite sheet with 6 states, style guide document

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety First | ✅ Pass | Config constants will be typed |
| II. Entity-Component Architecture | ✅ N/A | No new components - visual assets only |
| III. Documentation as Specification | ✅ Pass | Style guide IS the documentation |
| IV. Simplicity and YAGNI | ✅ Pass | Simple approach - just asset definitions |
| V. Deterministic Game State | ✅ N/A | Art assets don't affect game state |

**Gate Status**: PASSED - All applicable principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/014-visual-style/
├── plan.md              # This file
├── research.md          # Pixel art best practices research
├── data-model.md        # Asset specifications and dimensions
├── quickstart.md        # How to create new assets
├── contracts/           # Style guide specifications
│   └── README.md        # Visual style contract
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
static/assets/
├── tiles/
│   ├── terrain/         # Dirt, stone, grass tiles (32x32)
│   └── backgrounds/     # Background variants (32x32, dimmed)
├── sprites/
│   └── gnome/           # Gnome sprite sheet (32x48 per frame)
└── ui/                  # UI elements (various sizes)

src/lib/config/
└── rendering.ts         # TILE_SIZE, SPRITE_WIDTH, SPRITE_HEIGHT constants

docs/
└── style-guide.md       # Player/artist-facing style documentation
```

**Structure Decision**: Assets organized by type (tiles, sprites, ui) under `static/assets/`. Config constants in existing `src/lib/config/` directory. Style guide in `docs/` per constitution requirement for user-facing documentation.

## Complexity Tracking

> No violations - simple approach with no patterns or abstractions needed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
