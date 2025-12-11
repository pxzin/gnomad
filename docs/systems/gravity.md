# Gravity System

**Date**: 2025-12-11

## Overview

Gravity is handled within the physics system. Entities without ground below them fall until landing on a solid surface.

## Gravity Detection

Each tick, the physics system checks if a gnome should be falling:

```typescript
const tileBelow = Math.floor(position.y + 1);
const isOnGround = isSolid(state, Math.floor(position.x), tileBelow);
```

If not on ground and not already falling, gnome transitions to Falling state.

## Gravity Constants

```typescript
const GRAVITY = 0.02;        // Tiles per tick squared
const TERMINAL_VELOCITY = 0.5; // Maximum fall speed (tiles per tick)
```

At 60 ticks/second:
- Acceleration: 1.2 tiles/second squared
- Terminal velocity: 30 tiles/second

## Falling Mechanics

While falling:

1. Apply gravity to vertical velocity: `vy += GRAVITY`
2. Cap velocity at terminal velocity: `vy = min(vy, TERMINAL_VELOCITY)`
3. Update Y position: `y += vy`
4. Check for landing

## Landing Detection

```typescript
const newTileBelow = Math.floor(position.y + 1);
if (isSolid(state, position.x, newTileBelow)) {
  // Landed
  position.y = Math.floor(position.y);
  velocity.vy = 0;
  gnome.state = GnomeState.Idle;
}
```

Landing snaps the gnome to integer tile position and resets velocity.

## Triggered Falling

Gnomes can start falling when:

1. **Standing tile mined**: Ground below is destroyed
2. **Pathfinding through air**: Path may include falling sections
3. **Initial spawn**: If spawn position becomes invalid

## State After Landing

After landing, gnome returns to Idle state:
- If no task, remains idle
- If had task (path interrupted by fall), task assignment may reassign

## Integration with Mining

When a tile is mined:
1. Tile becomes Air
2. Next physics tick detects missing ground
3. Any entity above transitions to Falling
4. Lands on next solid surface below

## Files

- `src/lib/systems/physics.ts`: Gravity implementation
- `src/lib/components/gnome.ts`: GnomeState.Falling constant
