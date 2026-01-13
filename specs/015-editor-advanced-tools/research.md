# Research: Editor Advanced Tools

**Feature**: 015-editor-advanced-tools
**Date**: 2026-01-12

## Research Topics

### 1. Browser Clipboard API for Image Paste

**Decision**: Use Async Clipboard API (`navigator.clipboard.read()`) with fallback to `paste` event

**Rationale**:
- Modern browsers support Async Clipboard API for reading images
- `paste` event provides fallback for browsers without full Clipboard API
- Both methods return image data as Blob that can be drawn to canvas

**Implementation Pattern**:
```typescript
// Primary: Async Clipboard API
const items = await navigator.clipboard.read();
for (const item of items) {
  if (item.types.includes('image/png')) {
    const blob = await item.getType('image/png');
    // Convert blob to ImageBitmap or Image element
  }
}

// Fallback: paste event listener
document.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      // Convert blob to ImageBitmap
    }
  }
});
```

**Alternatives Considered**:
- `document.execCommand('paste')` - Deprecated, inconsistent
- Third-party libraries - Unnecessary overhead for simple use case

**Browser Support**:
- Chrome 66+, Firefox 63+, Safari 13.1+, Edge 79+
- All target browsers supported

---

### 2. Layer Compositing with Canvas 2D

**Decision**: Use multiple offscreen canvases with `globalCompositeOperation` and `globalAlpha`

**Rationale**:
- Canvas 2D is already used in the editor
- No additional dependencies required
- Native browser compositing is GPU-accelerated
- Supports opacity per layer via `globalAlpha`

**Implementation Pattern**:
```typescript
// Each layer has its own offscreen canvas
interface LayerCanvas {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  opacity: number;
  visible: boolean;
}

// Composite all layers to main canvas
function compositeCanvas(layers: LayerCanvas[], target: CanvasRenderingContext2D): void {
  target.clearRect(0, 0, width, height);
  for (const layer of layers) {
    if (!layer.visible) continue;
    target.globalAlpha = layer.opacity;
    target.drawImage(layer.canvas, 0, 0);
  }
  target.globalAlpha = 1.0;
}
```

**Alternatives Considered**:
- WebGL compositing - Overkill for small pixel art canvases
- ImageData pixel manipulation - Slower than drawImage compositing
- CSS layers with multiple canvas elements - Complex DOM management

**Performance**:
- 32 layers at 128x128: <5ms composite time
- Memory: ~64KB per layer (128x128x4 bytes RGBA)

---

### 3. Animation Frame Storage Model

**Decision**: Store frames as array of layer-pixel-data within each layer (shared layer structure)

**Rationale**:
- Matches clarification: "Layers shared across all frames"
- Each layer contains an array of pixel data, indexed by frame
- Layer properties (name, visibility, opacity) apply to all frames
- Enables easy layer-wide edits (e.g., change layer opacity affects all frames)

**Data Structure**:
```typescript
interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  // Pixel data per frame (frame index → pixels)
  frames: Pixel[][];
}

interface AnimatedAsset {
  layers: Layer[];
  frameCount: number;
  fps: number;
  currentFrame: number;
}
```

**Alternatives Considered**:
- Independent layers per frame - Higher memory, complex sync
- Single flat pixel array with frame offsets - Hard to edit individual frames
- Sprite sheet storage - Export format only, not editing format

---

### 4. Animation Playback in Browser

**Decision**: Use `requestAnimationFrame` with frame timing based on FPS

**Rationale**:
- `requestAnimationFrame` provides smooth, battery-efficient animation
- Manual frame timing allows precise FPS control
- Already used in game renderer, consistent pattern

**Implementation Pattern**:
```typescript
class AnimationPlayer {
  private lastFrameTime = 0;
  private frameInterval: number;
  private playing = false;

  constructor(fps: number) {
    this.frameInterval = 1000 / fps;
  }

  tick(timestamp: number): void {
    if (!this.playing) return;

    const elapsed = timestamp - this.lastFrameTime;
    if (elapsed >= this.frameInterval) {
      this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
      this.advanceFrame();
    }

    requestAnimationFrame((t) => this.tick(t));
  }
}
```

