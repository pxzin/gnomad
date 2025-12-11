# Quickstart: Performance Optimization

**Date**: 2025-12-11
**Branch**: 005-performance-optimization

## Overview

This guide describes how to implement performance optimizations for the gnomad colony sim.

## Pre-requisites

- Branch `005-performance-optimization` checked out
- `pnpm install` executed
- `pnpm check` passing (baseline)
- Ability to spawn 100+ gnomes and create 2000+ tasks for testing

## Quick Test: Baseline Performance

Before implementing, establish baseline:

```bash
pnpm dev
# In game:
# 1. Create large dig area (select many tiles, press D)
# 2. Note FPS as gnomes are assigned tasks
# 3. Record FPS when ~40 gnomes + ~2000 tasks
```

## Step 1: Add Performance Config

Create `src/lib/config/performance.ts`:

```typescript
/**
 * Performance Configuration
 *
 * Tuning constants for optimization systems.
 */

/** Ticks between task assignment runs (60 ticks = 1 second) */
export const TASK_ASSIGNMENT_THROTTLE_TICKS = 10;

/** Max pathfinding attempts per gnome per assignment cycle */
export const MAX_PATHFIND_ATTEMPTS_PER_GNOME = 10;

/** Maximum paths to cache */
export const PATH_CACHE_MAX_SIZE = 1000;

/** Path cache entry TTL in ticks (5 seconds at 60 TPS) */
export const PATH_CACHE_TTL_TICKS = 300;
```

Update `src/lib/config/index.ts`:

```typescript
export * from './performance';
```

## Step 2: Implement Binary Heap

Create `src/lib/utils/binary-heap.ts`:

```typescript
/**
 * Binary Heap (Min-Heap)
 *
 * Efficient priority queue for A* pathfinding.
 */

export interface BinaryHeap<T> {
  push(item: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  readonly size: number;
  readonly isEmpty: boolean;
  clear(): void;
}

export function createBinaryHeap<T>(
  compareFn: (a: T, b: T) => number
): BinaryHeap<T> {
  const items: T[] = [];

  function siftUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (compareFn(items[index]!, items[parent]!) >= 0) break;
      [items[index], items[parent]] = [items[parent]!, items[index]!];
      index = parent;
    }
  }

  function siftDown(index: number): void {
    const length = items.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && compareFn(items[left]!, items[smallest]!) < 0) {
        smallest = left;
      }
      if (right < length && compareFn(items[right]!, items[smallest]!) < 0) {
        smallest = right;
      }
      if (smallest === index) break;

      [items[index], items[smallest]] = [items[smallest]!, items[index]!];
      index = smallest;
    }
  }

  return {
    push(item: T): void {
      items.push(item);
      siftUp(items.length - 1);
    },

    pop(): T | undefined {
      if (items.length === 0) return undefined;
      const result = items[0];
      const last = items.pop();
      if (items.length > 0 && last !== undefined) {
        items[0] = last;
        siftDown(0);
      }
      return result;
    },

    peek(): T | undefined {
      return items[0];
    },

    get size(): number {
      return items.length;
    },

    get isEmpty(): boolean {
      return items.length === 0;
    },

    clear(): void {
      items.length = 0;
    }
  };
}
```

## Step 3: Optimize Pathfinding

Update `src/lib/systems/pathfinding.ts`:

Replace array-based open set with binary heap:

```typescript
import { createBinaryHeap } from '$lib/utils/binary-heap';

// In findPath function:
const openSet = createBinaryHeap<PathNode>((a, b) => a.f - b.f);
const openSetMap = new Map<number, PathNode>(); // For O(1) lookup

// Replace openSet.sort() + shift() with:
const current = openSet.pop()!;
openSetMap.delete(current.x * 10000 + current.y);

// Replace openSet.findIndex() with:
const key = neighbor.x * 10000 + neighbor.y;
const existing = openSetMap.get(key);
if (existing) {
  if (g < existing.g) {
    existing.g = g;
    existing.f = f;
    existing.parent = current;
    // Note: heap update not implemented, but existing entry will be found
  }
  continue;
}

openSet.push(newNode);
openSetMap.set(key, newNode);
```

## Step 4: Throttle Task Assignment

Update `src/lib/systems/task-assignment.ts`:

```typescript
import { TASK_ASSIGNMENT_THROTTLE_TICKS, MAX_PATHFIND_ATTEMPTS_PER_GNOME } from '$lib/config/performance';

export function taskAssignmentSystem(state: GameState): GameState {
  // Throttle: only run every N ticks
  if (state.tick % TASK_ASSIGNMENT_THROTTLE_TICKS !== 0) {
    return state;
  }

  // ... rest of function with pathfind attempt limit
}
```

Add attempt limiting in `findReachableTask`:

```typescript
function findReachableTask(
  state: GameState,
  gnomeEntity: Entity,
  gnomeX: number,
  gnomeY: number,
  tasks: [Entity, Task][]
): ReachableTaskResult | null {
  let attempts = 0;

  for (let i = 0; i < tasks.length; i++) {
    if (attempts >= MAX_PATHFIND_ATTEMPTS_PER_GNOME) {
      break; // Stop trying after N failed pathfinds
    }

    const [taskEntity, task] = tasks[i]!;
    const path = findPath(state, gnomeX, gnomeY, task.targetX, task.targetY);
    attempts++;

    if (path && path.length > 0) {
      return { taskIndex: i, taskEntity, task, path };
    }
  }

  return null;
}
```

## Step 5: Optimize Task Marker Rendering

Update `src/lib/render/renderer.ts`:

```typescript
function renderTaskMarkers(renderer: Renderer, state: GameState): void {
  renderer.taskMarkerGraphics.clear();

  if (state.tasks.size === 0) return;

  // Batch all markers into a single path
  for (const [, task] of state.tasks) {
    renderer.taskMarkerGraphics.rect(
      task.targetX * TILE_SIZE + 2,
      task.targetY * TILE_SIZE + 2,
      TILE_SIZE - 4,
      TILE_SIZE - 4
    );
  }

  // Single stroke call for all markers
  renderer.taskMarkerGraphics.stroke({
    color: TASK_MARKER_COLOR,
    width: 2,
    alpha: TASK_MARKER_ALPHA
  });
}
```

## Step 6: Verify Optimizations

After each step:

```bash
pnpm check
```

Must pass with no new errors.

## Step 7: Test Performance

```bash
pnpm dev
# In game:
# 1. Create large dig area (2000+ tasks)
# 2. Spawn 100 gnomes
# 3. Verify FPS stays at 55+
# 4. Pan camera smoothly
# 5. Test task creation/cancellation responsiveness
```

## Success Criteria

- [ ] `pnpm check` passes
- [ ] Game maintains 55+ FPS with 100 gnomes and 2000 tasks
- [ ] Task assignment feels responsive (gnomes pick up tasks within ~0.5 seconds)
- [ ] Camera panning is smooth
- [ ] No memory leaks during extended play

## Rollback Plan

If issues arise:

1. `git stash` current changes
2. `git checkout main -- src/lib/systems/ src/lib/render/`
3. Investigate issue
4. Re-apply changes incrementally

## Performance Monitoring

Use browser DevTools Performance tab:
1. Start recording
2. Play game for 10 seconds
3. Stop recording
4. Look for long frames (>16ms)
5. Identify which functions take most time
