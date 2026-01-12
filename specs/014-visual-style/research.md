# Research: Visual Style & Resolution

**Feature**: 014-visual-style
**Date**: 2025-12-21

## Research Questions

### Q1: Optimal tile resolution for colony sim games

**Decision**: 32x32 pixels

**Rationale**:
- Provides enough detail for equipment, expressions, and state indicators on gnomes
- Matches successful games in genre (Craft the World, Oxygen Not Included)
- 4x pixel count vs 16x16 but still efficient for web rendering
- Allows for subtle shading and texture details on terrain

**Alternatives Considered**:
- 16x16: Current resolution, faster to create but limiting for detail
- 24x24: Unusual size, tooling support varies
- 64x64: Excessive for browser game, longer asset creation time

### Q2: Background depth techniques in 2D pixel art

**Decision**: Dimming (30-50% darker)

**Rationale**:
- Industry standard for parallax/depth in 2D games
- Simple to implement - single shader/tint operation
- Works consistently across all tile types without per-tile adjustments
- Maintains color relationships while clearly indicating depth

**Alternatives Considered**:
- Desaturation: Can make backgrounds look "dead" or separate from world
- Scale reduction: Creates gaps, complicates collision alignment
- Blue tinting: Works for outdoor but wrong for underground caves
- Combined effects: Over-complicates, harder to maintain consistency

**Implementation Note**: Use PixiJS tint or alpha multiplier at render time. Background tiles can share same source assets as foreground with runtime dimming applied.

### Q3: Sprite outline conventions for pixel art

**Decision**: 1px dark outline (black or dark brown)

**Rationale**:
- Classic pixel art standard since 8/16-bit era
- Provides clear silhouette against any background
- Matches Craft the World aesthetic (chosen reference)
- Helps sprites "pop" from environment

**Alternatives Considered**:
- No outline: Relies heavily on shading, sprites can blend into backgrounds
- Selective outline: Inconsistent appearance, more art decisions per asset
- Colored outline: More complex, requires matching to each sprite's palette

**Implementation Note**: Outline should be part of sprite asset, not added at runtime.

### Q4: Color palette management for game art

**Decision**: Unrestricted palette (artist discretion)

**Rationale**:
- User preference for artistic freedom
- Modern tooling handles unlimited colors efficiently
- Allows organic color choices that feel natural
- No conversion/restriction overhead in asset pipeline

**Alternatives Considered**:
- Limited 32-64 color palette: Better consistency but constraining
- Per-category palettes: More complex management
- Ramp-based: Good for consistency but learning curve for artists

**Consistency Guidelines** (without palette restriction):
- Use consistent lighting direction (top-left light source)
- Maintain similar saturation levels within a scene
- Use complementary colors for foreground/background contrast

### Q5: Sprite proportions for humanoid characters

**Decision**: 32x48 pixels (1.5x tile height)

**Rationale**:
- Standard proportion for "chibi" style pixel art characters
- Head can be ~12px allowing for expressions/states
- Body allows for equipment and pose variation
- Fits well in 1-tile-wide spaces while being taller than terrain

**Alternatives Considered**:
- 32x32 (1:1 with tiles): Too squat, limited expressiveness
- 32x64 (2:1): Too tall, dominates scene, harder to animate

### Q6: Animation frame requirements for gnome states

**Decision**: Defer to per-asset definition (out of scope per spec)

**Rationale**:
- Animation complexity varies by state
- Better defined during actual sprite creation
- Style guide will specify minimum requirements

**General Guidelines**:
- Idle: 2-4 frames (subtle breathing/movement)
- Walking: 4-6 frames
- Mining/Working: 4-6 frames
- Climbing: 4 frames
- Falling: 1-2 frames
- Incapacitated: 1 frame

### Q7: Pixel-perfect rendering in PixiJS

**Decision**: Use nearest-neighbor scaling with integer zoom levels

**Rationale**:
- Prevents blur on pixel art
- PixiJS supports `SCALE_MODE.NEAREST` for textures
- Integer zoom (1x, 2x, 3x) prevents sub-pixel artifacts

**Implementation**:
```typescript
// In texture loading
texture.source.scaleMode = 'nearest';

// In renderer setup
const app = new Application({
  resolution: window.devicePixelRatio,
  autoDensity: true
});
```

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| Tile Resolution | 32x32 pixels |
| Sprite Resolution | 32x48 pixels |
| Background Depth | Dimming (30-50%) |
| Outline Style | 1px dark outline |
| Color Palette | Unrestricted |
| Scaling | Nearest-neighbor, integer zoom |
| Art Direction | Craft the World aesthetic |
