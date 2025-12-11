/**
 * Asset preset configurations for the Pixel Art Editor
 */

import type { AssetPreset, AssetCategory, PresetConfig, PixelArtAsset } from '../types.js';

/**
 * All available preset configurations.
 */
export const PRESET_CONFIGS: PresetConfig[] = [
	// Tiles
	{
		name: 'tile-16',
		width: 16,
		height: 16,
		category: 'tiles',
		description: 'Standard terrain tile'
	},
	{
		name: 'tile-32',
		width: 32,
		height: 32,
		category: 'tiles',
		description: 'Large terrain feature'
	},

	// Gnomes
	{
		name: 'gnome-idle',
		width: 16,
		height: 24,
		category: 'gnomes',
		description: 'Gnome idle pose'
	},
	{
		name: 'gnome-walk',
		width: 64,
		height: 24,
		category: 'gnomes',
		description: 'Walk cycle (4 frames)',
		animation: { frameWidth: 16, frameHeight: 24, frameCount: 4 }
	},
	{
		name: 'gnome-dig',
		width: 64,
		height: 24,
		category: 'gnomes',
		description: 'Mining animation (4 frames)',
		animation: { frameWidth: 16, frameHeight: 24, frameCount: 4 }
	},
	{
		name: 'gnome-climb',
		width: 48,
		height: 24,
		category: 'gnomes',
		description: 'Climbing animation (3 frames)',
		animation: { frameWidth: 16, frameHeight: 24, frameCount: 3 }
	},

	// Structures
	{
		name: 'structure-wall',
		width: 16,
		height: 16,
		category: 'structures',
		description: 'Wall segment'
	},
	{
		name: 'structure-door',
		width: 16,
		height: 32,
		category: 'structures',
		description: 'Door (2 tiles)'
	},
	{
		name: 'structure-ladder',
		width: 16,
		height: 16,
		category: 'structures',
		description: 'Ladder segment'
	},

	// UI
	{
		name: 'ui-button',
		width: 32,
		height: 32,
		category: 'ui',
		description: 'UI button base'
	},
	{
		name: 'ui-icon',
		width: 16,
		height: 16,
		category: 'ui',
		description: 'Small icon'
	},

	// Resources
	{
		name: 'resource-item',
		width: 12,
		height: 12,
		category: 'resources',
		description: 'Resource icon'
	},

	// Vegetation
	{
		name: 'tree',
		width: 48,
		height: 64,
		category: 'vegetation',
		description: 'Surface tree'
	},
	{
		name: 'bush',
		width: 24,
		height: 16,
		category: 'vegetation',
		description: 'Small vegetation'
	}
];

/**
 * Get all available presets.
 */
export function getPresets(): PresetConfig[] {
	return PRESET_CONFIGS;
}

/**
 * Get presets filtered by category.
 */
export function getPresetsByCategory(category: AssetCategory): PresetConfig[] {
	return PRESET_CONFIGS.filter((preset) => preset.category === category);
}

/**
 * Get preset config by name.
 */
export function getPreset(name: AssetPreset): PresetConfig | undefined {
	return PRESET_CONFIGS.find((preset) => preset.name === name);
}

/**
 * Get all categories with their presets grouped.
 */
export function getPresetsGroupedByCategory(): Map<AssetCategory, PresetConfig[]> {
	const grouped = new Map<AssetCategory, PresetConfig[]>();

	for (const preset of PRESET_CONFIGS) {
		const existing = grouped.get(preset.category) ?? [];
		grouped.set(preset.category, [...existing, preset]);
	}

	return grouped;
}

/**
 * Create new empty asset from preset.
 */
export function createAssetFromPreset(preset: AssetPreset, name: string): PixelArtAsset {
	const config = getPreset(preset);

	if (!config) {
		throw new Error(`Unknown preset: ${preset}`);
	}

	const asset: PixelArtAsset = {
		name,
		version: 1,
		preset,
		width: config.width,
		height: config.height,
		pixels: []
	};

	// Add animation metadata if preset has it
	if (config.animation) {
		asset.animation = {
			frameWidth: config.animation.frameWidth,
			frameHeight: config.animation.frameHeight,
			frameCount: config.animation.frameCount,
			fps: 8 // Default animation speed
		};
	}

	return asset;
}

/**
 * Create custom-sized asset.
 */
export function createCustomAsset(width: number, height: number, name: string): PixelArtAsset {
	return {
		name,
		version: 1,
		preset: 'custom',
		width,
		height,
		pixels: []
	};
}

/**
 * Get category display name.
 */
export function getCategoryDisplayName(category: AssetCategory): string {
	const names: Record<AssetCategory, string> = {
		tiles: 'Tiles',
		gnomes: 'Gnomes',
		structures: 'Structures',
		ui: 'UI Elements',
		resources: 'Resources',
		vegetation: 'Vegetation'
	};
	return names[category];
}

/**
 * Get all available categories in display order.
 */
export function getCategories(): AssetCategory[] {
	return ['tiles', 'gnomes', 'structures', 'ui', 'resources', 'vegetation'];
}
