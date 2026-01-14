/**
 * PixiJS Renderer
 *
 * Handles all rendering using PixiJS v8.
 * Uses colored squares for MVP visuals.
 */

import { Application, Container, Graphics, Sprite } from 'pixi.js';
import { getGnomeIdleTexture } from '$lib/assets/loader';
import type { GameState } from '$lib/game/state';
import { TILE_CONFIG, TileType } from '$lib/components/tile';
import { GNOME_COLOR } from '$lib/components/gnome';
import { RESOURCE_CONFIG } from '$lib/components/resource';
import { BUILDING_CONFIG } from '$lib/components/building';
import {
	SELECTION_COLOR,
	SELECTION_ALPHA,
	TASK_MARKER_ALPHA,
	SKY_COLOR,
	TASK_PRIORITY_COLORS,
	TASK_UNREACHABLE_COLOR,
	PERMANENT_BACKGROUND_SKY_COLOR,
	PERMANENT_BACKGROUND_CAVE_COLOR,
	BACKGROUND_TILE_COLORS
} from '$lib/config/colors';
import { TILE_SIZE, SPRITE_WIDTH, SPRITE_HEIGHT } from '$lib/config/rendering';
import { TASK_UNREACHABLE_THRESHOLD } from '$lib/config/performance';
import { isWorldBoundary } from '$lib/world-gen/generator';
import { getBackgroundTileAt } from '$lib/ecs/background';

/**
 * Cached tile state for dirty checking.
 */
interface TileCache {
	graphics: Graphics;
	type: number; // Tile type to detect changes
	x: number;
	y: number;
}

/**
 * Cached gnome state for dirty checking.
 */
interface GnomeCache {
	sprite: Sprite;
	x: number;
	y: number;
}

/**
 * Cached resource state for dirty checking.
 */
interface ResourceCache {
	graphics: Graphics;
	x: number;
	y: number;
	type: number;
}

/**
 * Cached building state for dirty checking.
 */
interface BuildingCache {
	graphics: Graphics;
	x: number;
	y: number;
	type: string;
}

/**
 * Cached background tile state for dirty checking.
 */
interface BackgroundTileCache {
	graphics: Graphics;
	type: number;
	x: number;
	y: number;
}

/**
 * Build preview state for ghost rendering.
 */
export interface BuildPreview {
	buildingType: string;
	tileX: number;
	tileY: number;
	isValid: boolean;
}

/**
 * Renderer state.
 */
