/**
 * API endpoint to save JSON asset files directly to the project (dev mode only)
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';

const ASSETS_SOURCE_DIR = 'src/lib/assets/source';

export const POST: RequestHandler = async ({ request }) => {
	// Only allow in development mode
	if (!dev) {
		throw error(403, 'This endpoint is only available in development mode');
	}

	try {
		const { filename, content } = await request.json();

		if (!filename || typeof filename !== 'string') {
			throw error(400, 'filename is required');
		}

		if (!content || typeof content !== 'string') {
			throw error(400, 'content is required');
		}

		// Sanitize filename - only allow alphanumeric, dash, underscore
		const sanitizedFilename = filename.replace(/[^a-zA-Z0-9-_]/g, '');
		if (!sanitizedFilename) {
			throw error(400, 'Invalid filename');
		}

		const filePath = join(process.cwd(), ASSETS_SOURCE_DIR, `${sanitizedFilename}.json`);

		// Ensure directory exists
		await mkdir(dirname(filePath), { recursive: true });

		// Write file
		await writeFile(filePath, content, 'utf-8');

		return json({
			success: true,
			path: `${ASSETS_SOURCE_DIR}/${sanitizedFilename}.json`
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Failed to save JSON:', err);
		throw error(500, 'Failed to save file');
	}
};
