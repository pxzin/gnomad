/**
 * PixiJS Renderer
 *
 * Handles all rendering using PixiJS v8.
 * Uses colored squares for MVP visuals.
 */

import { Application, Container, Graphics } from 'pixi.js';
import type { GameState } from '$lib/game/state';
import { TILE_CONFIG, TileType } from '$lib/components/tile';
import { GNOME_COLOR } from '$lib/components/gnome';

/**
 * Tile size in pixels.
 */
export const TILE_SIZE = 16;

/**
 * Selection highlight color.
 */
const SELECTION_COLOR = 0xffff00;
const SELECTION_ALPHA = 0.3;

/**
 * Task marker color.
 */
const TASK_MARKER_COLOR = 0xff0000;
const TASK_MARKER_ALPHA = 0.5;

/**
 * Renderer state.
 */
export interface Renderer {
	app: Application;
	worldContainer: Container;
	entityContainer: Container;
	uiContainer: Container;
	tileGraphics: Map<number, Graphics>;
	gnomeGraphics: Map<number, Graphics>;
	selectionGraphics: Graphics;
	taskMarkerGraphics: Graphics;
}

/**
 * Create and initialize the renderer.
 */
export async function createRenderer(canvas: HTMLCanvasElement): Promise<Renderer> {
	const app = new Application();

	await app.init({
		canvas,
		width: canvas.width,
		height: canvas.height,
		backgroundColor: 0x87ceeb, // Sky blue
		antialias: false,
		resolution: window.devicePixelRatio || 1,
		autoDensity: true
	});

	// Create layer containers
	const worldContainer = new Container();
	const entityContainer = new Container();
	const uiContainer = new Container();

	app.stage.addChild(worldContainer);
	app.stage.addChild(entityContainer);
	app.stage.addChild(uiContainer);

	// Create UI graphics
	const selectionGraphics = new Graphics();
	const taskMarkerGraphics = new Graphics();
	uiContainer.addChild(selectionGraphics);
	uiContainer.addChild(taskMarkerGraphics);

	return {
		app,
		worldContainer,
		entityContainer,
		uiContainer,
		tileGraphics: new Map(),
		gnomeGraphics: new Map(),
		selectionGraphics,
		taskMarkerGraphics
	};
}

/**
 * Resize the renderer to match canvas size.
 */
export function resizeRenderer(renderer: Renderer, width: number, height: number): void {
	renderer.app.renderer.resize(width, height);
}

/**
 * Destroy the renderer and clean up resources.
 */
export function destroyRenderer(renderer: Renderer): void {
	renderer.app.destroy(true);
	renderer.tileGraphics.clear();
	renderer.gnomeGraphics.clear();
}

/**
 * Render a single frame.
 */
export function render(renderer: Renderer, state: GameState, interpolation: number): void {
	const { camera } = state;

	// Interpolate camera position
	const camX = camera.x;
	const camY = camera.y;

	// Calculate viewport offset (center camera on screen)
	const screenWidth = renderer.app.screen.width;
	const screenHeight = renderer.app.screen.height;
	const offsetX = screenWidth / 2 - camX * camera.zoom;
	const offsetY = screenHeight / 2 - camY * camera.zoom;

	// Apply camera transform to world container
	renderer.worldContainer.x = offsetX;
	renderer.worldContainer.y = offsetY;
	renderer.worldContainer.scale.set(camera.zoom);

	// Apply same transform to entity and UI containers
	renderer.entityContainer.x = offsetX;
	renderer.entityContainer.y = offsetY;
	renderer.entityContainer.scale.set(camera.zoom);

	renderer.uiContainer.x = offsetX;
	renderer.uiContainer.y = offsetY;
	renderer.uiContainer.scale.set(camera.zoom);

	// Render tiles
	renderTiles(renderer, state);

	// Render gnomes
	renderGnomes(renderer, state, interpolation);

	// Render selection
	renderSelection(renderer, state);

	// Render task markers
	renderTaskMarkers(renderer, state);
}

/**
 * Render all tiles.
 */
