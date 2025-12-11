# Research: Game HUD/UI

**Feature**: 003-game-hud | **Date**: 2025-12-11 | **Status**: Complete

## 1. Svelte 5 Runes System for HUD Components

**Decision**: Use Svelte 5 runes (`$state`, `$derived`, `$effect`) for all HUD component reactivity.

**Rationale**: The project uses Svelte 5.43.8 which has a fundamentally different reactivity model from Svelte 4. Runes provide explicit, fine-grained reactivity that works well with the game's ECS state pattern.

**Key Patterns**:

```svelte
<script lang="ts">
  // Reactive state from game loop
  let { gameLoop } = $props();

  // Derived values for computed display
  let gnomeCount = $derived(gameLoop.state.gnomes.size);
  let taskProgress = $derived(() => {
    let assigned = 0;
    for (const task of gameLoop.state.tasks.values()) {
      if (task.assignedGnome !== null) assigned++;
    }
    return { assigned, total: gameLoop.state.tasks.size };
  });

  // Effects for side reactions
  $effect(() => {
    if (gameLoop.state.isPaused) {
      // Handle pause state changes
    }
  });
</script>
```

**Alternatives Considered**:
- Svelte 4 syntax (`$:`, `export let`) - Rejected: deprecated in Svelte 5, less explicit
- Svelte stores - Rejected: adds unnecessary abstraction when direct object reference works

## 2. HUD Overlay CSS Pattern

**Decision**: Use `pointer-events: none` on HUD container with `pointer-events: auto` on interactive elements.

**Rationale**: This is the standard web pattern for overlays that should not block underlying interactions. PixiJS canvas receives all clicks except those on HUD buttons.

**Key Pattern**:

```css
.hud-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 1000;
  pointer-events: none;  /* Pass clicks through */
}

.hud-element {
  pointer-events: auto;  /* Capture clicks on this element */
}
```

**Alternatives Considered**:
- Z-index stacking without pointer-events - Rejected: blocks all clicks on overlay area
- PixiJS-based HUD rendering - Rejected: over-engineering for simple UI, loses Svelte reactivity benefits

## 3. Keyboard Event Handling

**Decision**: Use `<svelte:window>` with `onkeydown` attribute for global keyboard shortcuts.

**Rationale**: Existing keyboard shortcuts in `handler.ts` will remain there. HUD components will listen via `<svelte:window>` for UI-specific shortcuts, but defer to existing handler for game controls.

**Key Pattern**:

```svelte
<svelte:window onkeydown={handleKeyDown} />

<script lang="ts">
  function handleKeyDown(event: KeyboardEvent) {
    // Skip if modifier keys (Ctrl, Alt, Meta) are held
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    // Skip if focused on input element
    if (document.activeElement !== document.body) return;

    // Handle keys
    switch (event.key.toLowerCase()) {
      case 'd': handleDig(); break;
      // etc.
    }
  }
</script>
```

**Note**: Existing shortcuts (D, Space, 1/2/3, Escape) are already in `handler.ts:137-172`. HUD buttons will call the same commands, not duplicate the logic.

## 4. Gnome Click Selection Implementation

**Decision**: Check gnome positions on click before starting tile rectangle selection.

**Rationale**: Gnomes are rendered at tile positions. Click detection can use the existing `screenToTile()` function and iterate through gnomes to find one at the clicked tile.

**Implementation Approach**:

```typescript
// In handler.ts onMouseDown():
const tile = screenToTile(renderer, getState(), x, y);

// Check for gnome at this tile first
const gnomeId = findGnomeAtTile(getState(), tile.x, tile.y);

if (gnomeId !== null) {
  // Gnome click - don't start tile selection
  emitCommand(selectGnomes([gnomeId], e.shiftKey));
} else {
  // No gnome - proceed with tile selection
  inputState.isSelecting = true;
  inputState.selectionStart = tile;
  emitCommand(selectTiles([tile]));
}
```

**State Extension**:

```typescript
// In GameState interface (state.ts)
selectedGnomes: Entity[];  // New field for gnome selection
```

**Alternatives Considered**:
- PixiJS hit testing - Rejected: gnomes are simple Graphics, not interactive sprites
- Separate click handler layer - Rejected: adds complexity, existing handler is sufficient
- Bounding box pixel collision - Rejected: tile-based is simpler and matches game grid

## 5. Selection State Model

**Decision**: Separate arrays for tiles and gnomes: `selectedTiles` (existing) + `selectedGnomes` (new).

**Rationale**: Tiles and gnomes have different data structures and selection behaviors. Keeping them separate simplifies the logic:
- Tiles: `{ x: number, y: number }[]` - coordinate-based
- Gnomes: `Entity[]` - entity ID-based

**Mixed Selection Handling**: When both arrays have items, show count summary and disable actions (per FR-020).

**Alternatives Considered**:
- Unified `selectedEntities: Entity[]` - Rejected: tiles don't have entity IDs in current selection model, would require refactoring existing code
- Tagged union selection - Rejected: over-engineering for current needs

## 6. Task Counter Calculation

**Decision**: Compute "assigned / total" by iterating tasks and counting those with `assignedGnome !== null`.

**Rationale**: Task state already tracks `assignedGnome: Entity | null`. No new data structures needed.

**Implementation**:

```typescript
let taskProgress = $derived(() => {
  let assigned = 0;
  for (const task of gameLoop.state.tasks.values()) {
    if (task.assignedGnome !== null) assigned++;
  }
  return { assigned, total: gameLoop.state.tasks.size };
});
// Display: "{taskProgress.assigned} / {taskProgress.total}"
```

## 7. Air Tile Exclusion

**Decision**: Filter out air tiles in `getTilesInRect()` function.

**Rationale**: Centralized filtering ensures all selection paths (drag, click) exclude air tiles. The tile type is available via `state.tileGrid[y][x]` → entity → `state.tiles.get(entity)`.

**Implementation**:

```typescript
// In input/handler.ts or a utility
function getTilesInRect(start, end, state): { x: number, y: number }[] {
  const tiles = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const entityId = state.tileGrid[y]?.[x];
      if (entityId !== null) {  // null = air
        tiles.push({ x, y });
      }
    }
  }
  return tiles;
}
```

## 8. Component Structure

**Decision**: Extract HUD from Game.svelte into modular components in `src/lib/components/hud/`.

**Structure**:
```
hud/
├── HudOverlay.svelte      # Container with pointer-events
├── TopBar.svelte          # Counters + time controls
├── BottomBar.svelte       # Selection panel + actions
├── SelectionPanel.svelte  # Selection info display
└── ActionBar.svelte       # Contextual action buttons
```

**Rationale**:
- Separation of concerns - each component handles one HUD area
- Easier testing - components can be unit tested independently
- Code organization - current Game.svelte HUD code is inline and hard to maintain

## Summary of Technical Decisions

| Area | Decision | Key Benefit |
|------|----------|-------------|
| Reactivity | Svelte 5 runes | Explicit, fine-grained reactivity |
| Overlay | pointer-events CSS | Non-blocking, standard pattern |
| Keyboard | svelte:window + existing handler | No duplication of existing shortcuts |
| Gnome Selection | Tile-based detection + Entity array | Simple, matches existing patterns |
| Task Counter | Iterate + count assigned | No new data structures |
| Air Filtering | Filter in getTilesInRect | Centralized exclusion logic |
| Components | Modular hud/ directory | Maintainability, testability |
