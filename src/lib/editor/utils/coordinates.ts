/**
 * Coordinate utilities for the Pixel Art Editor
 */

import type { PixelArtAsset } from '../types.js';

/**
 * Convert mouse event to pixel coordinates.
 * Takes into account canvas position and zoom level.
 */
export function eventToPixel(
	event: MouseEvent,
	canvas: HTMLCanvasElement,
	zoom: number
): { x: number; y: number } {
	const rect = canvas.getBoundingClientRect();
	const x = Math.floor((event.clientX - rect.left) / zoom);
	const y = Math.floor((event.clientY - rect.top) / zoom);
	return { x, y };
}

/**
 * Check if coordinates are within asset bounds.
 */
export function isInBounds(asset: PixelArtAsset, x: number, y: number): boolean {
	return x >= 0 && x < asset.width && y >= 0 && y < asset.height;
}

/**
 * Clamp coordinates to asset bounds.
 */
export function clampToBounds(
	asset: PixelArtAsset,
	x: number,
	y: number
): { x: number; y: number } {
	return {
		x: Math.max(0, Math.min(asset.width - 1, x)),
		y: Math.max(0, Math.min(asset.height - 1, y))
	};
}

/**
 * Convert pixel coordinates to canvas coordinates (accounting for zoom).
 */
export function pixelToCanvas(
	x: number,
	y: number,
	zoom: number
): { x: number; y: number } {
	return {
		x: x * zoom,
		y: y * zoom
	};
}

/**
 * Get the index in a flat pixel array for given coordinates.
 * Used for ImageData manipulation.
 */
export function coordsToIndex(x: number, y: number, width: number): number {
	return (y * width + x) * 4; // RGBA = 4 bytes per pixel
}
