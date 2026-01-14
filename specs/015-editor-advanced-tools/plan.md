# Implementation Plan: Editor Advanced Tools

**Branch**: `015-editor-advanced-tools` | **Date**: 2026-01-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-editor-advanced-tools/spec.md`

## Summary

Add advanced pixel art editing capabilities: clipboard paste support for importing external images, a multi-layer system for non-destructive editing, an animation timeline with frame management, and onion skinning for smooth animation creation. The implementation extends the existing editor architecture using Svelte 5 runes for state management and Canvas 2D for rendering.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: SvelteKit 2.x, Svelte 5 (runes), Canvas 2D API, PixiJS v8 (preview), browser-fs-access
**Storage**: JSON files (source assets), PNG files (exports), browser localStorage (preferences)
**Testing**: Manual testing (existing pattern), Svelte component testing
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge) with Clipboard API support
**Project Type**: Web application (SvelteKit)
**Performance Goals**: Layer operations <100ms, animation preview at 30 FPS, 32+ layers without lag
**Constraints**: Max canvas 128x128px, browser memory limits, Clipboard API availability
**Scale/Scope**: Single-user editor, assets up to 128x128, unlimited layers (warning at 32+)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety First | ✅ PASS | All new types (Layer, Frame, Timeline) will have explicit interfaces |
| II. Entity-Component Architecture | ⚠️ N/A | Editor uses store pattern, not ECS (separate from game) |
| III. Documentation as Specification | ✅ PASS | Spec complete with clarifications, plan documents design |
| IV. Simplicity and YAGNI | ✅ PASS | Starting with minimal layer/frame implementation |
| V. Deterministic Game State | ⚠️ N/A | Editor is not game state; user tool, not simulation |

**Gate Result**: PASS - No violations. Editor is a separate tool, not part of game simulation.

## Project Structure

### Documentation (this feature)

```text
specs/015-editor-advanced-tools/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/lib/editor/
├── types.ts                    # Extended with Layer, Frame, Timeline types
├── state/
│   └── editor.svelte.ts        # Extended store with layer/frame operations
├── components/
│   ├── Canvas.svelte           # Updated for layer compositing
│   ├── LayerPanel.svelte       # NEW: Layer management UI
│   ├── Timeline.svelte         # NEW: Animation timeline UI
│   └── ...existing...
├── canvas/
│   ├── render.ts               # Updated for layer compositing
│   ├── composite.ts            # NEW: Layer flattening logic
│   └── ...existing...
├── clipboard/
│   └── paste.ts                # NEW: Clipboard image handling
├── animation/
│   ├── playback.ts             # NEW: Animation preview logic
│   └── onion-skin.ts           # NEW: Onion skinning renderer
├── io/
│   ├── json.ts                 # Updated for layer/frame serialization
│   └── png.ts                  # Updated for layer flattening on export
└── utils/
    └── ...existing...
```

**Structure Decision**: Extend existing `src/lib/editor/` structure with new modules for clipboard, animation, and layer management. No new top-level directories needed.

## Complexity Tracking

> No constitution violations requiring justification.

| Aspect | Approach | Rationale |
|--------|----------|-----------|
| Layer storage | Array in asset JSON | Simplest format, easy serialization |
| Frame storage | Per-layer pixel arrays | Matches shared-layer model from spec |
| Composite rendering | Canvas 2D drawImage | Native browser API, no dependencies |
