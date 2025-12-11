# Research: Performance Optimization

**Date**: 2025-12-11
**Branch**: 005-performance-optimization

## Executive Summary

Analysis of the codebase reveals **three critical performance bottlenecks** causing FPS to drop to zero with ~44 gnomes and 2000 tasks:

1. **Task Assignment**: O(N*M*P) complexity - N idle gnomes × M tasks × P pathfinding calls
2. **Pathfinding**: Unoptimized A* with O(N) open set operations per iteration
3. **Rendering**: Graphics objects recreated every frame (clear + redraw)

## 1. Task Assignment Analysis

### Current Implementation (`task-assignment.ts`)

```
For each idle gnome:
  Sort 2000 tasks by priority (O(N log N))
  For each task in sorted order:
    Run A* pathfinding to task (O(P) where P can be 1000 iterations)
    If path found, assign and break
```

**Complexity**: O(G * T * P) where:
- G = idle gnomes (~44)
- T = tasks to check (up to 2000)
- P = pathfinding iterations (up to 1000)

**Worst case**: 44 × 2000 × 1000 = **88 million operations per tick**

### Identified Issues

1. **Redundant Sorting**: `getUnassignedTasks()` sorts all 2000 tasks every tick, even if nothing changed
2. **Sequential Task Search**: Each gnome tries tasks in priority order, potentially running pathfinding hundreds of times
3. **No Spatial Awareness**: A gnome in the northwest corner may pathfind to tasks in the southeast before finding a nearby task

### Recommended Optimizations

| Optimization | Impact | Complexity |
|--------------|--------|------------|
| **Cache sorted tasks** - only re-sort when tasks added/removed | High | Low |
| **Throttle assignment** - run every N ticks, not every tick | High | Low |
| **Spatial indexing** - find nearby tasks first | High | Medium |
| **Limit pathfinding attempts** - stop after N failures per gnome | Medium | Low |
| **Batch pathfinding** - spread across multiple ticks | Medium | Medium |

**Decision**: Implement throttling + sorted task cache + limit pathfinding attempts (MVP). Add spatial indexing in future if needed.

## 2. Pathfinding Analysis

### Current Implementation (`pathfinding.ts`)

```
A* with:
- openSet as array (sorted each iteration)
- closedSet as Set<string>
- Max 1000 iterations
- findIndex for duplicate checking
```

**Issues**:

1. **Array sorting per iteration**: `openSet.sort()` is O(N log N) called up to 1000 times
2. **Linear duplicate search**: `openSet.findIndex()` is O(N) per neighbor
3. **String key generation**: `${x},${y}` creates garbage each iteration

### Benchmark Estimate

For a path of 50 nodes with average 5 neighbors:
- Sort calls: ~50 × O(50 log 50) = ~14,000 comparisons
- FindIndex calls: ~250 × O(50) = ~12,500 comparisons
- String allocations: ~250 strings

**With 44 gnomes pathfinding**: 44 × 26,500 = **1.1 million operations per tick**

### Recommended Optimizations

| Optimization | Impact | Complexity |
|--------------|--------|------------|
| **Binary heap for openSet** | Very High | Medium |
| **Map instead of array for openSet lookups** | High | Low |
| **Numeric keys instead of string** | Medium | Low |
| **Path caching** | High | Medium |
| **Jump Point Search (JPS)** | Very High | High |

**Decision**: Implement binary heap + numeric keys + Map for lookups (MVP). Consider JPS in future.

## 3. Rendering Analysis

### Current Implementation (`renderer.ts`)

```
renderTiles():
  For each visible tile:
    graphics.clear()
    graphics.rect()
    graphics.fill()

renderGnomes():
  For each gnome:
    graphics.clear()
    graphics.rect()
    graphics.fill()

renderTaskMarkers():
  taskMarkerGraphics.clear()
  For each task (2000):
    graphics.rect()
    graphics.stroke()
```

