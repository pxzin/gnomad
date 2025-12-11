# Research: Pixel Art Editor

**Date**: 2025-12-11
**Branch**: `002-pixel-art-editor`

## Executive Summary

This document captures technical decisions for the Pixel Art Editor implementation. All technology choices are clear from the project context and spec requirements.

---

## 1. Canvas API for Pixel Editing

### Decision

Use native Canvas 2D API for pixel editing, not PixiJS.

### Rationale

- Canvas 2D API provides direct pixel manipulation via `ImageData` and `Uint8ClampedArray`
- PixiJS is optimized for rendering, not pixel-level editing operations
- Canvas API is lighter weight for a simple editor (no WebGPU overhead)
- ImageData allows direct read/write of RGBA values per pixel

### Implementation Pattern

```typescript
const canvas = document.createElement('canvas');
canvas.width = 16;
canvas.height = 16;
const ctx = canvas.getContext('2d')!;

// Get pixel data
const imageData = ctx.getImageData(0, 0, 16, 16);
const data = imageData.data; // Uint8ClampedArray [R,G,B,A, R,G,B,A, ...]

// Set pixel at (x, y)
function setPixel(x: number, y: number, r: number, g: number, b: number, a: number): void {
  const i = (y * canvas.width + x) * 4;
  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = a;
}

ctx.putImageData(imageData, 0, 0);
```

### Alternatives Considered

- **PixiJS for everything**: Rejected; pixel manipulation cumbersome in WebGL
- **WebGL directly**: Overkill for max 128x128 canvas

---

## 2. PixiJS for Preview Rendering

### Decision

Use PixiJS v8 for the preview panel to show how sprites will look in-game.

### Rationale

- Preview must match actual game rendering (PixiJS v8)
- Shows accurate WebGPU/WebGL appearance
- Supports animation playback for sprite sheets
- Already a project dependency

### Implementation Pattern

```typescript
import { Application, Sprite, Texture } from 'pixi.js';

async function createPreview(container: HTMLElement): Promise<Application> {
  const app = new Application();
  await app.init({
    width: 200,
    height: 200,
    backgroundColor: 0x1a1a2e,
  });
  container.appendChild(app.canvas);
  return app;
}

function updatePreview(app: Application, imageData: ImageData): void {
  // Convert ImageData to PixiJS Texture
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);

  const texture = Texture.from(canvas);
  // Update sprite with new texture
}
```

---

## 3. File System Access API with Fallback

### Decision

Use `browser-fs-access` library for cross-browser file operations.

### Rationale

- File System Access API enables direct save to project directory (Chrome/Edge)
- Library provides transparent fallback for Firefox/Safari
- User grants permission once, can save repeatedly to same location
- Handles both JSON and PNG file types

### Implementation Pattern

```typescript
import { fileSave, fileOpen } from 'browser-fs-access';

// Save JSON
async function saveAssetJson(asset: PixelArtAsset): Promise<void> {
  const blob = new Blob([JSON.stringify(asset, null, 2)], { type: 'application/json' });
  await fileSave(blob, {
    fileName: `${asset.name}.json`,
    extensions: ['.json'],
  });
}

// Save PNG
async function exportPng(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/png')
  );
  await fileSave(blob, {
    fileName: filename,
    extensions: ['.png'],
  });
}

// Load JSON
async function loadAssetJson(): Promise<PixelArtAsset | null> {
  const file = await fileOpen({
    extensions: ['.json'],
    mimeTypes: ['application/json'],
  });
  const text = await file.text();
  return JSON.parse(text);
}
```

### Browser Support

| Browser | Support |
|---------|---------|
| Chrome/Edge | Full File System Access API |
| Firefox | Download/upload fallback |
| Safari | Download/upload fallback |

---

## 4. JSON Asset Format (Sparse Pixels)

### Decision

Use a sparse pixel format where only non-transparent pixels are stored.

### Rationale

- Most pixel art has significant transparency
- Smaller file size than dense array
- Human-readable and AI-writable
- Easy to diff in version control
- Supports programmatic generation

### Format Specification

```typescript
interface PixelArtAsset {
  name: string;
  version: 1;
  preset: string;
  width: number;
  height: number;
  palette?: string[];
  pixels: Array<{ x: number; y: number; color: string }>;
  animation?: {
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    fps: number;
  };
}
```

