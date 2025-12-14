# Quickstart: Task Priority and Distance System

**Feature**: 008-task-priority
**Date**: 2025-12-14

## Overview

This feature refactors the task assignment system so gnomes consider both **priority** and **distance** when selecting tasks. Gnomes will now prefer:
1. Higher priority tasks first
2. Closer tasks within the same priority level
3. Older tasks (FIFO) when priority and distance are equal

Additionally, task markers will be color-coded by priority level.

## Prerequisites

- Gnomes At Work development environment set up
- Node.js 18+ and pnpm installed
- Feature branch `008-task-priority` checked out

## Quick Start

```bash
# 1. Ensure you're on the feature branch
git checkout 008-task-priority

# 2. Install dependencies (if needed)
pnpm install

# 3. Run development server
pnpm dev

# 4. Run type checking
pnpm check

# 5. Run tests
pnpm test
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/systems/task-assignment.ts` | Core algorithm: priority + distance sorting |
| `src/lib/config/colors.ts` | Priority color constants |
| `src/lib/render/renderer.ts` | Task marker rendering with colors |
| `src/lib/components/task.ts` | TaskPriority enum and labels |
| `src/lib/components/hud/SelectionPanel.svelte` | Priority display in UI |

## Implementation Steps

### Step 1: Add Priority Colors

In `src/lib/config/colors.ts`:

```typescript
import { TaskPriority } from '$lib/components/task';

export const TASK_PRIORITY_COLORS: Record<TaskPriority, number> = {
  [TaskPriority.Low]: 0x888888,     // Gray
  [TaskPriority.Normal]: 0x4a90d9,  // Blue
  [TaskPriority.High]: 0xffaa00,    // Yellow/Orange
  [TaskPriority.Urgent]: 0xff4444   // Red
};
```

### Step 2: Add Priority Labels

In `src/lib/components/task.ts`:

```typescript
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.Low]: 'Low',
  [TaskPriority.Normal]: 'Normal',
  [TaskPriority.High]: 'High',
  [TaskPriority.Urgent]: 'Urgent'
};
```

### Step 3: Modify Task Assignment

In `src/lib/systems/task-assignment.ts`, modify `findReachableTask()` to:
1. Group tasks by priority
2. Within each group, find the closest reachable task
3. Return the closest task from the highest priority group that has reachable tasks

### Step 4: Update Task Marker Rendering

In `src/lib/render/renderer.ts`, modify `renderTaskMarkers()` to:
1. Look up task priority from state
2. Use `TASK_PRIORITY_COLORS[priority]` instead of fixed `TASK_MARKER_COLOR`

### Step 5: Update Selection Panel

In `src/lib/components/hud/SelectionPanel.svelte`:
1. When a task tile is selected, show priority level
2. Display colored badge matching task marker color

## Testing

### Manual Testing

1. Create multiple Dig tasks at different distances
2. Spawn a gnome and observe it picks the closest task
3. Create tasks with different priorities
4. Verify gnome picks higher priority tasks even if farther

### Verification Checklist

- [ ] Gnomes select closest task when priorities are equal
- [ ] Gnomes select higher priority task even if farther
- [ ] Task markers display correct colors for each priority
- [ ] Selection panel shows priority name
- [ ] No performance regression (60 FPS maintained)
- [ ] FIFO tiebreaker works for equal priority+distance

## Color Reference

| Priority | Hex | Visual |
|----------|-----|--------|
| Urgent | `#ff4444` | Red |
| High | `#ffaa00` | Yellow/Orange |
| Normal | `#4a90d9` | Blue |
| Low | `#888888` | Gray |

## Troubleshooting

### Gnome not selecting closest task
- Verify path is actually shorter (check for obstacles)
- Confirm tasks have same priority level
- Check `MAX_PATHFIND_ATTEMPTS_PER_GNOME` limit not reached

### Colors not showing
- Clear browser cache
- Verify `TASK_PRIORITY_COLORS` imported correctly
- Check task entity has valid priority value

### Performance issues
- Ensure `TASK_ASSIGNMENT_THROTTLE_TICKS` is preserved
- Check pathfinding isn't running every frame
- Profile with browser dev tools