**Issues**:

1. **Task markers redrawn every frame**: 2000 rect() + stroke() calls even if nothing changed
2. **Tile graphics cleared and redrawn**: Even static tiles are cleared and redrawn
3. **Gnome graphics cleared and redrawn**: Even stationary gnomes are redrawn

### Recommended Optimizations

| Optimization | Impact | Complexity |
|--------------|--------|------------|
| **Dirty flags for tiles** - only redraw changed tiles | High | Low |
| **Dirty flags for gnomes** - only redraw moved gnomes | Medium | Low |
| **Batch task markers** - single graphics path | High | Low |
| **Sprite sheets** - replace Graphics with Sprites | Very High | Medium |

**Decision**: Implement dirty flags + batched task markers (MVP). Sprite sheets in future.

## 4. Additional Bottlenecks

### ECS World Operations

```typescript
// getEntitiesWithGnome iterates all gnomes
const gnomeEntities = getEntitiesWithGnome(state);
// Then filter again
return gnomeEntities.filter((entity) => {
  const gnome = state.gnomes.get(entity);
  return gnome && gnome.state === GnomeState.Idle;
});
```

**Issue**: Multiple iterations over same collection.

**Decision**: Cache idle gnome list with dirty flag.

### Game Loop

The game loop itself is efficient, but systems are run synchronously:

```typescript
for (const system of systems) {
  currentState = system(currentState);
}
```

**Decision**: Keep synchronous for now. Profile to determine if async/time-sliced execution is needed.

## 5. Implementation Strategy

### Phase 1: Quick Wins (P1 - MVP)

1. **Throttle task assignment** to every 10 ticks
2. **Cache sorted task list** - invalidate on task add/remove
3. **Limit pathfinding per gnome** to 10 attempts per assignment cycle
4. **Batch task marker rendering** - single path instead of N rects

**Expected Impact**: 10-50x improvement in task assignment, 2-5x in rendering

### Phase 2: Algorithmic Improvements (P2)

1. **Binary heap for A* open set**
2. **Map-based open set lookups**
3. **Dirty flags for tile/gnome rendering**

**Expected Impact**: 5-10x improvement in pathfinding

### Phase 3: Advanced Optimizations (P3)

1. **Path caching** - reuse paths when world unchanged
2. **Spatial indexing** - find nearby tasks efficiently

**Expected Impact**: Additional 2-5x improvement

### Phase 4: Future Considerations (P4)

1. **Sprite-based rendering** - replace Graphics with Sprites
2. **Jump Point Search** - faster pathfinding in open areas
3. **Web Workers** - offload pathfinding to separate thread

## 6. Constitution Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| Type Safety First | ✅ | All optimizations use TypeScript strict mode |
| Entity-Component Architecture | ✅ | No changes to ECS pattern |
| Documentation as Specification | ✅ | This research serves as spec |
| Simplicity and YAGNI | ✅ | Starting with simple optimizations first |
| Deterministic Game State | ✅ | Throttling uses tick counter, not wall clock |

## 7. Decisions Summary

| Decision | Rationale | Alternatives Rejected |
|----------|-----------|----------------------|
| Throttle to 10 ticks | Balance responsiveness vs CPU | 1 tick (too slow), 60 ticks (too unresponsive) |
| Binary heap over priority queue lib | No external dependencies | heap-js library (YAGNI) |
| Dirty flags over virtual DOM | Game-specific, simpler | React-like diffing (overkill) |
| Numeric keys over object pooling | Minimal garbage, simple | Object pool (premature optimization) |

## 8. Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| FPS with 44 gnomes + 2000 tasks | 0 | 55+ | FPS counter |
| FPS with 100 gnomes + 2000 tasks | N/A | 55+ | FPS counter |
| Task assignment time | TBD | <2ms | performance.now() |
| Single pathfind time | TBD | <0.5ms | performance.now() |
