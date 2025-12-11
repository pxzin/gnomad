# Editor API Contract: Pixel Art Editor

**Date**: 2025-12-11
**Branch**: `002-pixel-art-editor`

## Overview

This document defines the API contracts for the Pixel Art Editor. Since this is a browser-only tool with no backend, these are TypeScript function signatures forming contracts between modules.

---

## Asset IO API

### JSON Operations

```typescript
/**
 * Load asset from JSON string.
 * Returns null if parsing fails or validation fails.
 */
function loadAssetFromJson(json: string): PixelArtAsset | null;

/**
 * Save asset to JSON string (pretty-printed).
 */
function saveAssetToJson(asset: PixelArtAsset): string;

/**
 * Load asset via file picker dialog.
 * Returns asset and file handle for future saves.
 */
async function openAssetFile(): Promise<{
  asset: PixelArtAsset;
  handle: FileSystemFileHandle;
} | null>;

/**
 * Save asset to existing file handle or prompt for new location.
 */
async function saveAssetFile(
  asset: PixelArtAsset,
  handle?: FileSystemFileHandle
): Promise<FileSystemFileHandle>;
```

### PNG Operations

```typescript
/**
 * Export asset to PNG blob.
 */
function exportToPngBlob(asset: PixelArtAsset): Promise<Blob>;

/**
 * Export asset and trigger download or file save.
 */
async function exportPng(
  asset: PixelArtAsset,
  filename: string,
  handle?: FileSystemFileHandle
): Promise<FileSystemFileHandle | null>;

/**
 * Import PNG file and convert to asset.
 * Extracts pixel data from image.
 */
async function importFromPng(
  file: File,
  preset?: AssetPreset
): Promise<PixelArtAsset>;
```

---

## Canvas Operations API

### Pixel Manipulation

```typescript
/**
 * Set a single pixel in the asset.
 * Returns new asset (immutable update).
 */
function setPixel(
  asset: PixelArtAsset,
  x: number,
  y: number,
  color: string
): PixelArtAsset;

/**
 * Clear a pixel (make transparent).
 * Returns new asset (immutable update).
 */
function clearPixel(
  asset: PixelArtAsset,
  x: number,
  y: number
): PixelArtAsset;

/**
 * Get pixel color at position.
 * Returns null if transparent.
 */
function getPixel(
  asset: PixelArtAsset,
  x: number,
  y: number
): string | null;

/**
 * Set multiple pixels at once (batch operation).
 * More efficient than multiple setPixel calls.
 */
function setPixels(
  asset: PixelArtAsset,
  pixels: Array<{ x: number; y: number; color: string }>
): PixelArtAsset;
```

### Drawing Operations

```typescript
/**
 * Draw a line using Bresenham's algorithm.
 * Returns new asset with line drawn.
 */
function drawLine(
  asset: PixelArtAsset,
  x0: number, y0: number,
  x1: number, y1: number,
  color: string
): PixelArtAsset;

/**
 * Flood fill from starting point.
 * Returns new asset with fill applied.
 */
function floodFill(
  asset: PixelArtAsset,
  startX: number,
  startY: number,
  fillColor: string
): PixelArtAsset;

/**
 * Erase a line (make pixels transparent).
 */
function eraseLine(
  asset: PixelArtAsset,
  x0: number, y0: number,
  x1: number, y1: number
): PixelArtAsset;
```

---

## Editor State API

### State Store

```typescript
/**
 * Create editor state store using Svelte 5 runes.
 */
function createEditorStore(): EditorStore;

interface EditorStore {
  /** Readonly reactive state */
  readonly state: EditorState;

  // Asset operations
  newAsset(preset: AssetPreset, name?: string): void;
  loadAsset(asset: PixelArtAsset): void;
  closeAsset(): void;

  // Tool operations
  setTool(tool: EditorTool): void;
  setColor(color: string): void;
  swapColors(): void;

  // View operations
  setZoom(zoom: number): void;
  zoomIn(): void;
  zoomOut(): void;
  toggleGrid(): void;
  togglePreview(): void;

  // History operations
  pushUndo(): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;

  // Dirty tracking
  markDirty(): void;
  markClean(): void;

  // File handles
  setJsonHandle(handle: FileSystemFileHandle | null): void;
  setPngHandle(handle: FileSystemFileHandle | null): void;
}
```

---

## Preset API

```typescript
/**
 * Get all available presets.
 */
function getPresets(): PresetConfig[];

/**
 * Get presets filtered by category.
 */
function getPresetsByCategory(category: AssetCategory): PresetConfig[];

/**
 * Get preset config by name.
 */
function getPreset(name: AssetPreset): PresetConfig | undefined;

/**
 * Create new empty asset from preset.
 */
function createAssetFromPreset(
  preset: AssetPreset,
  name: string
): PixelArtAsset;

/**
 * Create custom-sized asset.
 */
function createCustomAsset(
  width: number,
  height: number,
  name: string
): PixelArtAsset;
```

