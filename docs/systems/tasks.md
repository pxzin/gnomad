# Task System

**Date**: 2025-12-11

## Overview

The task system manages player-issued work orders for gnomes. In the MVP, only Dig tasks are supported.

## Task Component

```typescript
interface Task {
  type: TaskType;           // Task type (Dig for MVP)
  targetX: number;          // Target tile X coordinate
  targetY: number;          // Target tile Y coordinate
  priority: TaskPriority;   // Execution priority (Low, Normal, High, Urgent)
  createdAt: number;        // Tick when created (for FIFO ordering)
  assignedGnome: Entity | null;  // Assigned gnome entity, or null
  progress: number;         // 0-100 completion percentage
}
```

## Task Lifecycle

```
Created → Queued → Assigned → In Progress → Completed
                      │                         │
                      └──────── Cancelled ──────┘
```

1. **Created**: Player issues DIG command for selected tiles
2. **Queued**: Task entity created with `assignedGnome: null`
3. **Assigned**: Task assignment system matches task to idle gnome
4. **In Progress**: Gnome walks to target and performs action
5. **Completed**: Task removed, gnome returns to idle

## Task Priority

Tasks are executed in priority order:

```typescript
enum TaskPriority {
  Low = 0,
  Normal = 1,    // Default for player-issued tasks
  High = 2,
  Urgent = 3
}
```

Within the same priority, tasks are processed FIFO based on `createdAt` tick.

## Task Assignment

The task assignment system (`taskAssignmentSystem`) runs each tick:

1. Find all idle gnomes (state = Idle, no current task)
2. Get unassigned tasks sorted by priority (desc) then creation time (asc)
3. For each idle gnome:
   - Find best available task
   - Calculate path from gnome to task target
   - If path exists, assign task to gnome
   - Update gnome state to Walking with computed path

## Task Creation (DIG Command)

When player issues DIG command:

1. For each selected tile:
   - Check if tile is valid and diggable (not air)
   - Check if task already exists for this tile
   - Create new task entity with Dig type
2. Clear tile selection

## Task Completion

Tasks are completed in the mining system when:
- Tile durability reaches 0
- Tile becomes air

On completion:
- Task entity is removed
- Gnome state returns to Idle
- Gnome becomes available for new tasks

## Task Cancellation

Tasks can be cancelled via CANCEL_TASK command:
- If assigned to a gnome, clears gnome's task reference
- Removes task entity from state
- Gnome returns to idle

## Files

- `src/lib/components/task.ts`: Task component interface
- `src/lib/systems/task-assignment.ts`: Task assignment system
- `src/lib/game/command-processor.ts`: DIG command handling
