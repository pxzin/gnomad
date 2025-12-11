/**
 * JSON import/export for the Pixel Art Editor
 */

import type { PixelArtAsset } from '../types.js';
import { validateAsset, validateAssetDetailed, getValidationErrorMessage } from '../utils/validation.js';

/**
 * Load asset from JSON string.
 * Returns null if parsing fails or validation fails.
 */
export function loadAssetFromJson(json: string): PixelArtAsset | null {
	try {
		const data = JSON.parse(json);
		if (validateAsset(data)) {
			return data;
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Load asset from JSON string with detailed error reporting.
 */
export function loadAssetFromJsonDetailed(json: string): {
	asset: PixelArtAsset | null;
	errors: string[];
} {
	try {
		const data = JSON.parse(json);
		const validationErrors = validateAssetDetailed(data);

		if (validationErrors.length === 0) {
			return { asset: data as PixelArtAsset, errors: [] };
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
 * Save asset to JSON string (pretty-printed).
 */
export function saveAssetToJson(asset: PixelArtAsset): string {
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

/**
 * Create a minimal valid asset JSON for the given preset.
 */
export function createEmptyAssetJson(
	name: string,
	preset: string,
	width: number,
	height: number
): string {
	const asset: PixelArtAsset = {
		name,
		version: 1,
		preset: preset as PixelArtAsset['preset'],
		width,
		height,
		pixels: []
	};

	return saveAssetToJson(asset);
}
