# Data Model: Pixel Art Editor

**Date**: 2025-12-11
**Branch**: `002-pixel-art-editor`

## Overview

This document defines data structures for the Pixel Art Editor. The editor is a development tool with simpler architecture than the game (no ECS).

---

## Asset Format

### PixelArtAsset

The core data structure for storing and loading pixel art.

```typescript
/**
 * JSON-serializable pixel art asset format.
 * Designed to be human-readable and AI-writable.
 */
interface PixelArtAsset {
  /** Asset identifier (filename without extension) */
  name: string;

  /** Format version for future migrations */
  version: 1;

  /** Preset used to create this asset */
  preset: AssetPreset;

  /** Canvas width in pixels */
  width: number;

  /** Canvas height in pixels */
  height: number;

  /** Optional color palette for reference */
  palette?: string[];

  /** Pixel data - sparse format (only non-transparent pixels) */
  pixels: Pixel[];

  /** Animation metadata for sprite sheets */
  animation?: AnimationMetadata;
}
```

### Pixel

```typescript
/**
 * Single pixel in sparse format.
 * Only non-transparent pixels are stored.
 */
interface Pixel {
  /** X coordinate (0 = left edge) */
  x: number;

  /** Y coordinate (0 = top edge) */
  y: number;

  /** Hex color: "#RRGGBB" or "#RRGGBBAA" */
  color: string;
}
```

### AnimationMetadata

```typescript
/**
 * Animation info for sprite sheets.
 */
interface AnimationMetadata {
  /** Width of each frame in pixels */
  frameWidth: number;

  /** Height of each frame in pixels */
  frameHeight: number;

  /** Number of frames in the animation */
  frameCount: number;

  /** Playback speed in frames per second */
  fps: number;
}
```

---

## Asset Presets

```typescript
/**
 * Predefined canvas sizes for game assets.
 */
type AssetPreset =
  | 'tile-16'
  | 'tile-32'
  | 'gnome-idle'
  | 'gnome-walk'
  | 'gnome-dig'
  | 'gnome-climb'
  | 'structure-wall'
  | 'structure-door'
  | 'structure-ladder'
  | 'ui-button'
  | 'ui-icon'
  | 'resource-item'
  | 'tree'
  | 'bush'
  | 'custom';

type AssetCategory =
  | 'tiles'
  | 'gnomes'
  | 'structures'
  | 'ui'
  | 'resources'
  | 'vegetation';

interface PresetConfig {
  name: AssetPreset;
  width: number;
  height: number;
  category: AssetCategory;
  description: string;
  animation?: {
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
  };
}

const PRESET_CONFIGS: PresetConfig[] = [
  { name: 'tile-16', width: 16, height: 16, category: 'tiles', description: 'Standard terrain tile' },
  { name: 'tile-32', width: 32, height: 32, category: 'tiles', description: 'Large terrain feature' },
  { name: 'gnome-idle', width: 16, height: 24, category: 'gnomes', description: 'Gnome idle pose' },
  { name: 'gnome-walk', width: 64, height: 24, category: 'gnomes', description: 'Walk cycle (4 frames)',
    animation: { frameWidth: 16, frameHeight: 24, frameCount: 4 } },
  { name: 'gnome-dig', width: 64, height: 24, category: 'gnomes', description: 'Mining animation (4 frames)',
    animation: { frameWidth: 16, frameHeight: 24, frameCount: 4 } },
  { name: 'gnome-climb', width: 48, height: 24, category: 'gnomes', description: 'Climbing animation (3 frames)',
    animation: { frameWidth: 16, frameHeight: 24, frameCount: 3 } },
  { name: 'structure-wall', width: 16, height: 16, category: 'structures', description: 'Wall segment' },
  { name: 'structure-door', width: 16, height: 32, category: 'structures', description: 'Door (2 tiles)' },
  { name: 'structure-ladder', width: 16, height: 16, category: 'structures', description: 'Ladder segment' },
  { name: 'ui-button', width: 32, height: 32, category: 'ui', description: 'UI button base' },
  { name: 'ui-icon', width: 16, height: 16, category: 'ui', description: 'Small icon' },
  { name: 'resource-item', width: 12, height: 12, category: 'resources', description: 'Resource icon' },
  { name: 'tree', width: 48, height: 64, category: 'vegetation', description: 'Surface tree' },
  { name: 'bush', width: 24, height: 16, category: 'vegetation', description: 'Small vegetation' },
];
```

---

## Editor State

### EditorState

```typescript
/**
 * Complete editor application state.
 */
interface EditorState {
  /** Current document being edited */
  asset: PixelArtAsset | null;

  /** Whether asset has unsaved changes */
  isDirty: boolean;

  /** Currently selected drawing tool */
  currentTool: EditorTool;

  /** Current drawing color (hex) */
  currentColor: string;

  /** Secondary color for swap */
  secondaryColor: string;

  /** Display zoom multiplier */
  zoom: number;

  /** Whether to show pixel grid overlay */
  showGrid: boolean;

  /** Whether to show PixiJS preview panel */
  showPreview: boolean;

  /** Undo history stack */
  undoStack: PixelArtAsset[];

  /** Redo history stack */
  redoStack: PixelArtAsset[];

  /** Maximum undo history size */
  maxHistory: number;

  /** File handle for JSON (File System Access API) */
  jsonFileHandle: FileSystemFileHandle | null;

  /** File handle for PNG export */
  pngFileHandle: FileSystemFileHandle | null;
}

type EditorTool = 'pencil' | 'eraser' | 'fill' | 'picker';
```

