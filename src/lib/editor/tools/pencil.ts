/**
 * Pencil tool for the Pixel Art Editor
 */

import type { Tool, ToolContext } from '../types.js';
import { bresenhamLine } from '../canvas/drawing.js';

/**
 * Track drawing state
 */
let isDrawing = false;
let lastX = -1;
let lastY = -1;

/**
 * Pencil tool implementation.
 * Draws pixels with line interpolation for smooth strokes.
 */
export const pencilTool: Tool = {
	name: 'pencil',
	cursor: 'crosshair',

	onMouseDown(ctx: ToolContext, x: number, y: number): void {
		// Push undo state before starting to draw
		ctx.pushUndo();

		isDrawing = true;
		lastX = x;
		lastY = y;

		// Draw single pixel
		ctx.setPixel(x, y, ctx.color);
		ctx.redraw();
	},

	onMouseMove(ctx: ToolContext, x: number, y: number): void {
		if (!isDrawing) return;

		// Skip if same position
		if (x === lastX && y === lastY) return;

		// Draw line from last position to current position
		const points = bresenhamLine(lastX, lastY, x, y);

		// Skip the first point as it was already drawn
		for (let i = 1; i < points.length; i++) {
			const point = points[i];
			if (point) {
				ctx.setPixel(point.x, point.y, ctx.color);
			}
		}

		lastX = x;
		lastY = y;
		ctx.redraw();
	},

	onMouseUp(_ctx: ToolContext): void {
		isDrawing = false;
		lastX = -1;
		lastY = -1;
	}
};

/**
 * Reset pencil tool state.
 * Call this when switching tools or cleaning up.
 */
export function resetPencilState(): void {
	isDrawing = false;
	lastX = -1;
	lastY = -1;
}
