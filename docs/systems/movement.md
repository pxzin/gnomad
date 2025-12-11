# Movement System

**Date**: 2025-12-11

## Overview

Movement is handled by the physics system, which processes gnome movement along paths and handles gravity/falling.

## Gnome States

```typescript
enum GnomeState {
  Idle = 'idle',       // Standing still, no task
  Walking = 'walking', // Moving along path to target
  Mining = 'mining',   // At target, performing mining action
  Falling = 'falling'  // No ground below, falling
}
```

## State Transitions

```
┌─────────┐     task assigned     ┌─────────┐
│  Idle   │ ─────────────────────→│ Walking │
└─────────┘                       └─────────┘
     ↑                                 │
     │ task complete                   │ reached target
     │ or cancelled                    ↓
     │                            ┌─────────┐
     └────────────────────────────│ Mining  │
                                  └─────────┘
                                       │
                                       │ ground removed
                                       ↓
                                  ┌─────────┐
                                  │ Falling │
                                  └─────────┘
                                       │
                                       │ landed
                                       ↓
                                    (Idle)
```

## Walking Movement

When gnome is walking:

1. Get next waypoint from path
2. Calculate direction to waypoint
3. Move towards waypoint at `GNOME_SPEED` (0.1 tiles/tick = 6 tiles/second)
4. When within 0.1 tiles of waypoint:
   - Snap to exact position
   - Advance path index
   - If path complete, transition to Mining (if has task) or Idle

## Movement Speed

```typescript
const GNOME_SPEED = 0.1; // Tiles per tick
// At 60 ticks/second = 6 tiles/second
```

## Path Following

Gnomes store path data in their component:

```typescript
interface Gnome {
  path: Position[] | null;  // Array of waypoints
  pathIndex: number;        // Current waypoint index
}
```

Movement proceeds through waypoints sequentially until path is exhausted.

## Integration with Task System

1. Task assigned → path calculated to target
2. Gnome walks along path
3. On reaching destination → transition to Mining
4. On task complete → return to Idle

## Files

- `src/lib/systems/physics.ts`: Movement and gravity logic
- `src/lib/components/gnome.ts`: Gnome state and speed constants
- `src/lib/systems/task-assignment.ts`: Path calculation on task assignment
