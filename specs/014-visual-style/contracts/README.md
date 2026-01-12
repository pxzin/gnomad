# Visual Style Contract

**Feature**: 014-visual-style
**Version**: 1.0.0
**Date**: 2025-12-21

This document defines the visual style contract for all Gnomes At Work assets. All artists and asset creators MUST follow these specifications.

## Core Specifications

### Resolution

| Asset Type | Dimensions | Ratio |
|------------|------------|-------|
| Tiles | 32 x 32 px | 1:1 |
| Gnome Sprites | 32 x 48 px | 2:3 |
| UI Elements | Variable | Multiples of 8px |

### Art Direction

**Reference**: Craft the World (high-res detailed pixel art)

**Style Characteristics**:
- Detailed but readable at 1x zoom
- Warm, earthy color tones for underground
- Clear silhouettes for all interactive elements
- Consistent lighting (top-left source)

## Outline Rules

### Required: 1px Dark Outline

All sprites and foreground tiles MUST have a 1-pixel outline.

**Outline Colors** (choose based on dominant sprite color):
- Black: `#000000` - Default for most elements
- Dark Brown: `#3D2817` - Warmer option for organic elements
- Dark Gray: `#2A2A2A` - For metallic/stone elements

**Outline Placement**:
- Exterior edges only (selective outline)
- Internal details use shading, not outlines
- Outline should be consistent thickness (1px)

```
Example (8x8 simplified):
  ██████
  █    █
  █ ▓▓ █   ← Internal detail uses shading, no outline
  █ ▓▓ █
  █    █
  ██████   ← 1px black outline on exterior
```

## Background Depth

### Dimming Specification

Background blocks appear 30-50% darker than foreground equivalents.

**Implementation**: Runtime tint via PixiJS
```typescript
// Background tile rendering
sprite.tint = 0x999999; // 60% brightness (40% dimmed)
```

**Visual Effect**:
- Foreground: Full color, sharp outlines
- Background: Muted color, softer appearance
- Creates clear depth distinction

## Color Guidelines

### Palette

**Restriction**: None (artist discretion)

**Guidelines for Consistency**:

1. **Lighting Direction**: Top-left light source
   - Highlights on top and left edges
   - Shadows on bottom and right edges

2. **Saturation Balance**:
   - Underground: Lower saturation (earthy)
   - Surface: Higher saturation (vibrant)
   - Sky: Gradient from bright to deep blue

3. **Contrast**:
   - High contrast between foreground and background
   - Medium contrast within tile details
   - Gnomes should "pop" against any terrain

### Terrain Color Families

| Terrain | Primary Hue | Notes |
|---------|-------------|-------|
| Dirt | Brown (#8B4513 family) | Warmer near surface |
| Stone | Gray (#696969 family) | Cooler tones |
| Grass | Green (#228B22 family) | Vibrant |
| Sand | Tan (#D2B48C family) | Warm, bright |
| Ore | Varies | Should stand out from host rock |

## Animation Requirements

### Frame Counts (Minimum)

| State | Min Frames | Recommended |
|-------|------------|-------------|
| Idle | 2 | 4 |
| Walking | 4 | 6 |
| Mining | 4 | 6 |
| Climbing | 2 | 4 |
| Falling | 1 | 2 |
| Incapacitated | 1 | 1 |

### Animation Principles

1. **Timing**: 100-150ms per frame for most animations
2. **Looping**: All animations should loop seamlessly
3. **Anticipation**: Mining/working should show wind-up
4. **Squash/Stretch**: Subtle for pixel art (1-2px max)

## File Format Contract

### PNG Requirements

- **Bit Depth**: 32-bit (RGBA)
- **Transparency**: Full alpha channel support
- **Compression**: Maximum (no quality loss)
- **Color Profile**: sRGB

### Naming Convention

```text
[type]-[name]-[variant].png

Examples:
  tile-dirt-surface.png
  tile-stone-dark.png
  sprite-gnome-sheet.png
  bg-cave-ambient.png
```

### Sprite Sheet Layout

For animated sprites, use horizontal strips:

```text
Frame 1 | Frame 2 | Frame 3 | Frame 4 | ...
  32px  |  32px   |  32px   |  32px   |
```

Multiple animations stack vertically:
```text
Row 0: Idle Left      (frames 0-3)
Row 1: Idle Right     (frames 0-3)
Row 2: Walk Left      (frames 0-5)
Row 3: Walk Right     (frames 0-5)
...
```

## Compliance Checklist

Before submitting any asset:

- [ ] Dimensions match specification (32x32 or 32x48)
- [ ] 1px dark outline present on exterior
- [ ] PNG format with transparency
- [ ] Lighting from top-left
- [ ] Naming follows convention
- [ ] Animation frames are consistent size
- [ ] No upscaled/blurry pixels
- [ ] Colors complement existing assets
