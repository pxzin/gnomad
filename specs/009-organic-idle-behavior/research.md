# Research: Organic Idle Behavior for Gnomes

**Feature**: 009-organic-idle-behavior
**Date**: 2025-12-14

## Research Questions

### 1. Idle Behavior State Management

**Question**: Should idle behavior be a separate component or extend the existing Gnome component?

**Decision**: Extend existing Gnome component with optional `idleBehavior` field

**Rationale**:
- Gnome component already tracks state, path, and pathIndex
- Idle behavior is intrinsically tied to gnome lifecycle
- Adding a separate component would require additional Map storage and entity lookups
- Simpler to clear idle state when task is assigned (single component update)

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Separate IdleBehavior component in GameState | Over-engineering, adds complexity for component that's 1:1 with gnome |
| Finite State Machine class | Violates ECS principle (components should be pure data, no methods) |

### 2. Random Number Generation for Behavior Selection

**Question**: How to implement weighted random selection for behaviors while maintaining determinism?

**Decision**: Use seeded PRNG with game tick as additional entropy

**Approach**:
- Use existing `state.seed` combined with gnome entity ID and current tick
- Implement simple mulberry32 or similar seeded PRNG
- Generate number 0-100, map to behavior weights (0-50 = stroll, 50-85 = socialize, 85-100 = rest)

**Rationale**:
- Deterministic: same seed + tick + entity always produces same behavior
- Varied: different gnomes make different choices
- Replayable: save/load preserves behavior sequence

### 3. Colony Center Detection

**Question**: How to efficiently find the Storage building position for colony center?

**Decision**: Find first Storage building on each idle behavior check; cache position per tick

**Approach**:
```typescript
function findColonyCenter(state: GameState): Position | null {
  for (const [entity] of state.storages) {
    const pos = state.positions.get(entity);
    if (pos) return pos;
  }
  return null; // Fallback: gnome stays in place
}
```

**Rationale**:
- Storage count is typically 1-3, iteration is O(1) effectively
- No need for dedicated "colony center" entity
- Graceful degradation if no Storage exists

### 4. Stroll Destination Selection

**Question**: How to pick random walkable destinations within 8-tile radius?

**Decision**: Random angle + distance, then validate with pathfinding

**Approach**:
1. Generate random angle (0-2π) using seeded PRNG
2. Generate random distance (3-8 tiles) to avoid micro-movements
3. Calculate target position from colony center
4. Validate target is walkable (air tile above solid tile)
5. If invalid, retry up to 3 times, then choose "rest" instead

**Rationale**:
- Simple polar coordinate approach
- Pathfinding validation ensures gnomes don't walk into walls
- Limited retries prevent infinite loops
- Fallback to rest behavior handles edge cases gracefully

### 5. Socialization Partner Detection

**Question**: How to efficiently find nearby idle gnomes for socialization?

**Decision**: Simple distance check during behavior selection

**Approach**:
```typescript
function findNearbyIdleGnome(state: GameState, gnomeEntity: Entity, maxDistance: number): Entity | null {
  const gnomePos = state.positions.get(gnomeEntity);
  if (!gnomePos) return null;

  for (const [otherEntity, otherGnome] of state.gnomes) {
    if (otherEntity === gnomeEntity) continue;
    if (otherGnome.state !== GnomeState.Idle) continue;
    if (otherGnome.idleBehavior?.type === 'socializing') continue; // Already in conversation

    const otherPos = state.positions.get(otherEntity);
    if (!otherPos) continue;

    const distance = Math.abs(gnomePos.x - otherPos.x) + Math.abs(gnomePos.y - otherPos.y);
    if (distance <= maxDistance) return otherEntity;
  }
  return null;
}
```

**Rationale**:
- O(n) where n = gnome count (~10), very fast
- Manhattan distance sufficient for proximity check
- Filters out gnomes already socializing to prevent 3+ way conversations

### 6. Socialization Visual Indicator

**Question**: How to render the "..." or speech bubble indicator?

**Decision**: Simple "..." text rendered above socializing gnomes using PixiJS Graphics

**Approach**:
- During `renderGnomes()`, check if gnome is socializing
- If socializing, draw small ellipsis indicator above gnome sprite
- Use existing TASK_MARKER_ALPHA for semi-transparency
- No new sprite/texture needed (keep it simple for MVP)

**Rationale**:
- Consistent with existing marker rendering approach
- No new assets required
- Clear visual distinction from working gnomes

### 7. Idle Behavior Throttling

**Question**: How often should idle behavior system run?

**Decision**: Same throttle as task assignment (every 10 ticks = ~167ms at 60 TPS)

**Approach**:
- Use existing `TASK_ASSIGNMENT_THROTTLE_TICKS` constant (10 ticks)
- Run idle behavior system right after task assignment in game loop
- This ensures gnomes get tasks first, then idle behaviors fill gaps

**Rationale**:
- Consistent with existing performance patterns
- 167ms response time is imperceptible for idle animations
- Prevents CPU overhead from per-tick idle calculations

### 8. Movement Speed Implementation

**Question**: How to implement 50% speed for casual strolls?

**Decision**: Add `GNOME_IDLE_SPEED` constant, check gnome state in movement system

**Approach**:
```typescript
// In config/physics.ts
export const GNOME_IDLE_SPEED = GNOME_SPEED * 0.5; // 0.05 tiles/tick

// In physics system movement calculation
const speed = gnome.idleBehavior?.type === 'strolling'
  ? GNOME_IDLE_SPEED
  : GNOME_SPEED;
```

**Rationale**:
- Single constant change, easy to tune
- Clear speed distinction in movement code
- No changes to pathfinding (just slower traversal)

## Implementation Notes

### Key Files to Modify

1. **`src/lib/components/gnome.ts`**
   - Add `IdleBehavior` interface with type union
   - Add optional `idleBehavior` field to Gnome interface
   - Add new GnomeState values if needed (or reuse Idle + Walking)

2. **`src/lib/systems/idle-behavior.ts`** (NEW)
   - Main system: detect idle gnomes, assign behaviors
   - Helper functions: findColonyCenter, selectRandomDestination, findNearbyIdleGnome
   - Behavior update logic: progress strolls, end socializations

3. **`src/lib/systems/task-assignment.ts`**
   - Clear `idleBehavior` when assigning task to gnome
   - No other changes needed (task assignment already handles state transition)

4. **`src/lib/systems/physics.ts`**
   - Apply GNOME_IDLE_SPEED for strolling gnomes

5. **`src/lib/render/renderer.ts`**
   - Add socialization indicator rendering in renderGnomes()

6. **`src/lib/game/loop.ts`**
   - Add idleBehaviorSystem to update pipeline (after task-assignment)

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Performance regression | Use existing throttling, profile before/after |
| Non-deterministic behavior | All randomness uses seeded PRNG |
| Task assignment delay | Idle behavior clears instantly on task assignment |
| Pathfinding overhead | Reuse existing pathfinding with retry limit |

## Conclusion

No NEEDS CLARIFICATION items remain. All research questions resolved with clear implementation path. Ready for Phase 1 design.