---

## Rendering API

### Canvas Rendering

```typescript
/**
 * Render asset to canvas context.
 */
function renderAssetToCanvas(
  ctx: CanvasRenderingContext2D,
  asset: PixelArtAsset
): void;

/**
 * Render asset with zoom and optional grid.
 */
function renderAssetZoomed(
  ctx: CanvasRenderingContext2D,
  asset: PixelArtAsset,
  zoom: number,
  showGrid: boolean
): void;

/**
 * Render transparency checkerboard pattern.
 */
function renderTransparencyPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number
): void;

/**
 * Render pixel grid overlay.
 */
function renderGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number,
  gridColor: string
): void;
```

### PixiJS Preview

```typescript
/**
 * Create PixiJS preview renderer.
 */
function createPreviewRenderer(
  container: HTMLElement
): Promise<PreviewRenderer>;

interface PreviewRenderer {
  /** Update preview with current asset */
  update(asset: PixelArtAsset): void;

  /** Set preview scale */
  setScale(scale: number): void;

  /** Play animation (for sprite sheets) */
  playAnimation(): void;

  /** Stop animation */
  stopAnimation(): void;

  /** Destroy renderer and cleanup */
  destroy(): void;
}
```

---

## Event Handlers

### Canvas Events

```typescript
/**
 * Create canvas event handlers for current tool.
 */
function createCanvasHandlers(
  store: EditorStore,
  canvas: HTMLCanvasElement,
  zoom: number
): CanvasEventHandlers;

interface CanvasEventHandlers {
  onMouseDown(event: MouseEvent): void;
  onMouseMove(event: MouseEvent): void;
  onMouseUp(event: MouseEvent): void;
  onMouseLeave(event: MouseEvent): void;
}
```

### Keyboard Shortcuts

```typescript
/**
 * Default keyboard shortcuts.
 */
const KEYBOARD_SHORTCUTS: Record<string, string> = {
  // Tools
  'p': 'pencil',
  'e': 'eraser',
  'g': 'fill',
  'i': 'picker',

  // View
  '+': 'zoomIn',
  '=': 'zoomIn',
  '-': 'zoomOut',
  '0': 'resetZoom',
  '#': 'toggleGrid',

  // History
  'ctrl+z': 'undo',
  'ctrl+y': 'redo',
  'ctrl+shift+z': 'redo',

  // File
  'ctrl+s': 'save',
  'ctrl+shift+s': 'saveAs',
  'ctrl+e': 'exportPng',
  'ctrl+n': 'newAsset',
  'ctrl+o': 'openAsset',

  // Color
  'x': 'swapColors',
};

/**
 * Handle keyboard shortcut.
 * Returns true if shortcut was handled.
 */
function handleKeyboardShortcut(
  event: KeyboardEvent,
  store: EditorStore
): boolean;
```

---

## Coordinate Utilities

```typescript
/**
 * Convert mouse event to pixel coordinates.
 */
function eventToPixel(
  event: MouseEvent,
  canvas: HTMLCanvasElement,
  zoom: number
): { x: number; y: number };

/**
 * Check if coordinates are within asset bounds.
 */
function isInBounds(
  asset: PixelArtAsset,
  x: number,
  y: number
): boolean;

/**
 * Clamp coordinates to asset bounds.
 */
function clampToBounds(
  asset: PixelArtAsset,
  x: number,
  y: number
): { x: number; y: number };
```

---

## Color Utilities

```typescript
/**
 * Parse hex color string.
 */
function parseHexColor(hex: string): RGBAColor;

/**
 * Format RGBA as hex string.
 */
function formatHexColor(color: RGBAColor): string;

/**
 * Check if two colors are equal.
 */
function colorsEqual(a: RGBAColor, b: RGBAColor): boolean;

/**
 * Validate hex color string format.
 */
function isValidHexColor(hex: string): boolean;

/**
 * Extract unique colors from asset as palette.
 */
function extractPalette(asset: PixelArtAsset): string[];
```

---

## Validation

```typescript
/**
 * Validate PixelArtAsset structure.
 */
function validateAsset(data: unknown): data is PixelArtAsset;

/**
 * Validation error codes.
 */
enum AssetValidationError {
  INVALID_VERSION = 'INVALID_VERSION',
  MISSING_NAME = 'MISSING_NAME',
  INVALID_DIMENSIONS = 'INVALID_DIMENSIONS',
  INVALID_PIXEL_FORMAT = 'INVALID_PIXEL_FORMAT',
  PIXEL_OUT_OF_BOUNDS = 'PIXEL_OUT_OF_BOUNDS',
}

/**
 * Validate and return detailed errors.
 */
function validateAssetDetailed(
  data: unknown
): AssetValidationError[];
```