export interface Renderer {
	app: Application;
	/** Container for permanent background fills (sky/cave) */
	permanentBackgroundContainer: Container;
	/** Container for background tiles */
	backgroundContainer: Container;
	worldContainer: Container;
	entityContainer: Container;
	uiContainer: Container;
	tileGraphics: Map<number, Graphics>;
	gnomeSprites: Map<number, Sprite>;
	resourceGraphics: Map<number, Graphics>;
	buildingGraphics: Map<number, Graphics>;
	/** Graphics cache for background tiles */
	backgroundTileGraphics: Map<number, Graphics>;
	selectionGraphics: Graphics;
	taskMarkerGraphics: Graphics;
	buildPreviewGraphics: Graphics;
	socializationGraphics: Graphics;
	/** Graphics for sky fill */
	skyFillGraphics: Graphics;
	/** Graphics for cave fill */
	caveFillGraphics: Graphics;
	/** Cached tile state for dirty checking */
	tileCache: Map<number, TileCache>;
	/** Cached gnome positions for dirty checking */
	gnomeCache: Map<number, GnomeCache>;
	/** Cached resource state for dirty checking */
	resourceCache: Map<number, ResourceCache>;
	/** Cached building state for dirty checking */
	buildingCache: Map<number, BuildingCache>;
	/** Cached background tile state for dirty checking */
	backgroundTileCache: Map<number, BackgroundTileCache>;
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
		backgroundColor: SKY_COLOR,
		antialias: false,
		resolution: window.devicePixelRatio || 1,
		autoDensity: true
	});

	// Create layer containers (z-order: permanent background → background → world → entities → UI)
	const permanentBackgroundContainer = new Container();
	const backgroundContainer = new Container();
	const worldContainer = new Container();
	const entityContainer = new Container();
	const uiContainer = new Container();

	app.stage.addChild(permanentBackgroundContainer);
	app.stage.addChild(backgroundContainer);
	app.stage.addChild(worldContainer);
	app.stage.addChild(entityContainer);
	app.stage.addChild(uiContainer);

	// Create permanent background graphics (sky and cave fills)
	const skyFillGraphics = new Graphics();
	const caveFillGraphics = new Graphics();
	permanentBackgroundContainer.addChild(skyFillGraphics);
	permanentBackgroundContainer.addChild(caveFillGraphics);

	// Create UI graphics
	const selectionGraphics = new Graphics();
	const taskMarkerGraphics = new Graphics();
	const buildPreviewGraphics = new Graphics();
	const socializationGraphics = new Graphics();
	uiContainer.addChild(selectionGraphics);
	uiContainer.addChild(taskMarkerGraphics);
	uiContainer.addChild(buildPreviewGraphics);
	uiContainer.addChild(socializationGraphics);

	return {
		app,
		permanentBackgroundContainer,
		backgroundContainer,
		worldContainer,
		entityContainer,
		uiContainer,
		tileGraphics: new Map(),
		gnomeSprites: new Map(),
		resourceGraphics: new Map(),
		buildingGraphics: new Map(),
		backgroundTileGraphics: new Map(),
		selectionGraphics,
		taskMarkerGraphics,
		buildPreviewGraphics,
		socializationGraphics,
		skyFillGraphics,
		caveFillGraphics,
		tileCache: new Map(),
		gnomeCache: new Map(),
		resourceCache: new Map(),
		buildingCache: new Map(),
		backgroundTileCache: new Map()
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
	renderer.gnomeSprites.clear();
	renderer.resourceGraphics.clear();
	renderer.buildingGraphics.clear();
	renderer.backgroundTileGraphics.clear();
	renderer.tileCache.clear();
	renderer.gnomeCache.clear();
	renderer.buildingCache.clear();
	renderer.resourceCache.clear();
	renderer.backgroundTileCache.clear();
}

/**
 * Render a single frame.
 */
export function render(
	renderer: Renderer,
	state: GameState,
	interpolation: number,
	buildPreview?: BuildPreview | null
): void {
	const { camera } = state;

	// Interpolate camera position
	const camX = camera.x;
	const camY = camera.y;

	// Calculate viewport offset (center camera on screen)
	const screenWidth = renderer.app.screen.width;
	const screenHeight = renderer.app.screen.height;
	const offsetX = screenWidth / 2 - camX * camera.zoom;
	const offsetY = screenHeight / 2 - camY * camera.zoom;

	// Apply camera transform to all world-space containers
	renderer.permanentBackgroundContainer.x = offsetX;
	renderer.permanentBackgroundContainer.y = offsetY;
	renderer.permanentBackgroundContainer.scale.set(camera.zoom);

	renderer.backgroundContainer.x = offsetX;
	renderer.backgroundContainer.y = offsetY;
	renderer.backgroundContainer.scale.set(camera.zoom);

	renderer.worldContainer.x = offsetX;
	renderer.worldContainer.y = offsetY;
	renderer.worldContainer.scale.set(camera.zoom);

	renderer.entityContainer.x = offsetX;
	renderer.entityContainer.y = offsetY;
	renderer.entityContainer.scale.set(camera.zoom);

	renderer.uiContainer.x = offsetX;
	renderer.uiContainer.y = offsetY;
	renderer.uiContainer.scale.set(camera.zoom);

	// Render permanent background (sky above horizon, cave below)
	renderPermanentBackground(renderer, state);

	// Render background tiles (darker versions behind foreground)
	renderBackgroundTiles(renderer, state);

	// Render foreground tiles
	renderTiles(renderer, state);

	// Render buildings
	renderBuildings(renderer, state);

	// Render resources (dropped items on ground)
	renderResources(renderer, state);

	// Render gnomes
	renderGnomes(renderer, state, interpolation);

	// Render socialization indicators above gnomes
	renderSocializationIndicators(renderer, state);

	// Render selection
	renderSelection(renderer, state);

	// Render task markers
	renderTaskMarkers(renderer, state);

	// Render build preview (ghost)
	renderBuildPreview(renderer, buildPreview);
}

