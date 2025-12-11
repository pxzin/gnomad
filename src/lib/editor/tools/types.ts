/**
 * Tool types and registry for the Pixel Art Editor
 */

import type { Tool, EditorTool, ToolContext, PixelArtAsset } from '../types.js';
import { pencilTool, resetPencilState } from './pencil.js';
import { eraserTool, resetEraserState } from './eraser.js';
import { fillTool } from './fill.js';
import { pickerTool } from './picker.js';
import { setPixel, clearPixel, getPixel } from '../canvas/operations.js';

/**
 * Tool registry - maps tool names to implementations.
 */
const toolRegistry = new Map<EditorTool, Tool>();

// Register all built-in tools
toolRegistry.set('pencil', pencilTool);
toolRegistry.set('eraser', eraserTool);
toolRegistry.set('fill', fillTool);
toolRegistry.set('picker', pickerTool);

/**
 * Get tool implementation by name.
 */
export function getTool(name: EditorTool): Tool | undefined {
	return toolRegistry.get(name);
}

/**
 * Register a tool implementation.
 */
export function registerTool(tool: Tool): void {
	toolRegistry.set(tool.name, tool);
}

/**
 * Get all registered tool names.
 */
export function getRegisteredTools(): EditorTool[] {
	return Array.from(toolRegistry.keys());
}

/**
 * Reset all tool states.
 * Call this when switching tools or cleaning up.
 */
export function resetAllToolStates(): void {
	resetPencilState();
	resetEraserState();
}

/**
 * Create a tool context for the current editing session.
 */
export function createToolContext(
	asset: PixelArtAsset,
	color: string,
	onAssetChange: (asset: PixelArtAsset) => void,
	onColorChange: (color: string) => void,
	onRedraw: () => void,
	onPushUndo: () => void
): ToolContext {
	let currentAsset = asset;

	return {
		get asset() {
			return currentAsset;
		},
		color,

		setPixel(x: number, y: number, pixelColor: string): void {
			currentAsset = setPixel(currentAsset, x, y, pixelColor);
			onAssetChange(currentAsset);
		},

		clearPixel(x: number, y: number): void {
			currentAsset = clearPixel(currentAsset, x, y);
			onAssetChange(currentAsset);
		},

		getPixel(x: number, y: number): string | null {
			return getPixel(currentAsset, x, y);
		},

		setCurrentColor(newColor: string): void {
			onColorChange(newColor);
		},

		redraw(): void {
			onRedraw();
		},

		pushUndo(): void {
			onPushUndo();
		}
	};
}

/**
 * Tool info for UI display.
 */
export interface ToolInfo {
	name: EditorTool;
	displayName: string;
	shortcut: string;
	icon: string;
}

/**
 * Get tool display information.
 */
export function getToolInfo(name: EditorTool): ToolInfo {
	const info: Record<EditorTool, ToolInfo> = {
		pencil: { name: 'pencil', displayName: 'Pencil', shortcut: 'P', icon: 'pencil' },
		eraser: { name: 'eraser', displayName: 'Eraser', shortcut: 'E', icon: 'eraser' },
		fill: { name: 'fill', displayName: 'Fill', shortcut: 'G', icon: 'paint-bucket' },
		picker: { name: 'picker', displayName: 'Color Picker', shortcut: 'I', icon: 'eyedropper' }
	};
	return info[name];
}

/**
 * Get all tool info for UI display.
 */
export function getAllToolInfo(): ToolInfo[] {
	return (['pencil', 'eraser', 'fill', 'picker'] as EditorTool[]).map(getToolInfo);
}
