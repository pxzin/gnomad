# Performance API Contracts

**Date**: 2025-12-11
**Branch**: 005-performance-optimization

## Binary Heap API

### Interface

```typescript
interface BinaryHeap<T> {
  /** Insert item maintaining heap property. O(log n) */
  push(item: T): void;

  /** Remove and return minimum item. O(log n) */
  pop(): T | undefined;

  /** View minimum item without removing. O(1) */
  peek(): T | undefined;

  /** Number of items in heap */
  readonly size: number;

  /** Check if heap is empty */
  readonly isEmpty: boolean;

  /** Remove all items. O(1) */
  clear(): void;
}
```

### Factory

```typescript
function createBinaryHeap<T>(
  compareFn: (a: T, b: T) => number
): BinaryHeap<T>;
```

### Usage Example

```typescript
const heap = createBinaryHeap<PathNode>((a, b) => a.f - b.f);
heap.push({ x: 0, y: 0, f: 10, g: 5, h: 5, parent: null });
const min = heap.pop(); // Returns node with lowest f
```

---

## Task Cache API

### Interface

```typescript
interface TaskCache {
  /** Get sorted tasks, rebuilding if dirty */
  getSortedTasks(state: GameState): [Entity, Task][];

  /** Mark cache as needing rebuild */
  invalidate(): void;

  /** Check if cache needs rebuild */
  readonly isDirty: boolean;
}
```

### Factory

```typescript
function createTaskCache(): TaskCache;
```

### Integration Points

- Call `invalidate()` in command handlers for `dig` and `cancelDig`
- Call `getSortedTasks()` in `taskAssignmentSystem`

---

## Path Cache API

### Interface

```typescript
interface PathCache {
  /** Get cached path or null if not cached/invalid */
  get(
    startX: number, startY: number,
    endX: number, endY: number
  ): Position[] | null;

  /** Store computed path */
  set(
    startX: number, startY: number,
    endX: number, endY: number,
    path: Position[]
  ): void;

  /** Invalidate all paths (call on world change) */
  invalidateAll(): void;

  /** Number of cached paths */
  readonly size: number;
}
```

### Factory

```typescript
function createPathCache(maxSize: number): PathCache;
```

### Invalidation Triggers

- Tile destroyed (mining complete)
- Tile created (building)
- Any world topology change

---

## Dirty Flags API

### Interface

```typescript
interface RenderDirtyFlags {
  /** Mark a tile as needing redraw */
  markTileDirty(entity: Entity): void;

  /** Mark a gnome as needing redraw */
  markGnomeDirty(entity: Entity): void;

  /** Mark task markers as needing redraw */
  markTasksDirty(): void;

  /** Mark selection as needing redraw */
  markSelectionDirty(): void;

  /** Get and clear dirty tiles */
  consumeDirtyTiles(): Set<Entity>;

  /** Get and clear dirty gnomes */
  consumeDirtyGnomes(): Set<Entity>;

  /** Check and clear tasks dirty flag */
  consumeTasksDirty(): boolean;

  /** Check and clear selection dirty flag */
  consumeSelectionDirty(): boolean;

  /** Mark everything as dirty (for initial render) */
  markAllDirty(): void;
}
```

### Factory

```typescript
function createRenderDirtyFlags(): RenderDirtyFlags;
```

### Integration Points

- Physics system marks gnomes dirty on position change
- Mining system marks tiles dirty on destruction
- Command handler marks tasks dirty on dig/cancelDig
- Selection handler marks selection dirty

---

## Throttled System API

### Pattern

```typescript
function createThrottledSystem(
  system: SystemUpdate,
  intervalTicks: number
): SystemUpdate;
```

### Usage

```typescript
const throttledTaskAssignment = createThrottledSystem(
  taskAssignmentSystem,
  TASK_ASSIGNMENT_THROTTLE_TICKS
);

// In game loop
systems = [
  physicsSystem,
  miningSystem,
  throttledTaskAssignment  // Only runs every N ticks
];
```

---

## Performance Config API

### Constants

```typescript
// src/lib/config/performance.ts

/** Ticks between task assignment runs */
export const TASK_ASSIGNMENT_THROTTLE_TICKS = 10;

/** Max pathfinding attempts per gnome per assignment cycle */
export const MAX_PATHFIND_ATTEMPTS_PER_GNOME = 10;

/** Maximum paths to cache */
export const PATH_CACHE_MAX_SIZE = 1000;

/** Path cache entry TTL in ticks */
export const PATH_CACHE_TTL_TICKS = 300;
```

---

## Optimized Pathfinding API

### Enhanced findPath

```typescript
function findPath(
  state: GameState,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  options?: PathfindingOptions
): Position[] | null;

interface PathfindingOptions {
  /** Use path cache (default: true) */
  useCache?: boolean;
  /** Max iterations (default: 1000) */
  maxIterations?: number;
}
```

### With Cache Integration

```typescript
function findPathCached(
  state: GameState,
  cache: PathCache,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): Position[] | null {
  // Check cache first
  const cached = cache.get(startX, startY, endX, endY);
  if (cached) return cached;

  // Compute and cache
  const path = findPath(state, startX, startY, endX, endY);
  if (path) {
    cache.set(startX, startY, endX, endY, path);
  }
  return path;
}
```
