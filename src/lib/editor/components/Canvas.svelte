<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { EditorStore } from '../state/editor.svelte.js';
	import { renderAssetV2Zoomed, renderCursor } from '../canvas/render.js';
	import { eventToPixel, isInBounds } from '../utils/coordinates.js';
	import { getTool, createToolContext, resetAllToolStates } from '../tools/types.js';

	interface Props {
		store: EditorStore;
	}

	let { store }: Props = $props();

	let canvas: HTMLCanvasElement | undefined = $state(undefined);
	let ctx: CanvasRenderingContext2D | null = null;
	let isMouseDown = $state(false);
	let currentPixel = $state({ x: -1, y: -1 });

	// Reactive derived values
	const asset = $derived(store.state.asset);
	const zoom = $derived(store.state.zoom);
	const showGrid = $derived(store.state.showGrid);
	const currentTool = $derived(store.state.currentTool);
	const currentColor = $derived(store.state.currentColor);
	const activeLayerId = $derived(store.state.activeLayerId);
	const currentFrame = $derived(store.state.currentFrame);
	const onionSkin = $derived(store.state.onionSkin);

	const canvasWidth = $derived(asset ? asset.width * zoom : 0);
	const canvasHeight = $derived(asset ? asset.height * zoom : 0);

	onDestroy(() => {
		resetAllToolStates();
	});

	function redraw() {
		if (!ctx || !asset) return;
		renderAssetV2Zoomed(ctx, asset, currentFrame, zoom, showGrid, onionSkin);

		// Draw cursor if hovering over valid pixel
		if (currentPixel.x >= 0 && isInBounds(asset, currentPixel.x, currentPixel.y)) {
			renderCursor(ctx, currentPixel.x, currentPixel.y, zoom);
		}
	}

	// Initialize canvas context and redraw when canvas or asset changes
	$effect(() => {
		if (canvas && asset) {
			// Get context if not already set or if canvas changed
			if (!ctx || ctx.canvas !== canvas) {
				ctx = canvas.getContext('2d');
			}
			if (ctx) {
				// Access dependencies to track them for redraw
				const _ = zoom;
				const __ = showGrid;
				const ___ = currentFrame;
				const ____ = onionSkin;
				redraw();
			}
		}
	});

	function getToolContext() {
		if (!asset || !activeLayerId) return null;

		return createToolContext(
			asset,
			activeLayerId,
			currentFrame,
			currentColor,
			(newAsset) => store.updateAsset(newAsset),
			(color) => store.setColor(color),
			redraw,
			() => store.pushUndo()
		);
	}

	function handleMouseDown(event: MouseEvent) {
		if (!asset || !ctx || !canvas) return;

		const pixel = eventToPixel(event, canvas, zoom);
		if (!isInBounds(asset, pixel.x, pixel.y)) return;

		isMouseDown = true;
		currentPixel = pixel;

		const tool = getTool(currentTool);
		const toolCtx = getToolContext();
		if (tool && toolCtx) {
			tool.onMouseDown(toolCtx, pixel.x, pixel.y);
		}

		store.markDirty();
	}

	function handleMouseMove(event: MouseEvent) {
		if (!asset || !ctx || !canvas) return;

		const pixel = eventToPixel(event, canvas, zoom);
		currentPixel = pixel;

		if (isMouseDown && isInBounds(asset, pixel.x, pixel.y)) {
			const tool = getTool(currentTool);
			const toolCtx = getToolContext();
			if (tool && toolCtx) {
				tool.onMouseMove(toolCtx, pixel.x, pixel.y);
			}
		}

		redraw();
	}

	function handleMouseUp() {
		if (!isMouseDown) return;

		isMouseDown = false;

		const tool = getTool(currentTool);
		const toolCtx = getToolContext();
		if (tool && toolCtx) {
			tool.onMouseUp(toolCtx);
		}
	}

	function handleMouseLeave() {
		currentPixel = { x: -1, y: -1 };
		handleMouseUp();
		redraw();
	}

	// Get cursor style based on current tool
	function getCursor(): string {
		const tool = getTool(currentTool);
		return tool?.cursor ?? 'default';
	}
</script>

{#if asset}
	<div class="canvas-container">
		<canvas
			bind:this={canvas}
			width={canvasWidth}
			height={canvasHeight}
			style="cursor: {getCursor()};"
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseleave={handleMouseLeave}
		></canvas>
		<div class="canvas-info">
			{asset.width} x {asset.height} px | Zoom: {zoom}x
			{#if currentPixel.x >= 0 && isInBounds(asset, currentPixel.x, currentPixel.y)}
				| ({currentPixel.x}, {currentPixel.y})
			{/if}
		</div>
	</div>
{:else}
	<div class="no-asset">
		<p>No asset loaded</p>
		<p>Create a new asset or load an existing one</p>
	</div>
{/if}

<style>
	.canvas-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	canvas {
		image-rendering: pixelated;
		image-rendering: crisp-edges;
		border: 1px solid #0f3460;
		background: #1a1a2e;
	}

	.canvas-info {
		font-size: 0.75rem;
		color: #888;
		font-family: monospace;
	}

	.no-asset {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #666;
		text-align: center;
	}

	.no-asset p {
		margin: 0.25rem 0;
	}
</style>