function renderTiles(renderer: Renderer, state: GameState): void {
	const visibleTiles = new Set<number>();

	// Calculate visible tile range based on camera
	const { camera } = state;
	const screenWidth = renderer.app.screen.width;
	const screenHeight = renderer.app.screen.height;

	const worldLeft = camera.x - screenWidth / (2 * camera.zoom);
	const worldTop = camera.y - screenHeight / (2 * camera.zoom);
	const worldRight = camera.x + screenWidth / (2 * camera.zoom);
	const worldBottom = camera.y + screenHeight / (2 * camera.zoom);

	const minTileX = Math.max(0, Math.floor(worldLeft / TILE_SIZE) - 1);
	const minTileY = Math.max(0, Math.floor(worldTop / TILE_SIZE) - 1);
	const maxTileX = Math.min(state.worldWidth - 1, Math.ceil(worldRight / TILE_SIZE) + 1);
	const maxTileY = Math.min(state.worldHeight - 1, Math.ceil(worldBottom / TILE_SIZE) + 1);

	// Render visible tiles
	for (let y = minTileY; y <= maxTileY; y++) {
		for (let x = minTileX; x <= maxTileX; x++) {
			const entity = state.tileGrid[y]?.[x];
			if (entity === null || entity === undefined) continue;

			const tile = state.tiles.get(entity);
			if (!tile || tile.type === TileType.Air) continue;

			visibleTiles.add(entity);

			let graphics = renderer.tileGraphics.get(entity);
			if (!graphics) {
				graphics = new Graphics();
				renderer.worldContainer.addChild(graphics);
				renderer.tileGraphics.set(entity, graphics);
			}

			// Draw tile
			const config = TILE_CONFIG[tile.type];
			graphics.clear();
			graphics.rect(0, 0, TILE_SIZE, TILE_SIZE);
			graphics.fill(config.color);

			graphics.x = x * TILE_SIZE;
			graphics.y = y * TILE_SIZE;
		}
	}

	// Remove tiles that are no longer visible
	for (const [entity, graphics] of renderer.tileGraphics) {
		if (!visibleTiles.has(entity)) {
			renderer.worldContainer.removeChild(graphics);
			graphics.destroy();
			renderer.tileGraphics.delete(entity);
		}
	}
}

/**
 * Render all gnomes.
 */
function renderGnomes(renderer: Renderer, state: GameState, interpolation: number): void {
	const activeGnomes = new Set<number>();

	for (const [entity, gnome] of state.gnomes) {
		activeGnomes.add(entity);

		const position = state.positions.get(entity);
		if (!position) continue;

		let graphics = renderer.gnomeGraphics.get(entity);
		if (!graphics) {
			graphics = new Graphics();
			renderer.entityContainer.addChild(graphics);
			renderer.gnomeGraphics.set(entity, graphics);
		}

		// Draw gnome (colored square)
		graphics.clear();
		graphics.rect(0, 0, TILE_SIZE * 0.8, TILE_SIZE * 0.8);
		graphics.fill(GNOME_COLOR);

		// Position gnome (centered in tile)
		graphics.x = position.x * TILE_SIZE + TILE_SIZE * 0.1;
		graphics.y = position.y * TILE_SIZE + TILE_SIZE * 0.1;
	}

	// Remove gnomes that no longer exist
	for (const [entity, graphics] of renderer.gnomeGraphics) {
		if (!activeGnomes.has(entity)) {
			renderer.entityContainer.removeChild(graphics);
			graphics.destroy();
			renderer.gnomeGraphics.delete(entity);
		}
	}
}

/**
 * Render tile selection highlight.
 */
function renderSelection(renderer: Renderer, state: GameState): void {
	renderer.selectionGraphics.clear();

	if (state.selectedTiles.length === 0) return;

	for (const { x, y } of state.selectedTiles) {
		renderer.selectionGraphics.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
		renderer.selectionGraphics.fill({ color: SELECTION_COLOR, alpha: SELECTION_ALPHA });
	}
}

/**
 * Render task markers (dig designations).
 */
function renderTaskMarkers(renderer: Renderer, state: GameState): void {
	renderer.taskMarkerGraphics.clear();

	for (const [, task] of state.tasks) {
		renderer.taskMarkerGraphics.rect(
			task.targetX * TILE_SIZE + 2,
			task.targetY * TILE_SIZE + 2,
			TILE_SIZE - 4,
			TILE_SIZE - 4
		);
		renderer.taskMarkerGraphics.stroke({ color: TASK_MARKER_COLOR, width: 2, alpha: TASK_MARKER_ALPHA });
	}
}

/**
 * Convert screen coordinates to world tile coordinates.
 */
export function screenToTile(
	renderer: Renderer,
	state: GameState,
	screenX: number,
	screenY: number
): { x: number; y: number } {
	const { camera } = state;

	// Calculate world position
	const worldX = (screenX - renderer.app.screen.width / 2) / camera.zoom + camera.x;
	const worldY = (screenY - renderer.app.screen.height / 2) / camera.zoom + camera.y;

	// Convert to tile coordinates
	return {
		x: Math.floor(worldX / TILE_SIZE),
		y: Math.floor(worldY / TILE_SIZE)
	};
}