/**
 * Render permanent background fills (sky above horizon, cave below).
 */
function renderPermanentBackground(renderer: Renderer, state: GameState): void {
	const { worldWidth, worldHeight, horizonY } = state;

	// Sky region (y < horizonY)
	renderer.skyFillGraphics.clear();
	renderer.skyFillGraphics.rect(0, 0, worldWidth * TILE_SIZE, horizonY * TILE_SIZE);
	renderer.skyFillGraphics.fill(PERMANENT_BACKGROUND_SKY_COLOR);

	// Cave region (y >= horizonY)
	renderer.caveFillGraphics.clear();
	renderer.caveFillGraphics.rect(
		0,
		horizonY * TILE_SIZE,
		worldWidth * TILE_SIZE,
		(worldHeight - horizonY) * TILE_SIZE
	);
	renderer.caveFillGraphics.fill(PERMANENT_BACKGROUND_CAVE_COLOR);
}

/**
 * Render background tiles (darker versions behind foreground).
 * Uses dirty checking and frustum culling.
 */
function renderBackgroundTiles(renderer: Renderer, state: GameState): void {
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

	// Render visible background tiles
	for (let y = minTileY; y <= maxTileY; y++) {
		for (let x = minTileX; x <= maxTileX; x++) {
			const entity = getBackgroundTileAt(state, x, y);
			if (entity === null) continue;

			const tile = state.backgroundTiles.get(entity);
			if (!tile || tile.type === TileType.Air) continue;

			visibleTiles.add(entity);

			// Check cache for dirty checking
			const cached = renderer.backgroundTileCache.get(entity);
			if (cached && cached.type === tile.type && cached.x === x && cached.y === y) {
				// Tile unchanged, skip redraw
				continue;
			}

			let graphics = renderer.backgroundTileGraphics.get(entity);
			if (!graphics) {
				graphics = new Graphics();
				renderer.backgroundContainer.addChild(graphics);
				renderer.backgroundTileGraphics.set(entity, graphics);
			}

			// Draw background tile with darker color
			const color = BACKGROUND_TILE_COLORS[tile.type];
			graphics.clear();
			graphics.rect(0, 0, TILE_SIZE, TILE_SIZE);
			graphics.fill(color);

			graphics.x = x * TILE_SIZE;
			graphics.y = y * TILE_SIZE;

			// Update cache
			renderer.backgroundTileCache.set(entity, { graphics, type: tile.type, x, y });
		}
	}

	// Remove background tiles that are no longer visible
	for (const [entity, graphics] of renderer.backgroundTileGraphics) {
		if (!visibleTiles.has(entity)) {
			renderer.backgroundContainer.removeChild(graphics);
			graphics.destroy();
			renderer.backgroundTileGraphics.delete(entity);
			renderer.backgroundTileCache.delete(entity);
		}
	}
}