**Alternatives Considered**:
- `setInterval` - Less precise, not synced with display refresh
- CSS animations - Not suitable for canvas content
- Web Animations API - Designed for DOM, not canvas

---

### 5. Onion Skinning Rendering

**Decision**: Render adjacent frames with reduced opacity and optional tint

**Rationale**:
- Standard technique in animation software (Aseprite, Krita)
- Simple to implement with Canvas 2D globalAlpha
- Tinting helps distinguish previous (red/blue) from next (green) frames

**Implementation Pattern**:
```typescript
function renderOnionSkin(
  ctx: CanvasRenderingContext2D,
  frames: LayerCanvas[][],
  currentFrame: number,
  options: {
    showPrevious: boolean;
    showNext: boolean;
    previousOpacity: number;  // 0.3 default
    nextOpacity: number;      // 0.2 default
    previousTint: string;     // '#ff0000' (red)
    nextTint: string;         // '#00ff00' (green)
  }
): void {
  // Render previous frame with tint
  if (options.showPrevious && currentFrame > 0) {
    ctx.globalAlpha = options.previousOpacity;
    ctx.filter = `sepia(1) saturate(5) hue-rotate(-50deg)`; // Red tint
    compositeFrame(ctx, frames[currentFrame - 1]);
    ctx.filter = 'none';
  }

  // Render next frame with tint
  if (options.showNext && currentFrame < frames.length - 1) {
    ctx.globalAlpha = options.nextOpacity;
    ctx.filter = `sepia(1) saturate(5) hue-rotate(80deg)`; // Green tint
    compositeFrame(ctx, frames[currentFrame + 1]);
    ctx.filter = 'none';
  }

  ctx.globalAlpha = 1.0;
}
```

**Alternatives Considered**:
- Pixel-level color blending - Slower, more complex
- Separate onion skin canvases - Memory overhead
- WebGL shaders - Overkill for this use case

---

### 6. JSON Format Extension for Layers

**Decision**: Extend existing PixelArtAsset format with backward-compatible `layers` property

**Rationale**:
- Existing assets continue to work (single implicit layer)
- New assets store explicit layer structure
- Migration is automatic on load (FR-013)

**Format**:
```typescript
// Extended format (v2)
interface PixelArtAssetV2 {
  name: string;
  version: 2;  // Bumped from 1
  preset: AssetPreset;
  width: number;
  height: number;
  palette?: string[];

  // NEW: Layer structure
  layers: {
    id: string;
    name: string;
    visible: boolean;
    opacity: number;
    frames: Pixel[][];  // frames[frameIndex] = pixels
  }[];

  // Animation (existing, but now frameCount derived from layers)
  animation?: {
    fps: number;
    // frameWidth, frameHeight, frameCount removed - derived from layers
  };
}

// Migration from v1 to v2
function migrateV1toV2(v1: PixelArtAssetV1): PixelArtAssetV2 {
  return {
    ...v1,
    version: 2,
    layers: [{
      id: generateId(),
      name: 'Layer 1',
      visible: true,
      opacity: 1.0,
      frames: [v1.pixels]  // Single frame with all pixels
    }]
  };
}
```

**Alternatives Considered**:
- Separate layer files - Complex file management
- Binary format - Loses human-readability benefit
- Breaking change to v1 - Would invalidate existing assets

---

## Summary of Decisions

| Topic | Decision | Key Benefit |
|-------|----------|-------------|
| Clipboard | Async Clipboard API + paste event | Cross-browser, native |
| Compositing | Canvas 2D drawImage | No dependencies, GPU-accelerated |
| Frame storage | Per-layer frame arrays | Matches shared-layer model |
| Animation | requestAnimationFrame | Smooth, efficient |
| Onion skinning | Canvas globalAlpha + filter | Simple, standard technique |
| JSON format | Backward-compatible v2 | No migration burden |

All research items resolved. Ready for Phase 1: Design & Contracts.
