/**
 * Canvas pixel operations for the Pixel Art Editor
 */

import type { PixelArtAsset, PixelArtAssetV2, Pixel } from '../types.js';

/**
 * Set a single pixel in the asset.
 * Returns new asset (immutable update).
 */
export function setPixel(
	asset: PixelArtAsset,
	x: number,
	y: number,
	color: string
): PixelArtAsset {
	// Validate bounds
	if (x < 0 || x >= asset.width || y < 0 || y >= asset.height) {
		return asset;
	}

	// Remove existing pixel at this position
	const filteredPixels = asset.pixels.filter((p) => p.x !== x || p.y !== y);

	// Add new pixel
	const newPixels: Pixel[] = [...filteredPixels, { x, y, color }];

	return {
		...asset,
		pixels: newPixels
	};
}

/**
 * Clear a pixel (make transparent).
 * Returns new asset (immutable update).
 */
export function clearPixel(asset: PixelArtAsset, x: number, y: number): PixelArtAsset {
	// Validate bounds
	if (x < 0 || x >= asset.width || y < 0 || y >= asset.height) {
		return asset;
	}

	// Remove pixel at this position
	const newPixels = asset.pixels.filter((p) => p.x !== x || p.y !== y);

	// If nothing changed, return original asset
	if (newPixels.length === asset.pixels.length) {
		return asset;
	}

	return {
		...asset,
		pixels: newPixels
	};
}

/**
 * Get pixel color at position.
 * Returns null if transparent.
 */
export function getPixel(asset: PixelArtAsset, x: number, y: number): string | null {
	// Validate bounds
	if (x < 0 || x >= asset.width || y < 0 || y >= asset.height) {
		return null;
	}

	const pixel = asset.pixels.find((p) => p.x === x && p.y === y);
	return pixel?.color ?? null;
}

/**
 * Set multiple pixels at once (batch operation).
 * More efficient than multiple setPixel calls.
 */
export function setPixels(
	asset: PixelArtAsset,
	pixels: Array<{ x: number; y: number; color: string }>
): PixelArtAsset {
	// Filter out invalid pixels
	const validPixels = pixels.filter(
		(p) => p.x >= 0 && p.x < asset.width && p.y >= 0 && p.y < asset.height
	);

	if (validPixels.length === 0) {
		return asset;
	}

	// Create a map of positions to remove
	const positionsToReplace = new Set(validPixels.map((p) => `${p.x},${p.y}`));

	// Filter existing pixels that aren't being replaced
	const filteredPixels = asset.pixels.filter((p) => !positionsToReplace.has(`${p.x},${p.y}`));

	// Add new pixels
	const newPixels: Pixel[] = [...filteredPixels, ...validPixels];

	return {
		...asset,
		pixels: newPixels
	};
}

/**
 * Clear multiple pixels at once (batch operation).
 */
export function clearPixels(
	asset: PixelArtAsset,
	positions: Array<{ x: number; y: number }>
): PixelArtAsset {
	// Create a set of positions to clear
	const positionsToClear = new Set(positions.map((p) => `${p.x},${p.y}`));

	// Filter out the pixels to clear
	const newPixels = asset.pixels.filter((p) => !positionsToClear.has(`${p.x},${p.y}`));

	// If nothing changed, return original asset
	if (newPixels.length === asset.pixels.length) {
		return asset;
	}

	return {
		...asset,
		pixels: newPixels
	};
}

/**
 * Create a pixel map for efficient lookups.
 * Returns a Map with "x,y" keys and color values.
 */
export function createPixelMap(asset: PixelArtAsset): Map<string, string> {
	const map = new Map<string, string>();
	for (const pixel of asset.pixels) {
		map.set(`${pixel.x},${pixel.y}`, pixel.color);
	}
	return map;
}

/**
 * Convert pixel map back to pixel array.
 */
export function pixelMapToArray(map: Map<string, string>): Pixel[] {
	const pixels: Pixel[] = [];
	for (const [key, color] of map) {
		const parts = key.split(',');
		const x = Number(parts[0]);
		const y = Number(parts[1]);
		pixels.push({ x, y, color });
	}
	return pixels;
}

// ============================================================================
// V2 Asset Operations (Layer-based)
// ============================================================================

/**
 * Set a pixel on a specific layer in a specific frame.
 * Returns new asset (immutable update).
 */
export function setPixelV2(
	asset: PixelArtAssetV2,
	layerId: string,
	frameIndex: number,
	x: number,
	y: number,
	color: string
): PixelArtAssetV2 {
	// Validate bounds
	if (x < 0 || x >= asset.width || y < 0 || y >= asset.height) {
		return asset;
	}

	const layerIndex = asset.layers.findIndex((l) => l.id === layerId);
	if (layerIndex === -1) return asset;

	const layer = asset.layers[layerIndex];
	if (!layer) return asset;

	const framePixels = layer.frames[frameIndex];
	if (!framePixels) return asset;

	// Remove existing pixel at this position
	const filteredPixels = framePixels.filter((p) => p.x !== x || p.y !== y);

	// Add new pixel
	const newPixels: Pixel[] = [...filteredPixels, { x, y, color }];

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

/**
 * Clear a pixel on a specific layer in a specific frame.
 * Returns new asset (immutable update).
 */
export function clearPixelV2(
	asset: PixelArtAssetV2,
	layerId: string,
	frameIndex: number,
	x: number,
	y: number
): PixelArtAssetV2 {
	// Validate bounds
	if (x < 0 || x >= asset.width || y < 0 || y >= asset.height) {
		return asset;
	}

	const layerIndex = asset.layers.findIndex((l) => l.id === layerId);
	if (layerIndex === -1) return asset;

	const layer = asset.layers[layerIndex];
	if (!layer) return asset;

	const framePixels = layer.frames[frameIndex];
	if (!framePixels) return asset;

	// Remove pixel at this position
	const newPixels = framePixels.filter((p) => p.x !== x || p.y !== y);

	// If nothing changed, return original
	if (newPixels.length === framePixels.length) {
		return asset;
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

/**
 * Get pixel color from a specific layer at a specific frame.
 * Returns null if transparent.
 */
export function getPixelV2(
	asset: PixelArtAssetV2,
	layerId: string,
	frameIndex: number,
	x: number,
	y: number
): string | null {
	// Validate bounds
	if (x < 0 || x >= asset.width || y < 0 || y >= asset.height) {
		return null;
	}

	const layer = asset.layers.find((l) => l.id === layerId);
	if (!layer) return null;

	const framePixels = layer.frames[frameIndex];
	if (!framePixels) return null;

	const pixel = framePixels.find((p) => p.x === x && p.y === y);
	return pixel?.color ?? null;
}

/**
 * Get composite pixel color from all visible layers at a position.
 * Returns the topmost visible pixel color or null.
 */
export function getCompositePixelV2(
	asset: PixelArtAssetV2,
	frameIndex: number,
	x: number,
	y: number
): string | null {
	// Validate bounds
	if (x < 0 || x >= asset.width || y < 0 || y >= asset.height) {
		return null;
	}

	// Check layers from top to bottom
	for (let i = asset.layers.length - 1; i >= 0; i--) {
		const layer = asset.layers[i];
		if (!layer || !layer.visible || layer.opacity === 0) continue;

		const framePixels = layer.frames[frameIndex];
		if (!framePixels) continue;

		const pixel = framePixels.find((p) => p.x === x && p.y === y);
		if (pixel) {
			return pixel.color;
		}
	}

	return null;
}