/**
 * Render all tiles.
 * Uses dirty checking to skip redraws for unchanged tiles.
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

			// Determine display type (world boundaries render as Bedrock)
			const isBoundary = isWorldBoundary(state, x, y);
			const displayType = isBoundary ? TileType.Bedrock : tile.type;

			// Check cache for dirty checking
			const cached = renderer.tileCache.get(entity);
			if (cached && cached.type === displayType && cached.x === x && cached.y === y) {
				// Tile unchanged, skip redraw
				continue;
			}

			let graphics = renderer.tileGraphics.get(entity);
			if (!graphics) {
				graphics = new Graphics();
				renderer.worldContainer.addChild(graphics);
				renderer.tileGraphics.set(entity, graphics);
			}

			// Draw tile with appropriate color
			const config = TILE_CONFIG[displayType];
			graphics.clear();
			graphics.rect(0, 0, TILE_SIZE, TILE_SIZE);
			graphics.fill(config.color);

			graphics.x = x * TILE_SIZE;
			graphics.y = y * TILE_SIZE;

			// Update cache with display type
			renderer.tileCache.set(entity, { graphics, type: displayType, x, y });
		}
	}

	// Remove tiles that are no longer visible
	for (const [entity, graphics] of renderer.tileGraphics) {
		if (!visibleTiles.has(entity)) {
			renderer.worldContainer.removeChild(graphics);
			graphics.destroy();
			renderer.tileGraphics.delete(entity);
			renderer.tileCache.delete(entity);
		}
	}
}

/**
 * Render all building entities.
 * Uses dirty checking to skip redraws for unchanged buildings.
 */
function renderBuildings(renderer: Renderer, state: GameState): void {
	const activeBuildings = new Set<number>();

	for (const [entity, building] of state.buildings) {
		activeBuildings.add(entity);

		const position = state.positions.get(entity);
		if (!position) continue;

		const config = BUILDING_CONFIG[building.type];

		// Calculate screen position
		const screenX = position.x * TILE_SIZE;
		const screenY = position.y * TILE_SIZE;
		const width = config.width * TILE_SIZE;
		const height = config.height * TILE_SIZE;

		// Check cache for dirty checking
		const cached = renderer.buildingCache.get(entity);
		if (
			cached &&
			cached.x === screenX &&
			cached.y === screenY &&
			cached.type === building.type
		) {
			// Building unchanged, skip redraw
			continue;
		}

		let graphics = renderer.buildingGraphics.get(entity);
		if (!graphics) {
			graphics = new Graphics();
			renderer.worldContainer.addChild(graphics);
			renderer.buildingGraphics.set(entity, graphics);
		}

		// Draw building as colored rectangle
		graphics.clear();
		graphics.rect(0, 0, width, height);
		graphics.fill(config.color);

		// Draw border
		graphics.rect(0, 0, width, height);
		graphics.stroke({ color: 0x000000, width: 1 });

		graphics.x = screenX;
		graphics.y = screenY;

		// Update cache
		renderer.buildingCache.set(entity, {
			graphics,
			x: screenX,
			y: screenY,
			type: building.type
		});
	}

	// Remove buildings that no longer exist
	for (const [entity, graphics] of renderer.buildingGraphics) {
		if (!activeBuildings.has(entity)) {
			renderer.worldContainer.removeChild(graphics);
			graphics.destroy();
			renderer.buildingGraphics.delete(entity);
			renderer.buildingCache.delete(entity);
		}
	}
}

/**
 * Render all resource entities on the ground.
 * Uses dirty checking to skip redraws for unchanged resources.
 */
