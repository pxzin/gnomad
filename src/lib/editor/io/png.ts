/**
 * PNG export for the Pixel Art Editor
 */

import { fileSave } from 'browser-fs-access';
import type { PixelArtAsset, PixelArtAssetV2 } from '../types.js';
import { createExportCanvas, createExportCanvasV2 } from '../canvas/render.js';

/**
 * Export asset to PNG blob.
 */
export function exportToPngBlob(asset: PixelArtAsset): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const canvas = createExportCanvas(asset);
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error('Failed to create PNG blob'));
				}
			},
			'image/png'
		);
	});
}

/**
 * Export asset and trigger download or file save.
 * Returns file handle if File System Access API is supported.
 */
export async function exportPng(
	asset: PixelArtAsset,
	filename?: string,
	handle?: FileSystemFileHandle | null
): Promise<FileSystemFileHandle | null> {
	const blob = await exportToPngBlob(asset);
	const defaultFilename = filename ?? `${asset.name}.png`;

	try {
		const newHandle = await fileSave(
			blob,
			{
				fileName: defaultFilename,
				description: 'PNG Image',
				extensions: ['.png']
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
 * Get PNG data URL for preview or clipboard.
 */
export function getPngDataUrl(asset: PixelArtAsset): string {
	const canvas = createExportCanvas(asset);
	return canvas.toDataURL('image/png');
}

// ============================================================================
// V2 Asset Export (Layer-based)
// ============================================================================

/**
 * Export v2 asset to PNG blob (flattens layers).
 */
export function exportToPngBlobV2(asset: PixelArtAssetV2, frameIndex: number = 0): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const canvas = createExportCanvasV2(asset, frameIndex);
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error('Failed to create PNG blob'));
				}
			},
			'image/png'
		);
	});
}

/**
 * Export v2 asset and trigger download or file save.
 * Returns file handle if File System Access API is supported.
 */
export async function exportPngV2(
	asset: PixelArtAssetV2,
	frameIndex: number = 0,
	filename?: string,
	handle?: FileSystemFileHandle | null
): Promise<FileSystemFileHandle | null> {
	const blob = await exportToPngBlobV2(asset, frameIndex);
	const defaultFilename = filename ?? `${asset.name}.png`;

	try {
		const newHandle = await fileSave(
			blob,
			{
				fileName: defaultFilename,
				description: 'PNG Image',
				extensions: ['.png']
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
 * Get PNG data URL for v2 asset (for preview or clipboard).
 */
export function getPngDataUrlV2(asset: PixelArtAssetV2, frameIndex: number = 0): string {
	const canvas = createExportCanvasV2(asset, frameIndex);
	return canvas.toDataURL('image/png');
}

// ============================================================================
// Sprite Sheet Export (Animation)
// ============================================================================

/**
 * Sprite sheet metadata for game engine consumption.
 */
export interface SpriteSheetMetadata {
	/** Asset name */
	name: string;
	/** Total number of frames */
	frameCount: number;
	/** Width of each frame in pixels */
	frameWidth: number;
	/** Height of each frame in pixels */
	frameHeight: number;
	/** Frames per second for playback */
	fps: number;
	/** Layout direction */
	layout: 'horizontal' | 'vertical';
	/** Total sprite sheet dimensions */
	sheetWidth: number;
	sheetHeight: number;
}

/**
 * Create a horizontal sprite sheet canvas with all animation frames.
 * Frames are arranged left-to-right: [F1][F2][F3][F4]...
 */
export function createSpriteSheetCanvas(
	asset: PixelArtAssetV2,
	layout: 'horizontal' | 'vertical' = 'horizontal'
): HTMLCanvasElement {
	const frameCount = asset.layers[0]?.frames.length ?? 1;
	const frameWidth = asset.width;
	const frameHeight = asset.height;

	// Calculate sprite sheet dimensions
	const sheetWidth = layout === 'horizontal' ? frameWidth * frameCount : frameWidth;
	const sheetHeight = layout === 'horizontal' ? frameHeight : frameHeight * frameCount;

	const canvas = document.createElement('canvas');
	canvas.width = sheetWidth;
	canvas.height = sheetHeight;

	const ctx = canvas.getContext('2d')!;
	ctx.clearRect(0, 0, sheetWidth, sheetHeight);

	// Render each frame to the sprite sheet
	for (let i = 0; i < frameCount; i++) {
		const frameCanvas = createExportCanvasV2(asset, i);
		const x = layout === 'horizontal' ? i * frameWidth : 0;
		const y = layout === 'horizontal' ? 0 : i * frameHeight;
		ctx.drawImage(frameCanvas, x, y);
	}

	return canvas;
}

/**
 * Export sprite sheet to PNG blob.
 */
export function exportSpriteSheetToBlob(
	asset: PixelArtAssetV2,
	layout: 'horizontal' | 'vertical' = 'horizontal'
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const canvas = createSpriteSheetCanvas(asset, layout);
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error('Failed to create sprite sheet PNG blob'));
				}
			},
			'image/png'
		);
	});
}

/**
 * Generate sprite sheet metadata JSON.
 */
export function generateSpriteSheetMetadata(
	asset: PixelArtAssetV2,
	layout: 'horizontal' | 'vertical' = 'horizontal'
): SpriteSheetMetadata {
	const frameCount = asset.layers[0]?.frames.length ?? 1;
	const frameWidth = asset.width;
	const frameHeight = asset.height;

	return {
		name: asset.name,
		frameCount,
		frameWidth,
		frameHeight,
		fps: asset.animation?.fps ?? 8,
		layout,
		sheetWidth: layout === 'horizontal' ? frameWidth * frameCount : frameWidth,
		sheetHeight: layout === 'horizontal' ? frameHeight : frameHeight * frameCount
	};
}

/**
 * Export sprite sheet PNG and trigger download.
 */
export async function exportSpriteSheet(
	asset: PixelArtAssetV2,
	layout: 'horizontal' | 'vertical' = 'horizontal'
): Promise<FileSystemFileHandle | null> {
	const blob = await exportSpriteSheetToBlob(asset, layout);
	const filename = `${asset.name}-spritesheet.png`;

	try {
		const handle = await fileSave(
			blob,
			{
				fileName: filename,
				description: 'PNG Sprite Sheet',
				extensions: ['.png']
			},
			undefined
		);

		return handle ?? null;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			return null;
		}
		throw error;
	}
}

/**
 * Export sprite sheet metadata JSON and trigger download.
 */
export async function exportSpriteSheetMetadataFile(
	asset: PixelArtAssetV2,
	layout: 'horizontal' | 'vertical' = 'horizontal'
): Promise<FileSystemFileHandle | null> {
	const metadata = generateSpriteSheetMetadata(asset, layout);
	const json = JSON.stringify(metadata, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const filename = `${asset.name}-spritesheet.json`;

	try {
		const handle = await fileSave(
			blob,
			{
				fileName: filename,
				description: 'Sprite Sheet Metadata',
				extensions: ['.json']
			},
			undefined
		);

		return handle ?? null;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			return null;
		}
		throw error;
	}
}

/**
 * Export both sprite sheet PNG and metadata JSON.
 * Convenience function for full animation export.
 */
export async function exportAnimationAssets(
	asset: PixelArtAssetV2,
	layout: 'horizontal' | 'vertical' = 'horizontal'
): Promise<{ png: FileSystemFileHandle | null; json: FileSystemFileHandle | null }> {
	const pngHandle = await exportSpriteSheet(asset, layout);
	const jsonHandle = await exportSpriteSheetMetadataFile(asset, layout);

	return { png: pngHandle, json: jsonHandle };
}
