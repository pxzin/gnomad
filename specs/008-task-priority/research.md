# Research: Task Priority and Distance System

**Feature**: 008-task-priority
**Date**: 2025-12-14

## Research Questions

### 1. Distance Calculation Strategy

**Question**: Should we use Manhattan distance, Euclidean distance, or actual path length for sorting?

**Decision**: Use actual path length (number of tiles in A* path)

**Rationale**:
- Manhattan/Euclidean distance ignores obstacles and terrain
- A gnome might be "close" in straight-line distance but need a long path around walls
- Path length already computed during `findPath()` - no extra calculation needed
- Matches the existing `findReachableTask()` behavior which already computes paths

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Manhattan distance | Ignores walls/obstacles, could assign gnome to "close" task requiring long path |
| Euclidean distance | Same issue + floating point complexity |
| Pre-computed distance map | Over-engineering for current scale, adds memory overhead |

### 2. Sorting Algorithm Approach

**Question**: How to efficiently sort tasks by priority + distance?

**Decision**: Two-phase approach within existing `findReachableTask()` function

**Approach**:
1. Pre-sort tasks by priority (descending) - already done in `getUnassignedTasks()`
2. Group tasks by priority level
3. For each priority group (starting from highest), compute paths and select closest reachable
4. If no task in current priority is reachable, move to next priority group

**Rationale**:
- Maintains priority as primary factor (FR-001)
- Computes distance only for relevant priority group (performance)
- Naturally handles unreachable tasks (FR-005)
- Compatible with existing `MAX_PATHFIND_ATTEMPTS_PER_GNOME` throttling

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Sort all tasks by weighted score (priority * weight + distance) | Complex weighting, priority should always dominate |
| Compute all paths upfront then sort | Performance hit for large task counts |
| Cache path distances | Over-engineering, paths change as terrain is modified |

### 3. Performance Optimization

**Question**: How to prevent performance regression with distance calculations?

**Decision**: Leverage existing throttling and pathfinding limits

**Approach**:
- Keep `TASK_ASSIGNMENT_THROTTLE_TICKS` (only run every N ticks)
- Keep `MAX_PATHFIND_ATTEMPTS_PER_GNOME` limit
- Within a priority group, compute paths lazily and track best-so-far
- Early exit when a reachable task is found in highest priority group

**Rationale**:
- Existing performance budget is proven stable at 60 FPS
- Distance sorting adds minimal overhead (comparing integers)
- Pathfinding is already the expensive operation and is already throttled

### 4. Color Palette for Priority Markers

**Question**: Which exact hex colors for priority levels?

**Decision**: Use semantic color scheme matching urgency perception

| Priority | Color | Hex Value | Rationale |
|----------|-------|-----------|-----------|
| Urgent | Red | `0xff4444` | Universal danger/alert color |
| High | Yellow/Orange | `0xffaa00` | Warning, attention needed |
| Normal | Blue | `0x4a90d9` | Neutral, standard operations |
| Low | Gray | `0x888888` | De-emphasized, background |

**Rationale**:
- Red-Yellow-Blue-Gray follows traffic light mental model
- Colors are distinct even at small marker sizes
- Consistent with existing game color palette (steel blue for Storage)
- Note: Future accessibility improvements in backlog (008-colorblind-priority-indicators.md)

### 5. Selection Panel Display

**Question**: How to show priority in selection panel?

**Decision**: Add priority label with color indicator to task selection info

**Approach**:
- When task tile is selected, show "Priority: [Level]" with colored badge
- Consistent with existing SelectionPanel patterns
- No interactive controls (priority tool is deferred)

## Implementation Notes

### Key Files to Modify

1. **`src/lib/systems/task-assignment.ts`**
   - Modify `findReachableTask()` to sort by distance within priority groups
   - Add helper function to group tasks by priority

2. **`src/lib/config/colors.ts`**
   - Add `TASK_PRIORITY_COLORS` mapping
   - Keep existing `TASK_MARKER_COLOR` for backwards compatibility during transition

3. **`src/lib/render/renderer.ts`**
   - Modify `renderTaskMarkers()` to use priority-based colors
   - Look up task priority from state when rendering

4. **`src/lib/components/hud/SelectionPanel.svelte`**
   - Add priority display when task tile is selected

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Performance regression | Keep existing throttling, measure before/after |
| Breaking existing behavior | Existing tests + manual playtest |
| Color conflicts with terrain | Chosen colors are distinct from tile types |
| Path computation overhead | Early exit on first reachable task in priority group |

## Conclusion

No NEEDS CLARIFICATION items remain. All research questions resolved with clear implementation path. Ready for Phase 1 design.
