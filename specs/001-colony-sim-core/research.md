# Research: Colony Simulation Core (MVP)

**Date**: 2025-12-11
**Branch**: `001-colony-sim-core`

## Executive Summary

This document captures technical decisions for the MVP implementation. All "NEEDS CLARIFICATION" items from planning have been resolved through research into best practices for the chosen tech stack.

---

## 1. PixiJS v8 Integration with SvelteKit

### Decision
Use PixiJS v8 Application class with manual lifecycle management outside of Svelte reactivity.

### Rationale
- PixiJS v8 uses a new async initialization pattern (`await Application.init()`)
- Svelte's reactivity would cause unnecessary re-renders if PixiJS objects were reactive
- Canvas element should be managed imperatively for 60 FPS performance

### Implementation Pattern
```typescript
// In +page.svelte onMount
import { Application } from 'pixi.js';

let app: Application;

onMount(async () => {
  app = new Application();
  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    preference: 'webgpu', // Falls back to WebGL2 automatically
    backgroundColor: 0x1a1a2e,
  });

  container.appendChild(app.canvas);

  return () => app.destroy(true);
});
```

### Alternatives Considered
- **svelte-pixi**: Not updated for PixiJS v8, incompatible
- **Reactive PixiJS wrapper**: Would add overhead and complexity without benefit

---

## 2. ECS Architecture for Game State

### Decision
Implement a minimal custom ECS using TypeScript Maps, not an external ECS library.

### Rationale
- Constitution requires composition over inheritance
- External ECS libraries (bitecs, miniplex) add complexity for MVP scale
- Simple Map-based storage sufficient for 1 gnome + 5000 tiles
- Full typing maintained with TypeScript generics

### Implementation Pattern
```typescript
// Entity is just a number
type Entity = number;

// Components are plain interfaces
interface Position { x: number; y: number; }
interface Tile { type: TileType; durability: number; }
interface Gnome { state: GnomeState; taskId: Entity | null; }

// World holds component maps
interface World {
  nextEntityId: number;
  positions: Map<Entity, Position>;
  tiles: Map<Entity, Tile>;
  gnomes: Map<Entity, Gnome>;
  // ... other component maps
}

// Systems are pure functions
function movementSystem(world: World, dt: number): void {
  // Iterate entities with position + velocity
}
```

### Alternatives Considered
- **bitecs**: High performance but complex API, TypeScript support weak
- **miniplex**: Good TypeScript but adds dependency for simple needs
- **Class-based entities**: Violates constitution (composition over inheritance)

---

## 3. Tile Rendering Strategy

### Decision
Use PixiJS Graphics for MVP (colored rectangles), prepare for Sprite batching later.

### Rationale
- MVP uses colored squares, not sprites—Graphics is simpler
- PixiJS v8 Graphics is GPU-accelerated, sufficient for 5000 tiles
- Migration path: replace Graphics with Sprite + spritesheet when assets ready

### Implementation Pattern
```typescript
// MVP: Colored rectangles
function renderTile(graphics: Graphics, tile: Tile, x: number, y: number) {
  const color = TILE_COLORS[tile.type]; // dirt: 0x8B4513, stone: 0x808080
  graphics.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  graphics.fill(color);
}

// Only render visible tiles (viewport culling)
function renderWorld(world: World, viewport: Viewport, graphics: Graphics) {
  const { startX, startY, endX, endY } = getVisibleTileRange(viewport);
  graphics.clear();
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const entity = world.tileGrid[y][x];
      if (entity !== null) {
        const tile = world.tiles.get(entity)!;
        renderTile(graphics, tile, x, y);
      }
    }
  }
}
```

### Alternatives Considered
- **Individual Sprite per tile**: Too many draw calls for 5000+ tiles
- **Tilemap library (pixi-tilemap)**: Not yet compatible with PixiJS v8
- **Canvas 2D**: Would lose WebGPU benefits, harder to add effects later

---

## 4. Pathfinding Algorithm

### Decision
Use A* with Manhattan distance heuristic on the tile grid.

### Rationale
- A* is optimal for grid-based pathfinding with varying costs
- Manhattan distance is admissible for 4-directional movement
- Simple to implement, well-understood, debuggable

### Implementation Pattern
```typescript
interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // g + h
  parent: PathNode | null;
}

function findPath(
  world: World,
  start: Position,
  goal: Position
): Position[] | null {
  // A* implementation with:
  // - Binary heap for open set (performance)
  // - Set for closed set
  // - Neighbors: up, down, left, right (4-directional)
  // - Cost: 1 for air/mined, Infinity for solid
}
```

