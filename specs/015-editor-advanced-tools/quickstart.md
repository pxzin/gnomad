# Quickstart: Editor Advanced Tools

**Feature**: 015-editor-advanced-tools
**Date**: 2026-01-12

## Prerequisites

- Node.js 18+
- pnpm installed
- Project dependencies installed (`pnpm install`)

## Development Commands

```bash
# Start development server (includes editor at /editor)
pnpm dev

# Type check
pnpm check

# Lint
pnpm lint

# Build for production
pnpm build
```

## Feature Testing Checklist

### US1: Paste External Images (P1)

1. Open editor at `http://localhost:5173/editor`
2. Create or load an asset
3. Copy an image to clipboard (screenshot, image from browser, etc.)
4. Press Ctrl+V (Cmd+V on Mac)
5. Verify:
   - [ ] Image pixels appear at top-left (0,0)
   - [ ] Image is cropped if larger than canvas
   - [ ] New colors added to palette
   - [ ] Transparency preserved
   - [ ] New layer created for pasted content

### US2: Multiple Layers (P2)

1. Create a new asset
2. In the Layer Panel:
   - [ ] Click "+" to create new layer
   - [ ] Verify new layer appears above current
   - [ ] Draw on new layer - verify only that layer affected
   - [ ] Click eye icon to toggle visibility
   - [ ] Drag layer to reorder
   - [ ] Double-click to rename
   - [ ] Adjust opacity slider
   - [ ] Click merge icon to merge down
   - [ ] Click flatten to flatten all
3. Save and reload:
   - [ ] Verify layer structure preserved

### US3: Animation Timeline (P3)

1. Create or load an asset
2. Enable animation mode (if not preset)
3. In the Timeline Panel:
   - [ ] Click "+" to add frame
   - [ ] Click frame thumbnail to select
   - [ ] Draw on selected frame
   - [ ] Click play to preview animation
   - [ ] Adjust FPS slider
   - [ ] Drag frame to reorder
   - [ ] Right-click to duplicate/delete frame
4. Export PNG:
   - [ ] Verify sprite sheet contains all frames

### US4: Onion Skinning (P4)

1. Open animation with 3+ frames
2. Toggle onion skinning on (lightbulb icon)
3. Verify:
   - [ ] Previous frame visible as red-tinted overlay
   - [ ] Toggle "show next" - green-tinted overlay appears
   - [ ] Adjust opacity sliders
   - [ ] Navigate frames - overlays update
   - [ ] Drawing only affects current frame

## Key Files to Modify

### New Files

| File | Purpose |
|------|---------|
| `src/lib/editor/components/LayerPanel.svelte` | Layer management UI |
| `src/lib/editor/components/Timeline.svelte` | Animation timeline UI |
| `src/lib/editor/clipboard/paste.ts` | Clipboard image handling |
| `src/lib/editor/canvas/composite.ts` | Layer compositing |
| `src/lib/editor/animation/playback.ts` | Animation preview |
| `src/lib/editor/animation/onion-skin.ts` | Onion skinning renderer |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/editor/types.ts` | Add Layer, Frame, Timeline, OnionSkin types |
| `src/lib/editor/state/editor.svelte.ts` | Add layer/frame/animation operations |
| `src/lib/editor/canvas/render.ts` | Update for layer compositing |
| `src/lib/editor/io/json.ts` | Support v2 format with layers |
| `src/lib/editor/io/png.ts` | Flatten layers on export |
| `src/lib/editor/utils/validation.ts` | Validate v2 format |

## Common Issues

### Clipboard paste not working
- Check browser console for permission errors
- Ensure clipboard contains image data (not file path)
- Try using paste event fallback (focus canvas, then Ctrl+V)

### Layers not rendering correctly
- Check layer visibility (eye icon)
- Check layer opacity (0 = invisible)
- Verify correct layer is selected for editing

### Animation not playing
- Ensure asset has animation enabled
- Check FPS is > 0
- Verify more than 1 frame exists

### Onion skin not showing
- Toggle enabled state
- Check opacity is > 0
- Must have adjacent frames (previous/next)

## Performance Notes

- Warning displayed when exceeding 32 layers
- Layer composite cached until layer data changes
- Animation preview targets 30 FPS max
- Large assets (128x128) with many layers may have slight delay

## Related Documentation

- [Specification](./spec.md)
- [Data Model](./data-model.md)
- [Research](./research.md)
- [Contracts](./contracts/README.md)