### Example

```json
{
  "name": "dirt-tile",
  "version": 1,
  "preset": "tile-16",
  "width": 16,
  "height": 16,
  "palette": ["#8B4513", "#A0522D"],
  "pixels": [
    {"x": 0, "y": 0, "color": "#8B4513"},
    {"x": 1, "y": 0, "color": "#A0522D"}
  ]
}
```

### Alternatives Considered

- **Dense array**: Larger files, harder to read
- **PNG metadata**: Not human-readable
- **Aseprite format**: Too complex for simple needs

---

## 5. Svelte 5 Runes for State Management

### Decision

Use Svelte 5 runes (`$state`, `$derived`) for editor state.

### Rationale

- Native Svelte reactivity, no external library needed
- Single state object is serializable (for potential future features)
- Undo/redo implemented via state snapshots
- Clean separation of state from UI

### Implementation Pattern

```typescript
// editor.svelte.ts
interface EditorState {
  asset: PixelArtAsset | null;
  currentTool: 'pencil' | 'eraser' | 'fill' | 'picker';
  currentColor: string;
  zoom: number;
  showGrid: boolean;
  undoStack: PixelArtAsset[];
  redoStack: PixelArtAsset[];
}

function createEditorState() {
  let state = $state<EditorState>({
    asset: null,
    currentTool: 'pencil',
    currentColor: '#000000',
    zoom: 8,
    showGrid: true,
    undoStack: [],
    redoStack: [],
  });

  return {
    get state() { return state; },
    setTool(tool: EditorState['currentTool']) { state.currentTool = tool; },
    setColor(color: string) { state.currentColor = color; },
    // ... other methods
  };
}
```

---

## 6. Drawing Tools Implementation

### Pencil Tool

Uses Bresenham's line algorithm for smooth strokes without gaps.

```typescript
function bresenhamLine(
  x0: number, y0: number,
  x1: number, y1: number
): Array<{x: number, y: number}> {
  const points: Array<{x: number, y: number}> = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return points;
}
```

### Fill Tool (Flood Fill)

Stack-based 4-connectivity flood fill.

```typescript
function floodFill(
  imageData: ImageData,
  startX: number, startY: number,
  fillColor: {r: number, g: number, b: number, a: number}
): void {
  const { width, height, data } = imageData;
  const targetColor = getPixelColor(data, startX, startY, width);

  if (colorsEqual(targetColor, fillColor)) return;

  const stack: Array<{x: number, y: number}> = [{x: startX, y: startY}];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const {x, y} = stack.pop()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const currentColor = getPixelColor(data, x, y, width);
    if (!colorsEqual(currentColor, targetColor)) continue;

    visited.add(key);
    setPixelColor(data, x, y, width, fillColor);

    stack.push({x: x + 1, y}, {x: x - 1, y}, {x, y: y + 1}, {x, y: y - 1});
  }
}
```

---

## 7. Crisp Pixel Rendering

### Decision

Use CSS `image-rendering: pixelated` for zoom display.

### Implementation

```css
.pixel-canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

```svelte
<canvas
  class="pixel-canvas"
  width={asset.width}
  height={asset.height}
  style="width: {asset.width * zoom}px; height: {asset.height * zoom}px;"
/>
```

### Coordinate Translation

```typescript
function canvasToPixel(
  event: MouseEvent,
  canvas: HTMLCanvasElement,
  zoom: number
): {x: number, y: number} {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / zoom);
  const y = Math.floor((event.clientY - rect.top) / zoom);
  return { x, y };
}
```

---

## Summary of Decisions

| Topic | Decision | Key Reason |
|-------|----------|------------|
| Pixel editing | Canvas 2D API | Direct ImageData access |
| Preview | PixiJS v8 | Match game rendering |
| File save | browser-fs-access | Cross-browser with direct save |
| Data format | Sparse JSON | AI-writable, human-readable |
| State | Svelte 5 runes | Native reactivity |
| Line drawing | Bresenham | No gaps in strokes |
| Fill | Stack-based flood | Simple, efficient |
| Zoom | CSS pixelated | Crisp pixels |

All technical decisions resolved. Ready for Phase 1: Data Model & Contracts.
