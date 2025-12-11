# Game API Contract: Colony Simulation Core (MVP)

**Date**: 2025-12-11
**Branch**: `001-colony-sim-core`

## Overview

This document defines the internal API contracts between game systems. Since this is a browser-only game with no backend, these are TypeScript function signatures and event types that form the contract between modules.

---

## Game Loop API

### Core Loop Functions

```typescript
/**
 * Initialize a new game with the given seed.
 * Returns the initial game state.
 */
function createGame(seed: number): GameState;

/**
 * Load a game from serialized JSON.
 */
function loadGame(json: string): GameState;

/**
 * Save the current game state to JSON.
 */
function saveGame(state: GameState): string;

/**
 * Process one simulation tick.
 * Returns the updated state (immutable pattern).
 */
function tick(state: GameState, commands: Command[]): GameState;

/**
 * Start the game loop. Returns a stop function.
 */
function startGameLoop(
  state: GameState,
  renderer: Renderer,
  inputManager: InputManager
): () => void;
```

---

## World Generation API

```typescript
/**
 * Generate a new world with terrain.
 */
function generateWorld(
  width: number,
  height: number,
  seed: number
): { state: GameState; gnomeEntity: Entity };

/**
 * Get the tile entity at a position, or null if air.
 */
function getTileAt(state: GameState, x: number, y: number): Entity | null;

/**
 * Check if a position is within world bounds.
 */
function isInBounds(state: GameState, x: number, y: number): boolean;

/**
 * Check if a tile is solid (not air).
 */
function isSolid(state: GameState, x: number, y: number): boolean;
```

---

## Entity Management API

```typescript
/**
 * Create a new entity and return its ID.
 */
function createEntity(state: GameState): { state: GameState; entity: Entity };

/**
 * Destroy an entity and remove all its components.
 */
function destroyEntity(state: GameState, entity: Entity): GameState;

/**
 * Add a component to an entity.
 */
function addComponent<T extends keyof Components>(
  state: GameState,
  entity: Entity,
  componentType: T,
  data: Components[T]
): GameState;

/**
 * Get a component from an entity.
 */
function getComponent<T extends keyof Components>(
  state: GameState,
  entity: Entity,
  componentType: T
): Components[T] | undefined;

/**
 * Check if an entity has a component.
 */
function hasComponent<T extends keyof Components>(
  state: GameState,
  entity: Entity,
  componentType: T
): boolean;

/**
 * Component type mapping.
 */
interface Components {
  position: Position;
  velocity: Velocity;
  tile: Tile;
  gnome: Gnome;
  task: Task;
}
```

---

## Task System API

```typescript
/**
 * Create a new dig task at the specified tile.
 */
function createDigTask(
  state: GameState,
  x: number,
  y: number,
  priority: TaskPriority
): { state: GameState; taskEntity: Entity };

/**
 * Cancel a task. If assigned, gnome becomes idle.
 */
function cancelTask(state: GameState, taskEntity: Entity): GameState;

/**
 * Get all unassigned tasks sorted by priority (highest first), then creation time (oldest first).
 */
function getTaskQueue(state: GameState): Entity[];

/**
 * Assign the highest priority task to an idle gnome.
 */
function assignNextTask(state: GameState, gnomeEntity: Entity): GameState;

/**
 * Complete a task and clean up.
 */
function completeTask(state: GameState, taskEntity: Entity): GameState;
```

---

## Pathfinding API

```typescript
/**
 * Find a path from start to goal, avoiding solid tiles.
 * Returns array of positions, or null if no path exists.
 */
function findPath(
  state: GameState,
  start: Position,
  goal: Position
): Position[] | null;

/**
 * Find the closest reachable position adjacent to a target tile.
 * Used for mining (gnome stands next to tile, not on it).
 */
function findAdjacentPosition(
  state: GameState,
  from: Position,
  targetTile: Position
): Position | null;
```

---

## Mining System API

