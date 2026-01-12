/**
 * Asset preset configurations for the Pixel Art Editor
 */

import type { AssetPreset, AssetCategory, PresetConfig, PixelArtAsset } from '../types.js';
import { TILE_SIZE, SPRITE_WIDTH, SPRITE_HEIGHT } from '$lib/config/rendering';

/**
 * All available preset configurations.
 * Uses centralized rendering constants for game asset dimensions.
 */
export const PRESET_CONFIGS: PresetConfig[] = [
	// Tiles (32x32 standard)
	{
		name: 'tile-32',
		width: TILE_SIZE,
		height: TILE_SIZE,
		category: 'tiles',
		description: 'Standard terrain tile (32x32)'
	},
	{
		name: 'tile-16',
		width: 16,
		height: 16,
		category: 'tiles',
		description: 'Legacy tile (16x16)'
	},

	// Gnomes (32x48 standard)
	{
		name: 'gnome-idle',
		width: SPRITE_WIDTH,
		height: SPRITE_HEIGHT,
		category: 'gnomes',
		description: 'Gnome idle pose (32x48)'
	},
	{
		name: 'gnome-walk',
		width: SPRITE_WIDTH * 6,
		height: SPRITE_HEIGHT,
		category: 'gnomes',
		description: 'Walk cycle (6 frames)',
		animation: { frameWidth: SPRITE_WIDTH, frameHeight: SPRITE_HEIGHT, frameCount: 6 }
	},
	{
		name: 'gnome-dig',
		width: SPRITE_WIDTH * 6,
		height: SPRITE_HEIGHT,
		category: 'gnomes',
		description: 'Mining animation (6 frames)',
		animation: { frameWidth: SPRITE_WIDTH, frameHeight: SPRITE_HEIGHT, frameCount: 6 }
	},
	{
		name: 'gnome-climb',
		width: SPRITE_WIDTH * 4,
		height: SPRITE_HEIGHT,
		category: 'gnomes',
		description: 'Climbing animation (4 frames)',
		animation: { frameWidth: SPRITE_WIDTH, frameHeight: SPRITE_HEIGHT, frameCount: 4 }
	},
	{
		name: 'gnome-fall',
		width: SPRITE_WIDTH * 2,
		height: SPRITE_HEIGHT,
		category: 'gnomes',
		description: 'Falling animation (2 frames)',
		animation: { frameWidth: SPRITE_WIDTH, frameHeight: SPRITE_HEIGHT, frameCount: 2 }
	},
	{
		name: 'gnome-sheet',
		width: SPRITE_WIDTH * 10,
		height: SPRITE_HEIGHT * 10,
		category: 'gnomes',
		description: 'Full sprite sheet (320x480)',
		animation: { frameWidth: SPRITE_WIDTH, frameHeight: SPRITE_HEIGHT, frameCount: 40 }
	},

	// Structures (32x32 standard)
	{
		name: 'structure-wall',
		width: TILE_SIZE,
		height: TILE_SIZE,
		category: 'structures',
		description: 'Wall segment (32x32)'
	},
	{
		name: 'structure-door',
		width: TILE_SIZE,
		height: TILE_SIZE * 2,
		category: 'structures',
		description: 'Door (2 tiles, 32x64)'
	},
	{
		name: 'structure-ladder',
		width: TILE_SIZE,
		height: TILE_SIZE,
		category: 'structures',
		description: 'Ladder segment (32x32)'
	},

	// UI
	{
		name: 'ui-button',
		width: 64,
		height: 64,
		category: 'ui',
		description: 'UI button base (64x64)'
	},
	{
		name: 'ui-icon',
		width: 32,
		height: 32,
		category: 'ui',
		description: 'Icon (32x32)'
	},

	// Resources
	{
		name: 'resource-item',
		width: 16,
		height: 16,
		category: 'resources',
		description: 'Resource icon (16x16)'
	},

	// Vegetation
	{
		name: 'tree',
		width: TILE_SIZE * 2,
		height: TILE_SIZE * 3,
		category: 'vegetation',
		description: 'Surface tree (64x96)'
	},
	{
		name: 'bush',
		width: TILE_SIZE,
		height: TILE_SIZE,
		category: 'vegetation',
		description: 'Small vegetation (32x32)'
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
