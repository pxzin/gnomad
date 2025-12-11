/**
 * Eraser tool for the Pixel Art Editor
 */

import type { Tool, ToolContext } from '../types.js';
import { bresenhamLine } from '../canvas/drawing.js';

/**
 * Track erasing state
 */
let isErasing = false;
let lastX = -1;
let lastY = -1;

/**
 * Eraser tool implementation.
 * Clears pixels with line interpolation for smooth strokes.
 */
export const eraserTool: Tool = {
	name: 'eraser',
	cursor: 'crosshair',

	onMouseDown(ctx: ToolContext, x: number, y: number): void {
		// Push undo state before starting to erase
		ctx.pushUndo();

		isErasing = true;
		lastX = x;
		lastY = y;

		// Clear single pixel
		ctx.clearPixel(x, y);
		ctx.redraw();
	},

	onMouseMove(ctx: ToolContext, x: number, y: number): void {
		if (!isErasing) return;

		// Skip if same position
		if (x === lastX && y === lastY) return;

		// Erase line from last position to current position
		const points = bresenhamLine(lastX, lastY, x, y);

		// Skip the first point as it was already erased
		for (let i = 1; i < points.length; i++) {
			const point = points[i];
			if (point) {
				ctx.clearPixel(point.x, point.y);
			}
		}

		lastX = x;
		lastY = y;
		ctx.redraw();
	},

	onMouseUp(_ctx: ToolContext): void {
		isErasing = false;
		lastX = -1;
		lastY = -1;
	}
};

/**
 * Reset eraser tool state.
 */
export function resetEraserState(): void {
	isErasing = false;
	lastX = -1;
	lastY = -1;
}