### Default State

```typescript
const DEFAULT_EDITOR_STATE: EditorState = {
  asset: null,
  isDirty: false,
  currentTool: 'pencil',
  currentColor: '#000000',
  secondaryColor: '#FFFFFF',
  zoom: 8,
  showGrid: true,
  showPreview: true,
  undoStack: [],
  redoStack: [],
  maxHistory: 50,
  jsonFileHandle: null,
  pngFileHandle: null,
};
```

---

## Tool Types

```typescript
/**
 * Tool behavior interface.
 */
interface Tool {
  /** Tool identifier */
  name: EditorTool;

  /** Cursor style when tool is active */
  cursor: string;

  /** Handle mouse down on canvas */
  onMouseDown(ctx: ToolContext, x: number, y: number): void;

  /** Handle mouse move while drawing */
  onMouseMove(ctx: ToolContext, x: number, y: number): void;

  /** Handle mouse up */
  onMouseUp(ctx: ToolContext): void;
}

/**
 * Context passed to tools.
 */
interface ToolContext {
  /** Current asset */
  asset: PixelArtAsset;

  /** Canvas 2D rendering context */
  canvasCtx: CanvasRenderingContext2D;

  /** Current drawing color */
  color: string;

  /** Callback to set a pixel */
  setPixel(x: number, y: number, color: string): void;

  /** Callback to clear a pixel (make transparent) */
  clearPixel(x: number, y: number): void;

  /** Callback to get pixel color */
  getPixel(x: number, y: number): string | null;

  /** Callback to set current color (for picker) */
  setCurrentColor(color: string): void;

  /** Callback to trigger canvas redraw */
  redraw(): void;
}
```

---

## Color Types

```typescript
/**
 * RGBA color representation.
 */
interface RGBAColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-255
}

/**
 * Parse hex color to RGBA.
 */
function hexToRgba(hex: string): RGBAColor {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  if (!match) throw new Error(`Invalid hex color: ${hex}`);
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
    a: match[4] ? parseInt(match[4], 16) : 255,
  };
}

/**
 * Convert RGBA to hex string.
 */
function rgbaToHex(color: RGBAColor): string {
  const { r, g, b, a } = color;
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return a === 255
    ? `#${hex(r)}${hex(g)}${hex(b)}`
    : `#${hex(r)}${hex(g)}${hex(b)}${hex(a)}`;
}
```

---

## File Paths

```typescript
/**
 * Standard asset paths relative to project root.
 */
const ASSET_PATHS = {
  source: 'src/lib/assets/source',
  sprites: {
    tiles: 'src/lib/assets/sprites/tiles',
    gnomes: 'src/lib/assets/sprites/gnomes',
    structures: 'src/lib/assets/sprites/structures',
    ui: 'src/lib/assets/sprites/ui',
    resources: 'src/lib/assets/sprites/resources',
    vegetation: 'src/lib/assets/sprites/vegetation',
  },
} as const;

/**
 * Get export path for an asset.
 */
function getExportPath(asset: PixelArtAsset): string {
  const preset = PRESET_CONFIGS.find(p => p.name === asset.preset);
  const category = preset?.category ?? 'tiles';
  return `${ASSET_PATHS.sprites[category]}/${asset.name}.png`;
}
```

---

## Validation

```typescript
/**
 * Validate asset structure.
 */
function validateAsset(data: unknown): data is PixelArtAsset {
  if (typeof data !== 'object' || data === null) return false;

  const asset = data as Record<string, unknown>;

  return (
    typeof asset.name === 'string' &&
    asset.version === 1 &&
    typeof asset.preset === 'string' &&
    typeof asset.width === 'number' &&
    typeof asset.height === 'number' &&
    asset.width > 0 && asset.width <= 128 &&
    asset.height > 0 && asset.height <= 128 &&
    Array.isArray(asset.pixels) &&
    asset.pixels.every(isValidPixel)
  );
}

function isValidPixel(p: unknown): p is Pixel {
  if (typeof p !== 'object' || p === null) return false;
  const pixel = p as Record<string, unknown>;
  return (
    typeof pixel.x === 'number' &&
    typeof pixel.y === 'number' &&
    typeof pixel.color === 'string' &&
    /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(pixel.color)
  );
}
```

---

## Constants

```typescript
const EDITOR_CONSTANTS = {
  MIN_ZOOM: 1,
  MAX_ZOOM: 32,
  DEFAULT_ZOOM: 8,
  MAX_CANVAS_SIZE: 128,
  MAX_UNDO_HISTORY: 50,
  GRID_COLOR: '#444444',
  TRANSPARENT_PATTERN: '#808080', // Checkerboard for transparency
} as const;

const DEFAULT_PALETTE = [
  '#000000', // Black
  '#FFFFFF', // White
  '#8B4513', // Dirt brown
  '#A0522D', // Sienna
  '#808080', // Stone gray
  '#228B22', // Forest green
  '#87CEEB', // Sky blue
  '#FFD700', // Gold
  '#CD853F', // Peru/copper
  '#00FF00', // Bright green (gnome)
] as const;
```

---

## Example Asset

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
    {"x": 2, "y": 0, "color": "#8B4513"},
    {"x": 3, "y": 0, "color": "#6B3E0A"},
    {"x": 0, "y": 1, "color": "#A0522D"},
    {"x": 1, "y": 1, "color": "#8B4513"}
  ]
}
```