function renderResources(renderer: Renderer, state: GameState): void {
	const activeResources = new Set<number>();

	// Resource visual size (smaller than tile, centered)
	const RESOURCE_SIZE = 6;
	const RESOURCE_OFFSET = (TILE_SIZE - RESOURCE_SIZE) / 2;

	for (const [entity, resource] of state.resources) {
		activeResources.add(entity);

		const position = state.positions.get(entity);
		if (!position) continue;

		// Calculate screen position (centered in tile)
		const screenX = position.x * TILE_SIZE + RESOURCE_OFFSET;
		const screenY = position.y * TILE_SIZE + RESOURCE_OFFSET;

		// Check cache for dirty checking
		const cached = renderer.resourceCache.get(entity);
		if (cached && cached.x === screenX && cached.y === screenY && cached.type === resource.type) {
			// Resource unchanged, skip redraw
			continue;
		}

		let graphics = renderer.resourceGraphics.get(entity);
		if (!graphics) {
			graphics = new Graphics();
			renderer.entityContainer.addChild(graphics);
			renderer.resourceGraphics.set(entity, graphics);
		}

		// Draw resource with appropriate color
		const config = RESOURCE_CONFIG[resource.type];
		graphics.clear();
		graphics.rect(0, 0, RESOURCE_SIZE, RESOURCE_SIZE);
		graphics.fill(config.color);

		graphics.x = screenX;
		graphics.y = screenY;

		// Update cache
		renderer.resourceCache.set(entity, { graphics, x: screenX, y: screenY, type: resource.type });
	}

	// Remove resources that no longer exist
	for (const [entity, graphics] of renderer.resourceGraphics) {
		if (!activeResources.has(entity)) {
			renderer.entityContainer.removeChild(graphics);
			graphics.destroy();
			renderer.resourceGraphics.delete(entity);
			renderer.resourceCache.delete(entity);
		}
	}
}

/**
 * Render all gnomes.
 * Uses sprites when available, falls back to colored squares.
 */
function renderGnomes(renderer: Renderer, state: GameState, interpolation: number): void {
	const activeGnomes = new Set<number>();
	const gnomeTexture = getGnomeIdleTexture();

	// Gnome sprite offset: sprite height (48) minus tile height (32) = 16px
	const GNOME_Y_OFFSET = SPRITE_HEIGHT - TILE_SIZE;

	for (const [entity, gnome] of state.gnomes) {
		activeGnomes.add(entity);

		const position = state.positions.get(entity);
		if (!position) continue;

		// Calculate screen position
		// Sprite is 32x48, so offset Y to align feet with tile bottom
		const screenX = position.x * TILE_SIZE;
		const screenY = position.y * TILE_SIZE - GNOME_Y_OFFSET;

		// Check cache for dirty checking
		const cached = renderer.gnomeCache.get(entity);
		if (cached && cached.x === screenX && cached.y === screenY) {
			// Gnome hasn't moved, skip update
			continue;
		}

		let sprite = renderer.gnomeSprites.get(entity);
		if (!sprite) {
			if (gnomeTexture) {
				// Use sprite texture
				sprite = new Sprite(gnomeTexture);
			} else {
				// Fallback: create a colored square using Graphics converted to sprite
				const graphics = new Graphics();
				graphics.rect(0, 0, TILE_SIZE * 0.8, TILE_SIZE * 0.8);
				graphics.fill(GNOME_COLOR);
				const texture = renderer.app.renderer.generateTexture(graphics);
				sprite = new Sprite(texture);
				graphics.destroy();
			}
			renderer.entityContainer.addChild(sprite);
			renderer.gnomeSprites.set(entity, sprite);
		}

		// Update position
		sprite.x = screenX;
		sprite.y = screenY;

		// Update cache
		renderer.gnomeCache.set(entity, { sprite, x: screenX, y: screenY });
	}

	// Remove gnomes that no longer exist
	for (const [entity, sprite] of renderer.gnomeSprites) {
		if (!activeGnomes.has(entity)) {
			renderer.entityContainer.removeChild(sprite);
			sprite.destroy();
			renderer.gnomeSprites.delete(entity);
			renderer.gnomeCache.delete(entity);
		}
	}
}

/**
 * Render socialization indicators ("..." ellipsis) above gnomes that are socializing.
 */
