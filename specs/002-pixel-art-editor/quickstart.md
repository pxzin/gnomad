# Quickstart: Pixel Art Editor

**Date**: 2025-12-11
**Branch**: `002-pixel-art-editor`

## Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm 8+ (`npm install -g pnpm`)
- Modern browser (Chrome, Firefox, Safari, Edge)
- Existing gnomad project setup (from 001-colony-sim-core)

## Setup

### 1. Install Additional Dependency

```bash
# File System Access API with fallback
pnpm add browser-fs-access
```

### 2. Create Directory Structure

```bash
mkdir -p src/lib/editor/{components,state,tools,io}
mkdir -p src/lib/assets/{source,sprites/{tiles,gnomes,structures,ui,resources,vegetation}}
mkdir -p src/routes/editor
```

### 3. Create Editor Route

Create `src/routes/editor/+page.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import Canvas from '$lib/editor/components/Canvas.svelte';
  import ToolPalette from '$lib/editor/components/ToolPalette.svelte';
  import ColorPicker from '$lib/editor/components/ColorPicker.svelte';
  import PresetSelector from '$lib/editor/components/PresetSelector.svelte';
  import Preview from '$lib/editor/components/Preview.svelte';
  import { createEditorStore } from '$lib/editor/state/editor.svelte';

  const store = createEditorStore();
</script>

<div class="editor-layout">
  <header class="toolbar">
    <PresetSelector {store} />
    <ToolPalette {store} />
    <ColorPicker {store} />
  </header>

  <main class="canvas-area">
    <Canvas {store} />
  </main>

  <aside class="preview-panel">
    <Preview {store} />
  </aside>
</div>

<style>
  .editor-layout {
    display: grid;
    grid-template-columns: 1fr 200px;
    grid-template-rows: auto 1fr;
    height: 100vh;
    background: #1a1a2e;
    color: #fff;
  }

  .toolbar {
    grid-column: 1 / -1;
    display: flex;
    gap: 1rem;
    padding: 0.5rem;
    background: #16213e;
    border-bottom: 1px solid #0f3460;
  }

  .canvas-area {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
    padding: 1rem;
  }

  .preview-panel {
    background: #0f3460;
    padding: 1rem;
    border-left: 1px solid #16213e;
  }
</style>
```

## Running the Editor

```bash
# Start development server
pnpm dev

# Navigate to editor
# http://localhost:5173/editor
```

## Feature Checklist

Implement in priority order:

1. **[ ] P1: Canvas rendering** - Display canvas with zoom and grid
2. **[ ] P1: Pencil tool** - Click/drag to draw pixels
3. **[ ] P1: Preset selector** - Create new assets from presets
4. **[ ] P2: JSON save/load** - Save/load source files
5. **[ ] P3: PNG export** - Export to PNG files
6. **[ ] P4: Eraser tool** - Remove pixels
7. **[ ] P4: Fill tool** - Flood fill areas
8. **[ ] P4: Color picker tool** - Sample colors from canvas
9. **[ ] P5: Undo/redo** - History stack
10. **[ ] P6: PixiJS preview** - Real-time game preview

## Quick Verification

After each feature:

```typescript
// Check editor state in browser console
console.log(store.state.asset);        // Current asset
console.log(store.state.currentTool);  // Active tool
console.log(store.state.undoStack.length); // Undo history
```

## File Reference

| File | Purpose |
|------|---------|
| `src/routes/editor/+page.svelte` | Editor page entry |
| `src/lib/editor/state/editor.svelte.ts` | State management |
| `src/lib/editor/components/Canvas.svelte` | Main drawing canvas |
| `src/lib/editor/components/ToolPalette.svelte` | Tool selection |
| `src/lib/editor/components/ColorPicker.svelte` | Color selection |
| `src/lib/editor/components/PresetSelector.svelte` | Preset menu |
| `src/lib/editor/components/Preview.svelte` | PixiJS preview |
| `src/lib/editor/tools/pencil.ts` | Pencil tool |
| `src/lib/editor/tools/eraser.ts` | Eraser tool |
| `src/lib/editor/tools/fill.ts` | Fill tool |
| `src/lib/editor/tools/picker.ts` | Color picker |
| `src/lib/editor/io/json.ts` | JSON import/export |
| `src/lib/editor/io/png.ts` | PNG export |
| `src/lib/editor/io/presets.ts` | Preset definitions |
| `src/lib/editor/types.ts` | TypeScript types |

## Creating Assets

### Via Editor UI

1. Navigate to `/editor`
2. Click "New Asset" → Select preset
3. Draw using tools
4. Save JSON → Export PNG

### Via JSON (AI Generation)

Create `src/lib/assets/source/dirt-tile.json`:

```json
{
  "name": "dirt-tile",
  "version": 1,
  "preset": "tile-16",
  "width": 16,
  "height": 16,
  "palette": ["#8B4513", "#A0522D", "#6B3E0A"],
  "pixels": [
    {"x": 0, "y": 0, "color": "#8B4513"},
    {"x": 1, "y": 0, "color": "#A0522D"},
    {"x": 2, "y": 0, "color": "#8B4513"}
  ]
}
```

Then load in editor → Export PNG.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `P` | Pencil tool |
| `E` | Eraser tool |
| `G` | Fill tool |
| `I` | Color picker |
| `+` / `-` | Zoom in/out |
| `0` | Reset zoom |
| `#` | Toggle grid |
| `X` | Swap colors |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Save JSON |
| `Ctrl+E` | Export PNG |

## Asset Presets

| Preset | Size | Category |
|--------|------|----------|
| `tile-16` | 16×16 | tiles |
| `tile-32` | 32×32 | tiles |
| `gnome-idle` | 16×24 | gnomes |
| `gnome-walk` | 64×24 | gnomes (4 frames) |
| `gnome-dig` | 64×24 | gnomes (4 frames) |
| `gnome-climb` | 48×24 | gnomes (3 frames) |
| `structure-wall` | 16×16 | structures |
| `structure-door` | 16×32 | structures |
| `structure-ladder` | 16×16 | structures |
| `ui-button` | 32×32 | ui |
| `ui-icon` | 16×16 | ui |
| `resource-item` | 12×12 | resources |
| `tree` | 48×64 | vegetation |
| `bush` | 24×16 | vegetation |

## Troubleshooting

### File System Access API not working

Check browser support in console:

```typescript
if ('showSaveFilePicker' in window) {
  console.log('File System Access API supported');
} else {
  console.log('Using download fallback');
}
```

Chrome/Edge have full support. Firefox/Safari use download fallback.

### Canvas blurry when zoomed

Ensure CSS is set:

```css
canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

### Colors look wrong

- Use hex format: `#RRGGBB` or `#RRGGBBAA`
- Transparency requires 8-character hex with alpha

## Integration with Game

Once assets are created:

1. Export PNG to appropriate `src/lib/assets/sprites/{category}/` folder
2. Load in game renderer using PixiJS Assets:

```typescript
import { Assets, Sprite } from 'pixi.js';

const texture = await Assets.load('$lib/assets/sprites/tiles/dirt-tile.png');
const sprite = new Sprite(texture);
```

## Commands Reference

```bash
# Development
pnpm dev              # Start dev server

# Testing
pnpm vitest           # Run tests

# Type check
pnpm check            # TypeScript check

# Build
pnpm build            # Production build
```
