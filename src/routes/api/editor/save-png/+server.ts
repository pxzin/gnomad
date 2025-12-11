/**
 * API endpoint to save PNG asset files directly to the project (dev mode only)
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';

const ASSETS_SPRITES_DIR = 'src/lib/assets/sprites';

// Map preset categories to sprite subdirectories
const CATEGORY_DIRS: Record<string, string> = {
	tiles: 'tiles',
	gnomes: 'gnomes',
	structures: 'structures',
	ui: 'ui',
	resources: 'resources',
	vegetation: 'vegetation'
};

export const POST: RequestHandler = async ({ request }) => {
	// Only allow in development mode
	if (!dev) {
		throw error(403, 'This endpoint is only available in development mode');
	}

	try {
		const { filename, category, base64Data } = await request.json();

		if (!filename || typeof filename !== 'string') {
			throw error(400, 'filename is required');
		}

		if (!base64Data || typeof base64Data !== 'string') {
			throw error(400, 'base64Data is required');
		}

		// Sanitize filename - only allow alphanumeric, dash, underscore
		const sanitizedFilename = filename.replace(/[^a-zA-Z0-9-_]/g, '');
		if (!sanitizedFilename) {
			throw error(400, 'Invalid filename');
		}

		// Determine subdirectory based on category
		const subDir = CATEGORY_DIRS[category] || 'misc';
		const filePath = join(process.cwd(), ASSETS_SPRITES_DIR, subDir, `${sanitizedFilename}.png`);

		// Ensure directory exists
		await mkdir(dirname(filePath), { recursive: true });

		// Convert base64 to buffer and write file
		const buffer = Buffer.from(base64Data, 'base64');
		await writeFile(filePath, buffer);

		return json({
			success: true,
			path: `${ASSETS_SPRITES_DIR}/${subDir}/${sanitizedFilename}.png`
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Failed to save PNG:', err);
		throw error(500, 'Failed to save file');
	}
};
