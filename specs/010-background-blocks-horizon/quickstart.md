# Quickstart: Background Blocks & Horizon System

**Phase 1 Output** | **Date**: 2025-12-21 | **Spec**: [spec.md](./spec.md)

## Overview

Guia rápido para desenvolvedores implementando o sistema de background blocks e horizonte.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      PixiJS Containers                       │
├─────────────────────────────────────────────────────────────┤
│  z=0  │ permanentBackgroundContainer (Sky/Cave fills)       │
│  z=1  │ backgroundContainer (background tiles)              │
│  z=2  │ worldContainer (foreground tiles, buildings)        │
│  z=3  │ entityContainer (gnomes, resources)                 │
│  z=4  │ uiContainer (selection, task markers)               │
└───────┴─────────────────────────────────────────────────────┘
```

## Key Files to Modify

| File | Changes |
|------|---------|
| `src/lib/components/background.ts` | **NEW** - PermanentBackgroundType enum |
| `src/lib/components/tile.ts` | Add BackgroundTile interface, creation functions |
| `src/lib/config/colors.ts` | Add background colors, darken function |
| `src/lib/game/state.ts` | Add backgroundTileGrid, backgroundTiles, horizonY |
| `src/lib/world-gen/generator.ts` | Generate backgrounds with foreground tiles |
| `src/lib/render/renderer.ts` | Add background containers, rendering logic |
| `src/lib/systems/mining.ts` | Support background tile mining |
| `src/lib/ecs/background.ts` | **NEW** - Background ECS functions |

## Implementation Order

### Step 1: Types & Components

```typescript
// 1a. Create src/lib/components/background.ts
export enum PermanentBackgroundType {
  Sky = 'sky',
  Cave = 'cave'
}

// 1b. Extend src/lib/components/tile.ts
export interface BackgroundTile {
  type: TileType;
  durability: number;
}
```

### Step 2: State Extension

```typescript
// Extend GameState in src/lib/game/state.ts
interface GameState {
  backgroundTileGrid: (Entity | null)[][];
  backgroundTiles: Map<Entity, BackgroundTile>;
  horizonY: number;
}
```

### Step 3: Colors

```typescript
// Add to src/lib/config/colors.ts
export const PERMANENT_BACKGROUND_COLORS = {
  sky: 0x87ceeb,
  cave: 0x2a2a2a
};

export const BACKGROUND_DARKEN_FACTOR = 0.6;

export function getBackgroundBlockColor(color: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * BACKGROUND_DARKEN_FACTOR);
  const g = Math.floor(((color >> 8) & 0xff) * BACKGROUND_DARKEN_FACTOR);
  const b = Math.floor((color & 0xff) * BACKGROUND_DARKEN_FACTOR);
  return (r << 16) | (g << 8) | b;
}
```

### Step 4: World Generation

```typescript
// Modify generateWorld in generator.ts
function generateWorld(config: WorldConfig): GameState {
  // ... existing tile generation ...

  // For each solid tile created, also create background
  if (tileType !== TileType.Air) {
    const [bgState, bgEntity] = createEntity(state);
    state = addBackgroundTile(bgState, bgEntity, createBackgroundTile(tileType));
    state = setBackgroundTileAt(state, x, y, bgEntity);
  }

  // Set horizon
  state.horizonY = config.horizonY ?? Math.floor(config.height * config.surfaceLevel);
}
```

### Step 5: Rendering

```typescript
// Add to createRenderer in renderer.ts
const permanentBackgroundContainer = new Container();
const backgroundContainer = new Container();

app.stage.addChild(permanentBackgroundContainer);
app.stage.addChild(backgroundContainer);
app.stage.addChild(worldContainer);
// ... rest of containers

// Render permanent backgrounds
function renderPermanentBackground(state: GameState, renderer: Renderer) {
  const { skyFillGraphics, caveFillGraphics } = renderer;
  const { worldWidth, worldHeight, horizonY } = state;

  // Sky region (y < horizonY)
  skyFillGraphics.clear();
  skyFillGraphics.rect(0, 0, worldWidth * TILE_SIZE, horizonY * TILE_SIZE);
  skyFillGraphics.fill(PERMANENT_BACKGROUND_COLORS.sky);

  // Cave region (y >= horizonY)
  caveFillGraphics.clear();
  caveFillGraphics.rect(0, horizonY * TILE_SIZE, worldWidth * TILE_SIZE, (worldHeight - horizonY) * TILE_SIZE);
  caveFillGraphics.fill(PERMANENT_BACKGROUND_COLORS.cave);
}

// Render background tiles (similar to renderTiles)
function renderBackgroundTiles(state: GameState, renderer: Renderer) {
  // Use frustum culling
  // Use dirty checking
  // Render with BACKGROUND_TILE_COLORS
}
```

### Step 6: Mining Support

```typescript
// Modify processMining in mining.ts
function processMining(state: GameState, gnomeEntity: Entity): GameState {
  const task = getTask(state, gnome.currentTaskId);
  const target = getMiningTarget(state, task.targetX, task.targetY);

  if (!target) return markTaskComplete(state, task);

  if (target.layer === 'foreground') {
    // Existing foreground mining logic
    return mineForgroundTile(state, target.entity);
  } else {
    // Background mining (no resource drop)
    return mineBackgroundTile(state, target.entity, task.targetX, task.targetY);
  }
}

function mineBackgroundTile(state: GameState, entity: Entity, x: number, y: number): GameState {
  const tile = getBackgroundTile(state, entity);
  const newDurability = tile.durability - GNOME_MINE_RATE;

  if (newDurability <= 0) {
    // Remove background tile (no resource drop per spec)
    state = removeBackgroundTile(state, entity);
    state = setBackgroundTileAt(state, x, y, null);
  } else {
    state = updateBackgroundTile(state, entity, t => ({
      ...t,
      durability: newDurability
    }));
  }

  return state;
}
```

### Step 7: Serialization

```typescript
// Update serialize/deserialize in state.ts
// Add backgroundTileGrid, backgroundTiles, horizonY
// Handle backwards compatibility for old saves
```

## Testing Checklist

- [ ] New world generates with background blocks
- [ ] Mining foreground reveals background behind
- [ ] Background blocks have darker color than foreground
- [ ] Sky visible above horizon when both layers empty
- [ ] Cave visible below horizon when both layers empty
- [ ] Background can be mined when foreground absent
- [ ] Save/load preserves all background state
- [ ] Old saves load without crashing (backwards compat)
- [ ] 60 FPS maintained with full visible grid

## Common Pitfalls

1. **Container order matters** - permanentBackground must be added first
2. **Grid dimensions** - backgroundTileGrid must match tileGrid size
3. **Entity creation** - background tiles need unique entity IDs
4. **Mining priority** - always check foreground before background
5. **No resource drops** - background mining doesn't yield items

## Performance Tips

1. Use dirty checking for background tiles (copy from foreground pattern)
2. Render permanent background as 2 fills, not individual tiles
3. Apply frustum culling to backgroundContainer
4. Pre-compute background colors at startup, not per-frame
