/**
 * JSON import/export for the Pixel Art Editor
 * Supports v1 and v2 asset formats with auto-migration.
 */

import type { PixelArtAsset, PixelArtAssetV2, AnyPixelArtAsset, Layer, Pixel } from '../types.js';
import { isV1Asset } from '../types.js';
import { validateAsset, validateAssetDetailed, getValidationErrorMessage } from '../utils/validation.js';

/**
 * Generate a unique layer ID.
 */
function generateLayerId(): string {
	return `layer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Migrate v1 asset to v2 format.
 * Creates a single layer with the original pixels.
 */
export function migrateV1toV2(v1: PixelArtAsset): PixelArtAssetV2 {
	const layer: Layer = {
		id: generateLayerId(),
		name: 'Layer 1',
		visible: true,
		opacity: 1.0,
		frames: [v1.pixels] // Single frame with all pixels
	};

	const v2: PixelArtAssetV2 = {
		name: v1.name,
		version: 2,
		preset: v1.preset,
		width: v1.width,
		height: v1.height,
		layers: [layer]
	};

	// Copy palette if present
	if (v1.palette) {
		v2.palette = [...v1.palette];
	}

	// Convert animation metadata if present
	if (v1.animation) {
		v2.animation = {
			fps: v1.animation.fps
		};
	}

	return v2;
}

/**
 * Check if data looks like a v1 asset (has pixels array instead of layers).
 */
export function isV1Data(data: unknown): boolean {
	if (typeof data !== 'object' || data === null) return false;
	const obj = data as Record<string, unknown>;
	return obj.version === 1 || (Array.isArray(obj.pixels) && !Array.isArray(obj.layers));
}

/**
 * Check if data is a valid v2 asset structure.
 */
function isV2Data(data: unknown): data is PixelArtAssetV2 {
	if (typeof data !== 'object' || data === null) return false;
	const obj = data as Record<string, unknown>;
	return obj.version === 2 && Array.isArray(obj.layers);
}

/**
 * Load asset from JSON string (auto-migrates v1 to v2).
 * Returns null if parsing fails or validation fails.
 */
export function loadAssetFromJson(json: string): PixelArtAssetV2 | null {
	try {
		const data = JSON.parse(json);

		// Check if already v2 format
		if (isV2Data(data)) {
			return data;
		}

		// Validate v1 structure first
		if (!validateAsset(data)) {
			return null;
		}

		// Auto-migrate v1 to v2
		return migrateV1toV2(data as PixelArtAsset);
	} catch {
		return null;
	}
}

/**
 * Load asset from JSON string with detailed error reporting.
 */
export function loadAssetFromJsonDetailed(json: string): {
	asset: PixelArtAssetV2 | null;
	errors: string[];
} {
	try {
		const data = JSON.parse(json);

		// Check if already v2 format
		if (isV2Data(data)) {
			return { asset: data, errors: [] };
		}

		// Validate v1 structure
		const validationErrors = validateAssetDetailed(data);

		if (validationErrors.length === 0) {
			// Auto-migrate v1 to v2
			return { asset: migrateV1toV2(data as PixelArtAsset), errors: [] };
		}

		return {
			asset: null,
			errors: validationErrors.map(getValidationErrorMessage)
		};
	} catch (error) {
		return {
			asset: null,
			errors: [error instanceof Error ? error.message : 'Invalid JSON format']
		};
	}
}

/**
 * Sort pixels by y then x for consistent output.
 */
function sortPixels(pixels: Pixel[]): Pixel[] {
	return [...pixels].sort((a, b) => {
		if (a.y !== b.y) return a.y - b.y;
		return a.x - b.x;
	});
}

/**
 * Save asset to JSON string (v2 format, pretty-printed).
 */
export function saveAssetToJson(asset: PixelArtAssetV2): string {
	// Sort pixels in each layer frame for consistent output
	const sortedLayers = asset.layers.map((layer) => ({
		...layer,
		frames: layer.frames.map((frame) => sortPixels(frame))
	}));

	const assetToSave: PixelArtAssetV2 = {
		...asset,
		layers: sortedLayers
	};

	return JSON.stringify(assetToSave, null, 2);
}

/**
 * Create a minimal valid v2 asset JSON for the given preset.
 */
export function createEmptyAssetJson(
	name: string,
	preset: string,
	width: number,
	height: number
): string {
	const layer: Layer = {
		id: generateLayerId(),
		name: 'Layer 1',
		visible: true,
		opacity: 1.0,
		frames: [[]] // Single empty frame
	};

	const asset: PixelArtAssetV2 = {
		name,
		version: 2,
		preset: preset as PixelArtAssetV2['preset'],
		width,
		height,
		layers: [layer]
	};

	return saveAssetToJson(asset);
}

/**
 * Create a new layer with default settings.
 */
export function createLayer(name: string, frameCount: number = 1): Layer {
	return {
		id: generateLayerId(),
		name,
		visible: true,
		opacity: 1.0,
		frames: Array.from({ length: frameCount }, () => [])
	};
}

/**
 * Legacy function for backward compatibility.
 * Creates v1-style asset and converts to v2.
 * @deprecated Use createEmptyAssetJson instead
 */
export function saveAssetToJsonLegacy(asset: PixelArtAsset): string {
	// Sort pixels by y then x for consistent output
	const sortedPixels = [...asset.pixels].sort((a, b) => {
		if (a.y !== b.y) return a.y - b.y;
		return a.x - b.x;
	});

	const assetToSave: PixelArtAsset = {
		...asset,
		pixels: sortedPixels
	};

	return JSON.stringify(assetToSave, null, 2);
}
