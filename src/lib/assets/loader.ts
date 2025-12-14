/**
 * Asset Loader
 *
 * Loads and caches sprite textures for the game.
 */

import { Assets, Texture } from 'pixi.js';

/** Asset paths relative to static folder */
const ASSET_PATHS = {
	gnomeIdle: '/sprites/gnomes/gnome-idle.png'
} as const;

/** Cached textures */
let gnomeIdleTexture: Texture | null = null;

/** Whether assets have been loaded */
let assetsLoaded = false;

/**
 * Load all game assets.
 * Should be called once during game initialization.
 */
export async function loadGameAssets(): Promise<void> {
	if (assetsLoaded) return;

	try {
		gnomeIdleTexture = await Assets.load(ASSET_PATHS.gnomeIdle);
		assetsLoaded = true;
	} catch (error) {
		console.error('Failed to load game assets:', error);
		// Continue without sprites - will fall back to colored squares
	}
}

/**
 * Get the gnome idle texture.
 * Returns null if assets haven't been loaded yet.
 */
export function getGnomeIdleTexture(): Texture | null {
	return gnomeIdleTexture;
}

/**
 * Check if assets are loaded.
 */
export function areAssetsLoaded(): boolean {
	return assetsLoaded;
}
