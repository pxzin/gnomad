# Data Model: Editor Advanced Tools

**Feature**: 015-editor-advanced-tools
**Date**: 2026-01-12

## Entity Definitions

### Layer

A single drawing surface shared across all animation frames.

```typescript
interface Layer {
  /** Unique identifier for the layer */
  id: string;

  /** User-visible name (default: "Layer N") */
  name: string;

  /** Whether layer is visible in canvas and export */
  visible: boolean;

  /** Opacity from 0.0 (transparent) to 1.0 (opaque) */
  opacity: number;

  /**
   * Pixel data per frame.
   * frames[frameIndex] contains the Pixel[] for that frame.
   * All frames share the same layer structure.
   */
  frames: Pixel[][];
}
```

**Validation Rules**:
- `id`: Non-empty string, unique within asset
- `name`: Non-empty string, max 50 characters
- `visible`: Boolean
- `opacity`: Number in range [0.0, 1.0]
- `frames`: Array with length matching asset frameCount; each element is Pixel[]

**State Transitions**:
- Created → visible=true, opacity=1.0, frames=[[]] (single empty frame)
- Toggle visibility: visible ↔ !visible
- Adjust opacity: opacity = clamp(newValue, 0.0, 1.0)
- Delete: Remove from layers array, reassign indices

---

### Frame

A single moment in an animation. Frames are implicit - they exist as indices into Layer.frames arrays.

```typescript
// Frame is not a standalone entity; it's an index into layer data
type FrameIndex = number;

// Frame metadata is stored at asset level
interface FrameMetadata {
  /** Total number of frames in the animation */
  frameCount: number;

  /** Currently selected frame for editing */
  currentFrame: FrameIndex;
}
```

**Validation Rules**:
- `frameCount`: Integer >= 1
- `currentFrame`: Integer in range [0, frameCount - 1]

**State Transitions**:
- Add frame: frameCount++, insert empty Pixel[] at index in each layer
- Delete frame: frameCount--, remove Pixel[] at index from each layer (min 1 frame)
- Reorder frame: Swap Pixel[] arrays at indices in all layers
- Duplicate frame: frameCount++, deep copy Pixel[] at index to new position

---

### Timeline

Animation playback state and configuration.

```typescript
interface Timeline {
  /** Frames per second for playback (1-30) */
  fps: number;

  /** Whether animation is currently playing */
  playing: boolean;

  /** Whether to loop playback */
  loop: boolean;
}
```

**Validation Rules**:
- `fps`: Integer in range [1, 30]
- `playing`: Boolean
- `loop`: Boolean

**State Transitions**:
- Play: playing = true
- Pause: playing = false
- Stop: playing = false, currentFrame = 0
- Change FPS: fps = clamp(newValue, 1, 30)

---

### OnionSkinSettings

Configuration for onion skinning overlay.

```typescript
interface OnionSkinSettings {
  /** Whether onion skinning is enabled */
  enabled: boolean;

  /** Show previous frame overlay */
  showPrevious: boolean;

  /** Show next frame overlay */
  showNext: boolean;

  /** Opacity for previous frame (0.0-1.0) */
  previousOpacity: number;

  /** Opacity for next frame (0.0-1.0) */
  nextOpacity: number;
}
```

**Validation Rules**:
- `enabled`: Boolean
- `showPrevious`: Boolean
- `showNext`: Boolean
- `previousOpacity`: Number in range [0.0, 1.0], default 0.3
- `nextOpacity`: Number in range [0.0, 1.0], default 0.2

---

### ClipboardImage

Temporary structure for handling pasted image data.

```typescript
interface ClipboardImage {
  /** Source image dimensions */
  width: number;
  height: number;

  /** RGBA pixel data (width * height * 4 bytes) */
  data: Uint8ClampedArray;
}
```

**Validation Rules**:
- `width`: Integer > 0
- `height`: Integer > 0
- `data`: Uint8ClampedArray with length = width * height * 4

---

## Extended Asset Format (v2)

```typescript
interface PixelArtAssetV2 {
  /** Asset identifier */
  name: string;

  /** Format version - MUST be 2 for layered assets */
  version: 2;

  /** Preset type */
  preset: AssetPreset;

  /** Canvas dimensions */
  width: number;
  height: number;

  /** Color palette (optional) */
  palette?: string[];

  /** Layer stack (bottom to top) */
  layers: Layer[];

  /** Animation configuration (optional, enables animation mode) */
  animation?: {
    fps: number;
  };
}
```

**Backward Compatibility**:
- Version 1 assets (flat `pixels` array) are auto-migrated to v2 on load
- Migration creates single layer named "Layer 1" with original pixels
- Saved assets always use v2 format

---

## Entity Relationships

```
PixelArtAssetV2
├── layers: Layer[] (1:N, ordered)
│   └── frames: Pixel[][] (1:N per layer, indexed by frame)
└── animation?: AnimationConfig (0:1)

EditorState (extended)
├── asset: PixelArtAssetV2 | null
├── activeLayerId: string | null
├── timeline: Timeline
└── onionSkin: OnionSkinSettings
```

---

## State Management Extensions

### EditorState Additions

```typescript
interface EditorState {
  // ...existing fields...

  /** Currently selected layer ID */
  activeLayerId: string | null;

  /** Animation timeline state */
  timeline: Timeline;

  /** Onion skinning configuration */
  onionSkin: OnionSkinSettings;
}
```

### Default Values

```typescript
const DEFAULT_TIMELINE: Timeline = {
  fps: 8,
  playing: false,
  loop: true
};

const DEFAULT_ONION_SKIN: OnionSkinSettings = {
  enabled: false,
  showPrevious: true,
  showNext: false,
  previousOpacity: 0.3,
  nextOpacity: 0.2
};
```

---

## Indexes and Queries

### Layer Operations
- Get layer by ID: `layers.find(l => l.id === id)`
- Get active layer: `layers.find(l => l.id === activeLayerId)`
- Get visible layers (for composite): `layers.filter(l => l.visible)`
- Layer count: `layers.length`

### Frame Operations
- Get current frame pixels for layer: `layer.frames[currentFrame]`
- Frame count: `layers[0]?.frames.length ?? 1`
- All layers at frame: `layers.map(l => l.frames[frameIndex])`

### Performance Considerations
- Layer limit warning at 32+ (memory: ~2MB for 32 layers at 128x128)
- Frame pixels use sparse format (only non-transparent pixels stored)
- Composite cache invalidated on any layer change
