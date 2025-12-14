# Data Model: Task Priority and Distance System

**Feature**: 008-task-priority
**Date**: 2025-12-14

## Entities

### Task (existing - no changes to structure)

The Task component already has all required fields for this feature.

```typescript
interface Task {
  type: TaskType;           // Dig, Collect
  targetX: number;          // Target tile X coordinate
  targetY: number;          // Target tile Y coordinate
  priority: TaskPriority;   // Already exists: Low, Normal, High, Urgent
  createdAt: number;        // Tick when created (for FIFO tiebreaker)
  assignedGnome: Entity | null;
  progress: number;
  targetEntity: Entity | null;
}
```

### TaskPriority (existing - no changes)

```typescript
enum TaskPriority {
  Low = 0,
  Normal = 1,
  High = 2,
  Urgent = 3
}
```

## New Configuration Constants

### Priority Color Mapping

```typescript
// In src/lib/config/colors.ts
const TASK_PRIORITY_COLORS: Record<TaskPriority, number> = {
  [TaskPriority.Low]: 0x888888,     // Gray
  [TaskPriority.Normal]: 0x4a90d9,  // Blue
  [TaskPriority.High]: 0xffaa00,    // Yellow/Orange
  [TaskPriority.Urgent]: 0xff4444   // Red
};
```

### Priority Labels

```typescript
// In src/lib/components/task.ts
const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.Low]: 'Low',
  [TaskPriority.Normal]: 'Normal',
  [TaskPriority.High]: 'High',
  [TaskPriority.Urgent]: 'Urgent'
};
```

## Sorting Algorithm

### Task Selection Order

Tasks are evaluated in this order:
1. **Priority** (descending): Urgent > High > Normal > Low
2. **Distance** (ascending): Path length in tiles (shorter = better)
3. **Creation Time** (ascending): FIFO for tasks with same priority and distance

### Pseudocode

```
function selectBestTask(gnome, availableTasks):
  // Group tasks by priority
  groups = groupBy(availableTasks, task.priority)

  // Process from highest priority down
  for priorityLevel in [Urgent, High, Normal, Low]:
    tasksInGroup = groups[priorityLevel]
    if tasksInGroup is empty: continue

    // Find closest reachable task in this group
    bestTask = null
    bestDistance = infinity

    for task in tasksInGroup:
      path = findPath(gnome.position, task.target)
      if path exists and path.length < bestDistance:
        bestTask = task
        bestDistance = path.length

    if bestTask found:
      return bestTask

  return null  // No reachable tasks
```

## State Transitions

### Task Assignment Flow

```
[Unassigned Task] --gnome idle--> [Assigned Task]
                   priority+distance
                   selection

[Assigned Task] --gnome arrives--> [In Progress]
                                   (no change)

[In Progress] --completed--> [Removed]
                             (no change)
```

### Priority Change Impact

- Changing priority of **unassigned** task: Affects next gnome selection
- Changing priority of **assigned** task: No immediate effect (gnome continues)
- Note: Priority change UI is deferred to future feature

## Validation Rules

1. **TaskPriority range**: Must be 0-3 (Low to Urgent)
2. **Distance**: Must be positive integer (path length) or infinity (unreachable)
3. **Tiebreaker**: createdAt must be unique per task (uses tick counter)

## Relationships

```
GameState
├── tasks: Map<Entity, Task>
├── gnomes: Map<Entity, Gnome>
└── positions: Map<Entity, Position>

Task ──references──> Position (via targetX, targetY)
Task ──assigned to──> Gnome (via assignedGnome)
Gnome ──working on──> Task (via currentTaskId)
```

## Rendering Data

### Task Marker Rendering

```typescript
interface TaskMarkerRenderData {
  x: number;           // Screen X position
  y: number;           // Screen Y position
  color: number;       // Priority-based color from TASK_PRIORITY_COLORS
  priority: TaskPriority;
}
```

The renderer looks up task priority from GameState.tasks and maps to color.
