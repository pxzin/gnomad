# Gnomes At Work - Art Style Guide

This guide defines the visual style for all game assets. Follow these specifications to create consistent, high-quality pixel art.

## Resolution

| Asset Type | Dimensions | Ratio |
|------------|------------|-------|
| Tiles | 32 x 32 px | 1:1 |
| Gnome Sprites | 32 x 48 px | 2:3 |
| UI Elements | Variable | Multiples of 8px |

## Art Direction

**Reference**: Craft the World (detailed pixel art style)

**Key Characteristics**:
- Detailed but readable at 1x zoom
- Warm, earthy color tones for underground areas
- Clear silhouettes for all interactive elements
- Consistent top-left lighting

## Outline Requirements

All sprites and foreground tiles **MUST** have a 1-pixel dark outline.

### Outline Colors

Choose based on the dominant color of your asset:

| Color | Hex | Use For |
|-------|-----|---------|
| Black | `#000000` | Default, most elements |
| Dark Brown | `#3D2817` | Organic elements (wood, plants) |
| Dark Gray | `#2A2A2A` | Metallic/stone elements |

### Outline Placement

- Apply to **exterior edges only**
- Use shading (not outlines) for internal details
- Maintain consistent 1px thickness

```
Example (simplified 8x8):
  ██████
  █    █
  █ ▓▓ █   ← Internal detail uses shading
  █ ▓▓ █
  █    █
  ██████   ← 1px outline on exterior
```

## Color Guidelines

### Palette

**Restriction**: None - artist discretion allowed

### Consistency Guidelines

1. **Lighting Direction**: Top-left light source
   - Highlights on top and left edges
   - Shadows on bottom and right edges

2. **Saturation Balance**:
   - Underground: Lower saturation (earthy tones)
   - Surface: Higher saturation (vibrant)
   - Sky: Gradient from bright to deep blue

3. **Contrast**:
   - High contrast between foreground and background
   - Medium contrast within tile details
   - Gnomes should "pop" against any terrain

### Terrain Color Families

| Terrain | Primary Hue | Notes |
|---------|-------------|-------|
| Dirt | Brown (`#8B4513` family) | Warmer near surface |
| Stone | Gray (`#696969` family) | Cooler tones |
| Grass | Green (`#228B22` family) | Vibrant |
| Sand | Tan (`#D2B48C` family) | Warm, bright |
| Ore | Varies | Should stand out from host rock |

## Background Depth

Background blocks appear **40% dimmer** than foreground equivalents.

This is applied automatically at render time - you only need to create the foreground version of each tile.

## Animation Requirements

### Frame Counts

| State | Minimum | Recommended |
|-------|---------|-------------|
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

## Gnome Sprite Sheet Layout

**Total Size**: 320 x 480 pixels (10 columns x 10 rows)

| Row | State | Direction | Frames |
|-----|-------|-----------|--------|
| 0 | Idle | Left | 4 |
| 1 | Idle | Right | 4 |
| 2 | Walk | Left | 6 |
| 3 | Walk | Right | 6 |
| 4 | Mine | Left | 6 |
| 5 | Mine | Right | 6 |
| 6 | Climb | N/A | 4 |
| 7 | Fall | N/A | 2 |
| 8 | Incapacitated | Left | 1 |
| 9 | Incapacitated | Right | 1 |

### Gnome Proportions

- **Head**: ~12px tall (allows expressions)
- **Body**: ~24px
- **Feet**: Align with bottom 4px of frame
- **Colors**: Earthy browns, simple clothing

## File Format

### PNG Requirements

- **Bit Depth**: 32-bit (RGBA)
- **Transparency**: Full alpha channel support
- **Compression**: Maximum (no quality loss)
- **Color Profile**: sRGB

### Naming Convention

```
[type]-[name]-[variant].png

Examples:
  tile-dirt-surface.png
  tile-stone-dark.png
  sprite-gnome-sheet.png
  bg-cave-ambient.png
```

### Directory Structure

```
static/assets/
├── tiles/
│   ├── terrain/      # Foreground tiles (32x32)
│   └── backgrounds/  # Background textures (32x32)
├── sprites/
│   └── gnome/        # Gnome sprite sheets (32x48 per frame)
└── ui/               # UI elements (various sizes)
```

---

## Asset Compliance Checklist

Before submitting any asset, verify:

### Dimensions
- [ ] Tiles are exactly 32x32 pixels
- [ ] Gnome frames are exactly 32x48 pixels
- [ ] UI elements use multiples of 8px

### Visual Style
- [ ] 1px dark outline on exterior edges
- [ ] Lighting from top-left
- [ ] No upscaled/blurry pixels
- [ ] Colors complement existing assets

### File Format
- [ ] PNG format with transparency
- [ ] 32-bit RGBA color
- [ ] Follows naming convention

### Animation (if applicable)
- [ ] All frames are consistent size
- [ ] Animation loops seamlessly
- [ ] Minimum frame count met

---

## Example Assets

### Good Tile Example

A well-made 32x32 dirt tile should have:
- Clear 1px black outline on all solid edges
- Top-left lighting (lighter top-left, darker bottom-right)
- Subtle texture variation (not flat color)
- Seamless tiling capability

### Good Gnome Example

A well-made gnome sprite should have:
- Clear silhouette visible against any background
- Distinct state recognition (idle vs walking vs mining)
- Consistent proportions across all frames
- Feet aligned to bottom of frame for proper ground contact

---

## Reference

For detailed technical specifications, see:
- `specs/014-visual-style/contracts/README.md` - Full style contract
- `specs/014-visual-style/data-model.md` - Asset specifications
- `specs/014-visual-style/quickstart.md` - Implementation guide
