/**
 * File system operations for the Pixel Art Editor
 * Uses browser-fs-access for cross-browser support
 */

import { fileOpen, fileSave } from 'browser-fs-access';
import type { PixelArtAsset } from '../types.js';
import { loadAssetFromJsonDetailed, saveAssetToJson } from './json.js';

/**
 * Result of opening an asset file.
 */
export interface OpenAssetResult {
	asset: PixelArtAsset;
	handle: FileSystemFileHandle | null;
	filename: string;
}

/**
 * Load asset via file picker dialog.
 * Returns asset, file handle (if supported), and filename.
 */
export async function openAssetFile(): Promise<OpenAssetResult | null> {
	try {
		const file = await fileOpen({
			description: 'Pixel Art Asset',
			mimeTypes: ['application/json'],
			extensions: ['.json']
		});

		const text = await file.text();
		const { asset, errors } = loadAssetFromJsonDetailed(text);

		if (!asset) {
			throw new Error(`Invalid asset file: ${errors.join(', ')}`);
		}

		return {
			asset,
			handle: file.handle ?? null,
			filename: file.name
		};
	} catch (error) {
		// User cancelled or error occurred
		if (error instanceof Error && error.name === 'AbortError') {
			return null; // User cancelled
		}
		throw error;
	}
}

/**
 * Save asset to existing file handle or prompt for new location.
 * Returns the file handle for future saves.
 */
export async function saveAssetFile(
	asset: PixelArtAsset,
	handle?: FileSystemFileHandle | null
): Promise<FileSystemFileHandle | null> {
	const json = saveAssetToJson(asset);
	const blob = new Blob([json], { type: 'application/json' });

	try {
		const newHandle = await fileSave(
			blob,
			{
				fileName: `${asset.name}.json`,
				description: 'Pixel Art Asset',
				extensions: ['.json']
			},
			handle ?? undefined
		);

		return newHandle ?? null;
	} catch (error) {
		// User cancelled or error occurred
		if (error instanceof Error && error.name === 'AbortError') {
			return handle ?? null; // User cancelled, return original handle
		}
		throw error;
	}
}

/**
 * Save asset to a new location (Save As).
 * Always prompts for new location.
 */
export async function saveAssetFileAs(
	asset: PixelArtAsset
): Promise<FileSystemFileHandle | null> {
	return saveAssetFile(asset, null);
}

/**
 * Check if File System Access API is supported.
 */
export function isFileSystemAccessSupported(): boolean {
	return 'showSaveFilePicker' in window;
}
