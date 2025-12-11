/**
 * Fill tool for the Pixel Art Editor
 */

import type { Tool, ToolContext, PixelArtAsset } from '../types.js';
import { floodFill } from '../canvas/drawing.js';

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

		// Perform flood fill
		const filledAsset = floodFill(ctx.asset, x, y, ctx.color);

		// Update all changed pixels
		// We need to sync the changes back through the context
		const originalPixelMap = new Map(
			ctx.asset.pixels.map((p) => [`${p.x},${p.y}`, p.color])
		);
		const filledPixelMap = new Map(
			filledAsset.pixels.map((p) => [`${p.x},${p.y}`, p.color])
		);

		// Find pixels that changed
		for (const [key, color] of filledPixelMap) {
			const originalColor = originalPixelMap.get(key);
			if (originalColor !== color) {
				const parts = key.split(',');
				const px = Number(parts[0]);
				const py = Number(parts[1]);
				ctx.setPixel(px, py, color);
			}
		}

		// Find pixels that were added (previously transparent)
		for (const [key, color] of filledPixelMap) {
			if (!originalPixelMap.has(key)) {
				const parts = key.split(',');
				const px = Number(parts[0]);
				const py = Number(parts[1]);
				ctx.setPixel(px, py, color);
			}
		}

		ctx.redraw();
	},

	onMouseMove(_ctx: ToolContext, _x: number, _y: number): void {
		// Fill tool doesn't do anything on mouse move
	},

	onMouseUp(_ctx: ToolContext): void {
		// Fill tool doesn't need cleanup
	}
};
