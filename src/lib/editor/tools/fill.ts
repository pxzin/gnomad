/**
 * Fill tool for the Pixel Art Editor
 */

import type { Tool, ToolContext, Pixel } from '../types.js';

/**
 * Get current layer pixels from v2 asset
 */
function getActiveLayerPixels(ctx: ToolContext): { pixels: Pixel[]; layerId: string; frameIndex: number } | null {
	const layer = ctx.asset.layers.find((l) => l.visible);
	if (!layer) return null;

	// Get the current frame index from the first layer
	const frameIndex = 0; // TODO: This should come from context when currentFrame is exposed
	const pixels = layer.frames[frameIndex] ?? [];

	return { pixels, layerId: layer.id, frameIndex };
}

/**
 * Simple flood fill that uses the context's setPixel method.
 */
function simpleFloodFill(
	ctx: ToolContext,
	startX: number,
	startY: number,
	fillColor: string,
	width: number,
	height: number
): void {
	// Get the target color at start position
	const targetColor = ctx.getPixel(startX, startY);

	// If target color is same as fill color, nothing to do
	if (targetColor === fillColor) {
		return;
	}

	// Flood fill algorithm
	const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
	const visited = new Set<string>();
	const filledPixels: Array<{ x: number; y: number }> = [];

	while (stack.length > 0) {
		const { x, y } = stack.pop()!;
		const key = `${x},${y}`;

		// Skip if already visited
		if (visited.has(key)) continue;

		// Skip if out of bounds
		if (x < 0 || x >= width || y < 0 || y >= height) continue;

		// Get current pixel color
		const currentColor = ctx.getPixel(x, y);

		// Check if this pixel matches the target color
		if (targetColor === null) {
			// Filling transparent area - only fill if current is also transparent
			if (currentColor !== null) continue;
		} else {
			// Filling colored area - only fill if current matches target (ignoring alpha for comparison)
			if (currentColor === null) continue;
			// Simple comparison - consider same if base colors match
			if (currentColor.substring(0, 7).toUpperCase() !== targetColor.substring(0, 7).toUpperCase()) continue;
		}

		// Mark as visited
		visited.add(key);
		filledPixels.push({ x, y });

		// Add neighbors to stack (4-connectivity)
		stack.push({ x: x + 1, y });
		stack.push({ x: x - 1, y });
		stack.push({ x, y: y + 1 });
		stack.push({ x, y: y - 1 });
	}

	// Apply all filled pixels
	for (const { x, y } of filledPixels) {
		ctx.setPixel(x, y, fillColor);
	}
}

/**
 * Fill tool implementation.
 * Flood fills connected areas on click.
 */
export const fillTool: Tool = {
	name: 'fill',
	cursor: 'crosshair',

	onMouseDown(ctx: ToolContext, x: number, y: number): void {
		// Push undo state before filling
		ctx.pushUndo();

		// Perform simple flood fill using context methods
		simpleFloodFill(ctx, x, y, ctx.color, ctx.asset.width, ctx.asset.height);

		ctx.redraw();
	},

	onMouseMove(_ctx: ToolContext, _x: number, _y: number): void {
		// Fill tool doesn't do anything on mouse move
	},

	onMouseUp(_ctx: ToolContext): void {
		// Fill tool doesn't need cleanup
	}
};
