/**
 * PNG export for the Pixel Art Editor
 */

import { fileSave } from 'browser-fs-access';
import type { PixelArtAsset } from '../types.js';
import { createExportCanvas } from '../canvas/render.js';

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
