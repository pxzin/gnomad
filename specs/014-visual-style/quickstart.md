# Quickstart: Visual Style Implementation

**Feature**: 014-visual-style
**Date**: 2025-12-21

## Overview

This guide covers implementing the 32x32 visual style for Gnomes At Work. Follow these steps in order.

## Prerequisites

- [ ] Feature 010 (Background Blocks & Horizon) merged
- [ ] Pixel art editor available (Aseprite, Piskel, or similar)
- [ ] Current codebase running locally

## Step 1: Update Rendering Constants

Update tile/sprite size constants in the codebase.

**File**: `src/lib/config/rendering.ts` (create if doesn't exist)

```typescript
/** Tile dimensions in pixels */
export const TILE_SIZE = 32;

/** Sprite dimensions in pixels */
export const SPRITE_WIDTH = 32;
export const SPRITE_HEIGHT = 48;

/** Background dimming factor (0.0 = black, 1.0 = full bright) */
export const BACKGROUND_DIM_FACTOR = 0.6;

/** Supported zoom levels */
export const ZOOM_LEVELS = [1, 2, 3, 4] as const;
export const DEFAULT_ZOOM = 2;
```

**Update existing references**:
- Search for `16` in rendering code and update to `TILE_SIZE`
- Update camera/viewport calculations

## Step 2: Configure Pixel-Perfect Rendering

Ensure PixiJS uses nearest-neighbor scaling.

**File**: Where PixiJS app is initialized

```typescript
import { Application, Texture } from 'pixi.js';

// On texture load
texture.source.scaleMode = 'nearest';

// Application setup
const app = new Application();
await app.init({
  resolution: window.devicePixelRatio,
  autoDensity: true,
  // ... other options
});
```

## Step 3: Create Base Tile Assets

Create new 32x32 tiles following the style guide.

### Tile Checklist

For each tile type:

1. **Create 32x32 canvas** in your pixel art editor
2. **Apply 1px dark outline** on solid edges
3. **Light from top-left** (highlights top/left, shadows bottom/right)
4. **Export as PNG** with transparency
5. **Save to** `static/assets/tiles/[name].png`

### Priority Tiles (create first)

1. `dirt.png` - Basic terrain
2. `stone.png` - Underground rock
3. `grass.png` - Surface grass
4. `sky.png` - Sky gradient (or generate procedurally)

## Step 4: Create Gnome Sprite Sheet

Create 32x48 gnome sprites with all states.

### Sprite Sheet Layout

**Total Size**: 320 x 480 pixels (10 cols × 10 rows)

| Row | State | Direction | Frames |
|-----|-------|-----------|--------|
| 0 | Idle | Left | 4 |
| 1 | Idle | Right | 4 |
| 2 | Walk | Left | 6 |
| 3 | Walk | Right | 6 |
| 4 | Mine | Left | 6 |
| 5 | Mine | Right | 6 |
| 6 | Climb | N/A | 4 |
| 7 | Fall | N/A | 2 |
| 8 | Incapacitated | Left | 1 |
| 9 | Incapacitated | Right | 1 |

### Gnome Design Guidelines

- **Head**: ~12px tall (allows expressions)
- **Body**: ~24px
- **Feet**: Align with bottom 4px of frame
- **Colors**: Earthy browns, simple clothing
- **Outline**: 1px black around entire character

## Step 5: Implement Background Dimming

Apply dimming to background tiles at render time.

**Option A: Tint-based (recommended)**

```typescript
import { BACKGROUND_DIM_FACTOR } from '$lib/config/rendering';

function renderBackgroundTile(sprite: Sprite): void {
  // Convert factor to hex tint (0x999999 = 60% brightness)
  const tintValue = Math.floor(BACKGROUND_DIM_FACTOR * 255);
  const tint = (tintValue << 16) | (tintValue << 8) | tintValue;
  sprite.tint = tint;
}
```

**Option B: Alpha-based**

```typescript
sprite.alpha = BACKGROUND_DIM_FACTOR;
```

## Step 6: Update Sprite Loading

Update sprite sheet parsing for new dimensions.

```typescript
import { SPRITE_WIDTH, SPRITE_HEIGHT } from '$lib/config/rendering';

function getFrameRect(frameIndex: number, framesPerRow: number = 10): Rectangle {
  const col = frameIndex % framesPerRow;
  const row = Math.floor(frameIndex / framesPerRow);
  return new Rectangle(
    col * SPRITE_WIDTH,
    row * SPRITE_HEIGHT,
    SPRITE_WIDTH,
    SPRITE_HEIGHT
  );
}
```

## Step 7: Create Style Guide Document

Create user-facing documentation.

**File**: `docs/style-guide.md`

Copy content from `specs/014-visual-style/contracts/README.md` and adapt for artist audience.

## Step 8: Validation

### Visual Checklist

- [ ] Tiles render at 32x32 without blur
- [ ] Gnomes render at 32x48 without blur
- [ ] Background tiles are visibly dimmer than foreground
- [ ] Zoom levels maintain pixel crispness
- [ ] Gnome states are visually distinguishable
- [ ] Foreground/background distinction is clear

### Code Checklist

- [ ] No hardcoded `16` values for tile size
- [ ] `TILE_SIZE` constant used everywhere
- [ ] Nearest-neighbor scaling enabled
- [ ] Type definitions updated for new sizes

## Common Issues

### Blurry Tiles

**Cause**: Default linear scaling
**Fix**: Set `texture.source.scaleMode = 'nearest'`

### Sprites Cut Off

**Cause**: Old 16x16 frame rectangles
**Fix**: Update sprite sheet parsing to 32x48

### Background Same as Foreground

**Cause**: Dimming not applied
**Fix**: Apply tint to background layer sprites

### Jittery Movement

**Cause**: Non-integer positions
**Fix**: Round positions to integers before rendering

```typescript
sprite.x = Math.round(position.x * TILE_SIZE);
sprite.y = Math.round(position.y * TILE_SIZE);
```

## Next Steps

After completing this quickstart:

1. Run `/speckit.tasks` to generate implementation tasks
2. Create remaining tile variants
3. Add animation frames beyond minimums
4. Fine-tune dimming factor based on visual testing
