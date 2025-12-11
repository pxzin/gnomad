/**
 * Color picker tool for the Pixel Art Editor
 */

import type { Tool, ToolContext } from '../types.js';

/**
 * Color picker tool implementation.
 * Samples pixel color on click.
 */
export const pickerTool: Tool = {
	name: 'picker',
	cursor: 'crosshair',

	onMouseDown(ctx: ToolContext, x: number, y: number): void {
		// Get color at clicked position
		const color = ctx.getPixel(x, y);

		if (color) {
			// Set as current drawing color
			ctx.setCurrentColor(color);
		}
		// If pixel is transparent, don't change color
	},

	onMouseMove(_ctx: ToolContext, _x: number, _y: number): void {
		// Picker tool doesn't do anything on mouse move
	},

	onMouseUp(_ctx: ToolContext): void {
		// Picker tool doesn't need cleanup
	}
};