### Alternatives Considered
- **Dijkstra**: No heuristic, slower for long paths
- **Jump Point Search**: Overkill for small MVP world
- **Hierarchical pathfinding**: Premature optimization

---

## 5. World Generation (MVP)

### Decision
Simple layered generation: surface level with air above, dirt layer, stone below.

### Rationale
- MVP needs visible terrain variation, not complex caves
- Deterministic with seed for reproducibility (constitution requirement)
- Easy to extend later with Perlin noise for surface variation

### Implementation Pattern
```typescript
function generateWorld(width: number, height: number, seed: number): World {
  const rng = createSeededRNG(seed);
  const surfaceLevel = Math.floor(height * 0.3); // Top 30% is air

  const world = createEmptyWorld();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let tileType: TileType;
      if (y < surfaceLevel) {
        tileType = TileType.Air;
      } else if (y < surfaceLevel + 10) {
        tileType = TileType.Dirt;
      } else {
        tileType = TileType.Stone;
      }

      const entity = createEntity(world);
      addComponent(world, entity, 'tile', { type: tileType, durability: DURABILITY[tileType] });
      world.tileGrid[y][x] = entity;
    }
  }

  return world;
}
```

### Alternatives Considered
- **Perlin noise surface**: Adds complexity, save for post-MVP
- **Cave generation**: Out of scope for MVP (1 gnome, basic digging)
- **Biomes**: Future feature

---

## 6. Game Loop Architecture

### Decision
Fixed timestep game loop (60 ticks/second) with render interpolation.

### Rationale
- Constitution requires tick-based deterministic simulation
- Fixed timestep ensures reproducible game state
- Render can interpolate between ticks for smooth visuals

### Implementation Pattern
```typescript
const TICK_RATE = 60;
const TICK_DURATION = 1000 / TICK_RATE;

function gameLoop(world: World, renderer: Renderer) {
  let lastTime = performance.now();
  let accumulator = 0;

  function loop(currentTime: number) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    accumulator += deltaTime;

    // Fixed timestep updates
    while (accumulator >= TICK_DURATION) {
      updateWorld(world, TICK_DURATION);
      world.tick++;
      accumulator -= TICK_DURATION;
    }

    // Render with interpolation factor
    const alpha = accumulator / TICK_DURATION;
    renderer.render(world, alpha);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
```

### Alternatives Considered
- **Variable timestep**: Non-deterministic, violates constitution
- **Web Workers for simulation**: Adds complexity, premature for MVP

---

## 7. Seeded Random Number Generator

### Decision
Use a simple mulberry32 PRNG seeded at world creation.

### Rationale
- Constitution requires no `Math.random()` in game logic
- mulberry32 is fast, simple, well-tested, deterministic
- Seed stored in game state for save/load reproducibility

### Implementation Pattern
```typescript
function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Usage
const rng = mulberry32(worldSeed);
const randomValue = rng(); // 0-1, deterministic
```

### Alternatives Considered
- **seedrandom library**: External dependency for simple need
- **crypto.getRandomValues**: Not seedable, inappropriate

---

## 8. Input Handling

### Decision
Event-driven input with command queue processed once per tick.

### Rationale
- Separates input collection from game logic
- Commands are discrete events (deterministic)
- Allows pause state to still queue commands

### Implementation Pattern
```typescript
interface Command {
  type: 'SELECT_TILE' | 'DIG' | 'PAN_CAMERA' | 'PAUSE' | 'SPEED';
  payload: unknown;
  tick: number; // When command was issued
}

class InputManager {
  private commandQueue: Command[] = [];

  queueCommand(type: Command['type'], payload: unknown, tick: number) {
    this.commandQueue.push({ type, payload, tick });
  }

  flushCommands(): Command[] {
    const commands = [...this.commandQueue];
    this.commandQueue = [];
    return commands;
  }
}
```

### Alternatives Considered
- **Direct state mutation on input**: Non-deterministic
- **Reactive Svelte stores**: Would couple input to UI framework

---

## Summary of Decisions

| Topic | Decision | Key Reason |
|-------|----------|------------|
| PixiJS integration | Manual lifecycle, no wrapper | Performance, v8 compatibility |
| ECS | Custom Maps, no library | Simplicity, full typing |
| Tile rendering | Graphics (colored rects) | MVP simplicity, easy migration |
| Pathfinding | A* with Manhattan | Optimal, well-understood |
| World gen | Simple layers | MVP scope |
| Game loop | Fixed 60 tick/s | Determinism (constitution) |
| RNG | mulberry32 seeded | Determinism (constitution) |
| Input | Command queue | Determinism, pausable |

All technical unknowns resolved. Ready for Phase 1: Data Model & Contracts.
