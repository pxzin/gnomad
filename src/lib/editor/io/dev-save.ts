/**
 * Development-mode save functions that write directly to the project
 */

import type { PixelArtAssetV2 } from '../types.js';
import { saveAssetToJson } from './json.js';
import { exportToPngBlobV2 } from './png.js';

/**
 * Get the category from preset name
 */
function getCategoryFromPreset(preset: string): string {
	if (preset.startsWith('tile-')) return 'tiles';
	if (preset.startsWith('gnome-')) return 'gnomes';
	if (preset.startsWith('structure-')) return 'structures';
	if (preset.startsWith('ui-')) return 'ui';
	if (preset.startsWith('resource-')) return 'resources';
	if (preset === 'tree' || preset === 'bush') return 'vegetation';
	return 'misc';
}

/**
 * Save JSON file directly to src/lib/assets/source/
 * Only works in development mode
 */
export async function devSaveJson(asset: PixelArtAssetV2): Promise<{ success: boolean; path?: string; error?: string }> {
	try {
		const json = saveAssetToJson(asset);

		const response = await fetch('/api/editor/save-json', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				filename: asset.name,
				content: json
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
			return { success: false, error: errorData.message || `HTTP ${response.status}` };
		}

		const result = await response.json();
		return { success: true, path: result.path };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Failed to save' };
	}
}

/**
 * Save PNG file directly to src/lib/assets/sprites/{category}/
 * Only works in development mode
 */
export async function devSavePng(asset: PixelArtAssetV2): Promise<{ success: boolean; path?: string; error?: string }> {
	try {
		// Export first frame (frame 0) as PNG
		const blob = await exportToPngBlobV2(asset, 0);

		// Convert blob to base64
		const base64Data = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				const result = reader.result as string;
				// Remove data URL prefix (data:image/png;base64,)
				const base64 = result.split(',')[1];
				if (base64) {
					resolve(base64);
				} else {
					reject(new Error('Failed to convert to base64'));
				}
			};
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});

		const category = getCategoryFromPreset(asset.preset);

		const response = await fetch('/api/editor/save-png', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				filename: asset.name,
				category,
				base64Data
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
			return { success: false, error: errorData.message || `HTTP ${response.status}` };
		}

		const result = await response.json();
		return { success: true, path: result.path };
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Failed to save' };
	}
}