function renderSocializationIndicators(renderer: Renderer, state: GameState): void {
	renderer.socializationGraphics.clear();

	// Indicator position: above gnome sprite (sprite height 48, offset 16 from tile)
	const INDICATOR_Y_OFFSET = SPRITE_HEIGHT + 4; // 4px above gnome head

	for (const [entity, gnome] of state.gnomes) {
		// Only render for socializing gnomes
		if (gnome.idleBehavior?.type !== 'socializing') continue;

		const position = state.positions.get(entity);
		if (!position) continue;

		// Calculate screen position (above gnome sprite)
		const screenX = position.x * TILE_SIZE + TILE_SIZE * 0.5;
		const screenY = position.y * TILE_SIZE - INDICATOR_Y_OFFSET;

		// Draw "..." ellipsis as 3 small circles
		const dotRadius = 1.5;
		const dotSpacing = 4;
		const dotColor = 0xffffff;

		for (let i = 0; i < 3; i++) {
			const dotX = screenX + (i - 1) * dotSpacing;
			renderer.socializationGraphics.circle(dotX, screenY, dotRadius);
		}
		renderer.socializationGraphics.fill({ color: dotColor, alpha: 0.9 });
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
 * Each task marker is colored based on its priority level:
 * - Urgent: Red (0xff4444)
 * - High: Yellow/Orange (0xffaa00)
 * - Normal: Blue (0x4a90d9)
 * - Low: Gray (0x888888)
 * - Unreachable: Dark Red (0x8b0000) - overrides priority color
 */
function renderTaskMarkers(renderer: Renderer, state: GameState): void {
	renderer.taskMarkerGraphics.clear();

	if (state.tasks.size === 0) return;

	// Draw each task marker with its priority color (or unreachable color)
	for (const [, task] of state.tasks) {
		// Use dark red for potentially unreachable tasks
		const isUnreachable = task.unreachableCount >= TASK_UNREACHABLE_THRESHOLD;
		const color = isUnreachable ? TASK_UNREACHABLE_COLOR : TASK_PRIORITY_COLORS[task.priority];

		renderer.taskMarkerGraphics.rect(
			task.targetX * TILE_SIZE + 2,
			task.targetY * TILE_SIZE + 2,
			TILE_SIZE - 4,
			TILE_SIZE - 4
		);

		renderer.taskMarkerGraphics.stroke({
			color,
			width: 2,
			alpha: TASK_MARKER_ALPHA
		});
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

/**
 * Get visible tile bounds (min/max tile coordinates visible on screen).
 */
export function getVisibleBounds(
	renderer: Renderer,
	state: GameState
): { minX: number; maxX: number; minY: number; maxY: number } {
	const topLeft = screenToTile(renderer, state, 0, 0);
	const bottomRight = screenToTile(
		renderer,
		state,
		renderer.app.screen.width,
		renderer.app.screen.height
	);

	return {
		minX: topLeft.x - 1, // Add margin for entities partially visible
		maxX: bottomRight.x + 1,
		minY: topLeft.y - 1,
		maxY: bottomRight.y + 1
	};
}

/**
 * Get current FPS from the PixiJS ticker.
 */
export function getFPS(renderer: Renderer): number {
	return renderer.app.ticker.FPS;
}

/**
 * Render building placement preview (ghost).
 */
function renderBuildPreview(renderer: Renderer, preview?: BuildPreview | null): void {
	renderer.buildPreviewGraphics.clear();

	if (!preview) return;

	const config = BUILDING_CONFIG[preview.buildingType as keyof typeof BUILDING_CONFIG];
	if (!config) return;

	const screenX = preview.tileX * TILE_SIZE;
	const screenY = preview.tileY * TILE_SIZE;
	const width = config.width * TILE_SIZE;
	const height = config.height * TILE_SIZE;

	// Choose color based on validity
	const fillColor = preview.isValid ? 0x00ff00 : 0xff0000;
	const fillAlpha = 0.4;
	const strokeColor = preview.isValid ? 0x00aa00 : 0xaa0000;

	// Draw filled rectangle
	renderer.buildPreviewGraphics.rect(screenX, screenY, width, height);
	renderer.buildPreviewGraphics.fill({ color: fillColor, alpha: fillAlpha });

	// Draw border
	renderer.buildPreviewGraphics.rect(screenX, screenY, width, height);
	renderer.buildPreviewGraphics.stroke({ color: strokeColor, width: 2, alpha: 0.8 });
}
