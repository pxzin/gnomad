# Data Model: Visual Style & Resolution

**Feature**: 014-visual-style
**Date**: 2025-12-21

## Asset Specifications

### Tiles

| Property | Value | Notes |
|----------|-------|-------|
| Width | 32 px | Fixed for all tiles |
| Height | 32 px | Fixed for all tiles |
| Format | PNG | 32-bit RGBA |
| Outline | 1px dark | Part of tile asset |

#### Tile Types

| Type | Variants | Background Version |
|------|----------|-------------------|
| Dirt | surface, deep | Yes (dimmed) |
| Stone | light, dark, ore-bearing | Yes (dimmed) |
| Grass | standard | No (surface only) |
| Sand | standard | Yes (dimmed) |
| Water | surface, deep | No |
| Sky | gradient sections | N/A (permanent background) |
| Cave | ambient | N/A (permanent background) |

### Sprites

| Property | Value | Notes |
|----------|-------|-------|
| Width | 32 px | Per frame |
| Height | 48 px | 1.5x tile height |
| Format | PNG | 32-bit RGBA with transparency |
| Outline | 1px dark | Required on all sprites |

#### Gnome Sprite Sheet

| State | Frames | Direction | Total Frames |
|-------|--------|-----------|--------------|
| Idle | 4 | Left, Right | 8 |
| Walking | 6 | Left, Right | 12 |
| Mining | 6 | Left, Right | 12 |
| Climbing | 4 | N/A (facing wall) | 4 |
| Falling | 2 | N/A | 2 |
| Incapacitated | 1 | Left, Right | 2 |
| **Total** | | | **40 frames** |

**Sheet Layout**: 320 x 480 pixels (10 columns x 10 rows of 32x48 frames)

### Background Blocks

| Property | Value | Notes |
|----------|-------|-------|
| Width | 32 px | Same as foreground |
| Height | 32 px | Same as foreground |
| Dimming | 30-50% | Applied at render time OR baked in |
| Outline | Optional | May be softened/removed for depth |

**Approach Options**:
1. **Runtime dimming**: Same source assets, apply tint at render
2. **Baked variants**: Separate darker PNG files

**Recommended**: Runtime dimming for flexibility and smaller asset size.

## Rendering Constants

```typescript
// src/lib/config/rendering.ts

/** Tile dimensions in pixels */
export const TILE_SIZE = 32;

/** Sprite dimensions in pixels */
export const SPRITE_WIDTH = 32;
export const SPRITE_HEIGHT = 48;

/** Background dimming factor (0.0 = black, 1.0 = full bright) */
export const BACKGROUND_DIM_FACTOR = 0.6; // 40% dimmer

/** Supported zoom levels for pixel-perfect rendering */
export const ZOOM_LEVELS = [1, 2, 3, 4] as const;
export const DEFAULT_ZOOM = 2;
```

## File Organization

```text
static/assets/
├── tiles/
│   ├── dirt.png           # 32x32, includes variants in sprite sheet
│   ├── stone.png          # 32x32, includes variants
│   ├── grass.png          # 32x32
│   ├── sand.png           # 32x32
│   └── water.png          # 32x32, animated frames
├── sprites/
│   └── gnome.png          # 320x480 sprite sheet
└── backgrounds/
    ├── sky-gradient.png   # Sky sections
    └── cave-ambient.png   # Cave background texture
```

## Validation Rules

### Tiles
- MUST be exactly 32x32 pixels
- MUST have transparent background (PNG alpha)
- MUST have 1px dark outline on solid edges
- SHOULD tile seamlessly with adjacent tiles of same type

### Sprites
- MUST be exactly 32x48 pixels per frame
- MUST have transparent background
- MUST have 1px dark outline around character
- MUST include all required animation frames
- Character SHOULD be centered horizontally in frame
- Character feet SHOULD align with bottom 4 pixels of frame

### Colors
- No palette restrictions
- Outline color: #000000 to #3D2817 (black to dark brown)
- Light source: Top-left (shadows bottom-right)

## Migration Notes

### From 16x16 to 32x32

1. **Do not upscale existing assets** - Create new assets from scratch
2. Scale ratio: 2x (each old pixel = 4 new pixels conceptually)
3. Add detail in the additional pixel space
4. Update all `TILE_SIZE` references in codebase
5. Update camera/viewport calculations for new tile size
