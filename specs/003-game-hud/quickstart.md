# Quickstart: Game HUD/UI

**Feature**: 003-game-hud | **Date**: 2025-12-11

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Repository cloned and on branch `003-game-hud`

## Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open http://localhost:5173 to see the game.

## File Locations

### New Files to Create

```
src/lib/components/hud/
├── HudOverlay.svelte      # Main HUD container
├── TopBar.svelte          # Status counters + time controls
├── BottomBar.svelte       # Selection panel + action bar
├── SelectionPanel.svelte  # Selection info display
├── ActionBar.svelte       # Contextual action buttons
└── types.ts               # TypeScript interfaces

src/lib/game/
└── selection.ts           # Selection utility functions (new)
```

### Existing Files to Modify

```
src/lib/game/state.ts      # Add selectedGnomes array
src/lib/game/commands.ts   # Add gnome selection commands
src/lib/game/command-processor.ts  # Handle new commands
src/lib/input/handler.ts   # Add gnome click detection
src/lib/components/Game.svelte  # Integrate HudOverlay
```

## Implementation Order

### Phase 1: State Extension
1. Add `selectedGnomes: Entity[]` to GameState
2. Add `SELECT_GNOMES` and `CLEAR_SELECTION` commands
3. Add command processors

### Phase 2: HUD Components
1. Create HudOverlay.svelte with pointer-events pattern
2. Create TopBar.svelte with counters and speed buttons
3. Create BottomBar.svelte container
4. Create SelectionPanel.svelte with info display
5. Create ActionBar.svelte with Dig button

### Phase 3: Selection System
1. Add gnome click detection in handler.ts
2. Add air tile filtering in getTilesInRect
3. Implement Shift+click toggle for gnomes

### Phase 4: Integration
1. Replace inline HUD in Game.svelte with HudOverlay
2. Wire up keyboard shortcuts to HUD buttons
3. Test all selection scenarios

## Quick Commands

```bash
# Type checking
pnpm check

# Run tests
pnpm test

# Lint
pnpm lint

# Format
pnpm format
```

## Key Patterns

### Svelte 5 Component Template

```svelte
<script lang="ts">
  import type { TopBarProps } from './types';

  let { tick, speed, isPaused, gnomeCount, taskProgress, onSpeedChange, onPauseToggle }: TopBarProps = $props();

  // Derived values
  let speedLabel = $derived(speed === 0.5 ? '1x' : speed === 1 ? '2x' : '3x');
</script>

<div class="top-bar">
  <!-- Content -->
</div>

<style>
  .top-bar {
    pointer-events: auto;
  }
</style>
```

### Command Emission

```typescript
import { queueCommand } from '../game/loop';
import { selectGnomes, clearSelection } from '../game/commands';

// In component
function handleGnomeClick(gnomeId: Entity, shiftKey: boolean) {
  queueCommand(gameLoop, selectGnomes([gnomeId], shiftKey));
}
```

### Selection Info Computation

```typescript
import { computeSelectionInfo, computeActionButtonState } from './types';

// In component
let selectionInfo = $derived(computeSelectionInfo(gameLoop.state));
let actionButton = $derived(computeActionButtonState(gameLoop.state));
```

## Testing

### Manual Test Checklist

- [ ] Top bar shows gnome count, task progress, tick
- [ ] Speed buttons (1x/2x/3x) change game speed
- [ ] Pause button stops tick counter
- [ ] Keyboard shortcuts work (Space, 1, 2, 3)
- [ ] Clicking tile selects it
- [ ] Dragging selects rectangle of tiles
- [ ] Air tiles excluded from selection
- [ ] Clicking gnome selects it
- [ ] Shift+click gnome toggles selection
- [ ] Selection panel shows correct info
- [ ] Dig button creates tasks
- [ ] Cancel Dig button removes tasks
- [ ] Escape clears selection
- [ ] HUD doesn't block game clicks

### Unit Test Files

```
tests/unit/hud/
├── selection.test.ts       # Selection utility tests
├── TopBar.test.ts          # TopBar component tests
└── ActionBar.test.ts       # ActionBar logic tests
```

## Troubleshooting

### HUD Blocks Game Clicks

Check that HUD container has `pointer-events: none` and interactive elements have `pointer-events: auto`.

### State Not Updating

Ensure you're using Svelte 5 runes (`$state`, `$derived`) not Svelte 4 syntax.

### Gnome Click Not Working

Verify `findGnomeAtTile()` is called before tile selection starts in `onMouseDown`.

### Type Errors

Run `pnpm check` to see TypeScript errors. Ensure all new types are exported from `types.ts`.
