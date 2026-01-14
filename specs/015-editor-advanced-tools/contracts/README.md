# Contracts: Editor Advanced Tools

**Feature**: 015-editor-advanced-tools
**Date**: 2026-01-12

This directory contains internal API contracts for the editor advanced tools feature. Since this is a client-side application without external APIs, contracts define internal module interfaces.

## Contract Files

### editor-store.ts

Extended EditorStore interface with layer and animation operations.

```typescript
interface EditorStore {
  // ...existing interface...

  // Layer operations
  createLayer(name?: string): string;  // Returns new layer ID
  deleteLayer(id: string): void;
  selectLayer(id: string): void;
  reorderLayer(id: string, newIndex: number): void;
  renameLayer(id: string, name: string): void;
  setLayerVisibility(id: string, visible: boolean): void;
  setLayerOpacity(id: string, opacity: number): void;
  mergeLayerDown(id: string): void;
  flattenAllLayers(): void;

  // Frame operations
  addFrame(afterIndex?: number): void;
  deleteFrame(index: number): void;
  duplicateFrame(index: number): void;
  reorderFrame(fromIndex: number, toIndex: number): void;
  selectFrame(index: number): void;

  // Animation operations
  setFps(fps: number): void;
  play(): void;
  pause(): void;
  stop(): void;
  toggleLoop(): void;

  // Onion skin operations
  toggleOnionSkin(): void;
  setOnionSkinPrevious(show: boolean): void;
  setOnionSkinNext(show: boolean): void;
  setOnionSkinOpacity(previous: number, next: number): void;
}
```

### clipboard.ts

Clipboard handling module interface.

```typescript
interface ClipboardModule {
  /**
   * Read image from clipboard.
   * Returns null if no image available or permission denied.
   */
  readImage(): Promise<ClipboardImage | null>;

  /**
   * Convert clipboard image to sparse pixel format.
   * Crops to maxWidth/maxHeight if image exceeds bounds.
   */
  convertToPixels(
    image: ClipboardImage,
    maxWidth: number,
    maxHeight: number
  ): Pixel[];

  /**
   * Extract unique colors from pixel array.
   */
  extractColors(pixels: Pixel[]): string[];
}
```

### composite.ts

Layer compositing module interface.

```typescript
interface CompositeModule {
  /**
   * Composite all visible layers into a single canvas.
   * Layers are composited bottom-to-top with their individual opacities.
   */
  compositeLayers(
    layers: Layer[],
    frameIndex: number,
    width: number,
    height: number
  ): HTMLCanvasElement;

  /**
   * Flatten all visible layers into a single pixel array.
   * Used for PNG export.
   */
  flattenToPixels(
    layers: Layer[],
    frameIndex: number,
    width: number,
    height: number
  ): Pixel[];
}
```

### animation.ts

Animation playback module interface.

```typescript
interface AnimationPlayer {
  /** Current playback state */
  readonly playing: boolean;

  /** Start playback */
  play(): void;

  /** Pause playback */
  pause(): void;

  /** Stop and reset to frame 0 */
  stop(): void;

  /** Set frames per second */
  setFps(fps: number): void;

  /** Register callback for frame changes */
  onFrameChange(callback: (frameIndex: number) => void): void;

  /** Cleanup resources */
  destroy(): void;
}

interface OnionSkinRenderer {
  /**
   * Render onion skin overlays for adjacent frames.
   */
  render(
    ctx: CanvasRenderingContext2D,
    layers: Layer[],
    currentFrame: number,
    frameCount: number,
    settings: OnionSkinSettings,
    width: number,
    height: number
  ): void;
}
```

### json-v2.ts

JSON serialization for v2 format.

```typescript
interface JsonV2Module {
  /**
   * Serialize asset to JSON string.
   */
  serialize(asset: PixelArtAssetV2): string;

  /**
   * Parse JSON string to asset.
   * Auto-migrates v1 to v2 format.
   */
  parse(json: string): PixelArtAssetV2;

  /**
   * Check if asset is v1 format.
   */
  isV1(data: unknown): boolean;

  /**
   * Migrate v1 asset to v2 format.
   */
  migrateV1toV2(v1: PixelArtAssetV1): PixelArtAssetV2;
}
```

## Usage Notes

These contracts are internal TypeScript interfaces. Implementation should:

1. Export these interfaces from their respective modules
2. Implement all methods as specified
3. Handle errors gracefully (return null/empty rather than throw)
4. Use the data model types from `data-model.md`