```typescript
/**
 * Process mining for a gnome that is in Mining state.
 * Reduces tile durability, destroys tile when done.
 */
function processMining(state: GameState, gnomeEntity: Entity): GameState;

/**
 * Get the mining rate for a gnome (base rate, can be modified by tools later).
 */
function getMiningRate(state: GameState, gnomeEntity: Entity): number;

/**
 * Destroy a tile at the given position, triggering gravity check.
 */
function destroyTile(state: GameState, x: number, y: number): GameState;
```

---

## Gravity System API

```typescript
/**
 * Check and apply gravity to all entities that need it.
 * Called after any tile is destroyed.
 */
function applyGravity(state: GameState): GameState;

/**
 * Check if an entity should fall (nothing solid below).
 */
function shouldFall(state: GameState, entity: Entity): boolean;
```

---

## Rendering API

```typescript
/**
 * Initialize the PixiJS renderer.
 */
function createRenderer(canvas: HTMLCanvasElement): Promise<Renderer>;

/**
 * Render the current game state.
 * @param alpha Interpolation factor for smooth animation (0-1)
 */
function render(
  renderer: Renderer,
  state: GameState,
  alpha: number
): void;

/**
 * Convert screen coordinates to world tile coordinates.
 */
function screenToTile(
  renderer: Renderer,
  state: GameState,
  screenX: number,
  screenY: number
): { x: number; y: number };

/**
 * Renderer interface.
 */
interface Renderer {
  app: Application;
  worldContainer: Container;
  render(state: GameState, alpha: number): void;
  destroy(): void;
}
```

---

## Input API

```typescript
/**
 * Create an input manager attached to a canvas.
 */
function createInputManager(
  canvas: HTMLCanvasElement,
  renderer: Renderer
): InputManager;

/**
 * Input manager interface.
 */
interface InputManager {
  /**
   * Get and clear pending commands.
   */
  flushCommands(currentTick: number): Command[];

  /**
   * Get current selection (tile coordinates).
   */
  getSelection(): { x: number; y: number }[] | null;

  /**
   * Destroy event listeners.
   */
  destroy(): void;
}
```

---

## Camera API

```typescript
/**
 * Pan the camera by a delta.
 */
function panCamera(state: GameState, dx: number, dy: number): GameState;

/**
 * Zoom the camera.
 */
function zoomCamera(state: GameState, delta: number): GameState;

/**
 * Smoothly interpolate camera to target position.
 */
function updateCamera(state: GameState, dt: number): GameState;

/**
 * Get the visible tile range for culling.
 */
function getVisibleTileRange(
  state: GameState,
  screenWidth: number,
  screenHeight: number
): { startX: number; startY: number; endX: number; endY: number };
```

---

## Game Events (for UI updates)

```typescript
/**
 * Events emitted by the game for UI consumption.
 * These are for reactive Svelte components to subscribe to.
 */
type GameEvent =
  | { type: 'TILE_DESTROYED'; x: number; y: number }
  | { type: 'GNOME_STATE_CHANGED'; entity: Entity; state: GnomeState }
  | { type: 'TASK_CREATED'; entity: Entity }
  | { type: 'TASK_COMPLETED'; entity: Entity }
  | { type: 'GAME_PAUSED' }
  | { type: 'GAME_RESUMED' }
  | { type: 'SPEED_CHANGED'; speed: GameSpeed };

/**
 * Event emitter for game events.
 */
interface GameEventEmitter {
  on(event: GameEvent['type'], callback: (event: GameEvent) => void): void;
  off(event: GameEvent['type'], callback: (event: GameEvent) => void): void;
  emit(event: GameEvent): void;
}
```

---

## Error Handling

```typescript
/**
 * Game errors that can occur.
 */
enum GameErrorCode {
  INVALID_TILE_POSITION = 'INVALID_TILE_POSITION',
  NO_PATH_FOUND = 'NO_PATH_FOUND',
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
}

class GameError extends Error {
  constructor(
    public code: GameErrorCode,
    message: string
  ) {
    super(message);
  }
}
```
