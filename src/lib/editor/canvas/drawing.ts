/**
 * Drawing algorithms for the Pixel Art Editor
 */

import type { PixelArtAsset, PixelArtAssetV2, Pixel } from '../types.js';
import { setPixels, clearPixels, createPixelMap, pixelMapToArray } from './operations.js';
import { hexColorsEqual } from '../utils/color.js';

/**
 * Generate points along a line using Bresenham's algorithm.
 * Returns array of pixel coordinates.
 */
export function bresenhamLine(
	x0: number,
	y0: number,
	x1: number,
	y1: number
): Array<{ x: number; y: number }> {
	const points: Array<{ x: number; y: number }> = [];

	const dx = Math.abs(x1 - x0);
	const dy = Math.abs(y1 - y0);
	const sx = x0 < x1 ? 1 : -1;
	const sy = y0 < y1 ? 1 : -1;
	let err = dx - dy;

	let currentX = x0;
	let currentY = y0;

	while (true) {
		points.push({ x: currentX, y: currentY });

		if (currentX === x1 && currentY === y1) break;

		const e2 = 2 * err;
		if (e2 > -dy) {
			err -= dy;
			currentX += sx;
		}
		if (e2 < dx) {
			err += dx;
			currentY += sy;
		}
	}

	return points;
}

/**
 * Draw a line using Bresenham's algorithm.
 * Returns new asset with line drawn.
 */
export function drawLine(
	asset: PixelArtAsset,
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	color: string
): PixelArtAsset {
	const points = bresenhamLine(x0, y0, x1, y1);
	const pixelsToSet = points.map((p) => ({ ...p, color }));
	return setPixels(asset, pixelsToSet);
}

/**
 * Erase a line (make pixels transparent).
 */
export function eraseLine(
	asset: PixelArtAsset,
	x0: number,
	y0: number,
	x1: number,
	y1: number
): PixelArtAsset {
	const points = bresenhamLine(x0, y0, x1, y1);
	return clearPixels(asset, points);
}

/**
 * Flood fill from starting point.
 * Returns new asset with fill applied.
 * Uses stack-based 4-connectivity algorithm.
 */
export function floodFill(
	asset: PixelArtAsset,
	startX: number,
	startY: number,
	fillColor: string
): PixelArtAsset {
	// Validate bounds
	if (startX < 0 || startX >= asset.width || startY < 0 || startY >= asset.height) {
		return asset;
	}

	// Create pixel map for efficient lookups
	const pixelMap = createPixelMap(asset);

	// Get target color (color we're replacing)
	const targetColor = pixelMap.get(`${startX},${startY}`) ?? null;

	// If target color is same as fill color, nothing to do
	if (targetColor !== null && hexColorsEqual(targetColor, fillColor)) {
		return asset;
	}

	// If filling transparent with fill color, or replacing a color
	const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
	const visited = new Set<string>();

	while (stack.length > 0) {
		const { x, y } = stack.pop()!;
		const key = `${x},${y}`;

		// Skip if already visited
		if (visited.has(key)) continue;

		// Skip if out of bounds
		if (x < 0 || x >= asset.width || y < 0 || y >= asset.height) continue;

		// Get current pixel color
		const currentColor = pixelMap.get(key) ?? null;

		// Check if this pixel matches the target color
		if (targetColor === null) {
			// Filling transparent area - only fill if current is also transparent
			if (currentColor !== null) continue;
		} else {
			// Filling colored area - only fill if current matches target
			if (currentColor === null || !hexColorsEqual(currentColor, targetColor)) continue;
		}

		// Mark as visited and set the fill color
		visited.add(key);
		pixelMap.set(key, fillColor);

		// Add neighbors to stack (4-connectivity)
		stack.push({ x: x + 1, y });
		stack.push({ x: x - 1, y });
		stack.push({ x, y: y + 1 });
		stack.push({ x, y: y - 1 });
	}

	// Convert pixel map back to array
	const newPixels = pixelMapToArray(pixelMap);

	return {
		...asset,
		pixels: newPixels
	};
}

// ============================================================================
// V2 Drawing Functions (Layer-based)
// ============================================================================

/**
 * Flood fill on a specific layer at a specific frame.
 * Returns new asset with fill applied.
 */
export function floodFillV2(
	asset: PixelArtAssetV2,
	layerId: string,
	frameIndex: number,
	startX: number,
	startY: number,
	fillColor: string
): PixelArtAssetV2 {
	// Validate bounds
	if (startX < 0 || startX >= asset.width || startY < 0 || startY >= asset.height) {
		return asset;
	}

	const layerIndex = asset.layers.findIndex((l) => l.id === layerId);
	if (layerIndex === -1) return asset;

	const layer = asset.layers[layerIndex];
	if (!layer) return asset;

	const framePixels = layer.frames[frameIndex];
	if (!framePixels) return asset;

	// Create pixel map for efficient lookups
	const pixelMap = new Map<string, string>();
	for (const pixel of framePixels) {
		pixelMap.set(`${pixel.x},${pixel.y}`, pixel.color);
	}

	// Get target color (color we're replacing)
	const targetColor = pixelMap.get(`${startX},${startY}`) ?? null;

	// If target color is same as fill color, nothing to do
	if (targetColor !== null && hexColorsEqual(targetColor, fillColor)) {
		return asset;
	}

	// Flood fill algorithm
	const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
	const visited = new Set<string>();

	while (stack.length > 0) {
		const { x, y } = stack.pop()!;
		const key = `${x},${y}`;

		// Skip if already visited
		if (visited.has(key)) continue;

		// Skip if out of bounds
		if (x < 0 || x >= asset.width || y < 0 || y >= asset.height) continue;

		// Get current pixel color
		const currentColor = pixelMap.get(key) ?? null;

		// Check if this pixel matches the target color
		if (targetColor === null) {
			// Filling transparent area - only fill if current is also transparent
			if (currentColor !== null) continue;
		} else {
			// Filling colored area - only fill if current matches target
			if (currentColor === null || !hexColorsEqual(currentColor, targetColor)) continue;
		}

		// Mark as visited and set the fill color
		visited.add(key);
		pixelMap.set(key, fillColor);

		// Add neighbors to stack (4-connectivity)
		stack.push({ x: x + 1, y });
		stack.push({ x: x - 1, y });
		stack.push({ x, y: y + 1 });
		stack.push({ x, y: y - 1 });
	}

	// Convert pixel map back to array
	const newPixels: Pixel[] = [];
	for (const [key, color] of pixelMap) {
		const parts = key.split(',');
		const x = Number(parts[0]);
		const y = Number(parts[1]);
		newPixels.push({ x, y, color });
	}

	// Create new frames array with updated frame
	const newFrames = [...layer.frames];
	newFrames[frameIndex] = newPixels;

	// Create new layer with updated frames
	const newLayer = { ...layer, frames: newFrames };

	// Create new layers array with updated layer
	const newLayers = [...asset.layers];
	newLayers[layerIndex] = newLayer;

	return {
		...asset,
		layers: newLayers
	};
}
