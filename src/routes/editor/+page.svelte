<script lang="ts">
	import { dev } from '$app/environment';
	import Canvas from '$lib/editor/components/Canvas.svelte';
	import ToolPalette from '$lib/editor/components/ToolPalette.svelte';
	import ColorPicker from '$lib/editor/components/ColorPicker.svelte';
	import PresetSelector from '$lib/editor/components/PresetSelector.svelte';
	import Preview from '$lib/editor/components/Preview.svelte';
	import RenameModal from '$lib/editor/components/RenameModal.svelte';
	import { createEditorStore } from '$lib/editor/state/editor.svelte.js';
	import { createKeyboardHandler } from '$lib/editor/utils/keyboard.js';
	import { openAssetFile, saveAssetFile, saveAssetFileAs } from '$lib/editor/io/file.js';
	import { exportPng } from '$lib/editor/io/png.js';
	import { devSaveJson, devSavePng } from '$lib/editor/io/dev-save.js';

	const store = createEditorStore();

	// Rename modal state
	let showRenameModal = $state(false);

	// Reactive values for UI
	const asset = $derived(store.state.asset);
	const zoom = $derived(store.state.zoom);
	const showGrid = $derived(store.state.showGrid);
	const isDirty = $derived(store.state.isDirty);
	const jsonFileHandle = $derived(store.state.jsonFileHandle);
	const pngFileHandle = $derived(store.state.pngFileHandle);
	const canUndo = $derived(store.canUndo());
	const canRedo = $derived(store.canRedo());

	// File operation callbacks
	async function handleSave() {
		if (!asset) return;
		try {
			const handle = await saveAssetFile(asset, jsonFileHandle);
			if (handle) {
				store.setJsonHandle(handle);
				store.markClean();
			}
		} catch (error) {
			console.error('Failed to save:', error);
			alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async function handleSaveAs() {
		if (!asset) return;
		try {
			const handle = await saveAssetFileAs(asset);
			if (handle) {
				store.setJsonHandle(handle);
				store.markClean();
			}
		} catch (error) {
			console.error('Failed to save:', error);
			alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async function handleOpen() {
		// Check for unsaved changes
		if (isDirty) {
			const confirmed = confirm('You have unsaved changes. Do you want to continue without saving?');
			if (!confirmed) return;
		}

		try {
			const result = await openAssetFile();
			if (result) {
				store.loadAsset(result.asset);
				store.setJsonHandle(result.handle);
			}
		} catch (error) {
			console.error('Failed to open:', error);
			alert(`Failed to open: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async function handleExportPng() {
		if (!asset) return;
		try {
			const handle = await exportPng(asset, undefined, pngFileHandle);
			if (handle) {
				store.setPngHandle(handle);
			}
		} catch (error) {
			console.error('Failed to export PNG:', error);
			alert(`Failed to export PNG: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	// Keyboard handler with file operation callbacks
	const handleKeydown = createKeyboardHandler(store, {
		onSave: handleSave,
		onSaveAs: handleSaveAs,
		onOpenAsset: handleOpen,
		onExportPng: handleExportPng
	});

	// Unsaved changes warning
	function handleBeforeUnload(event: BeforeUnloadEvent) {
		if (isDirty) {
			event.preventDefault();
			event.returnValue = '';
			return '';
		}
	}

	function handleZoomIn() {
		store.zoomIn();
	}

	function handleZoomOut() {
		store.zoomOut();
	}

	function handleResetZoom() {
		store.resetZoom();
	}

	function handleToggleGrid() {
		store.toggleGrid();
	}

	function handleUndo() {
		store.undo();
	}

	function handleRedo() {
		store.redo();
	}

	// Dev-mode save handlers (save directly to project)
	async function handleDevSaveJson() {
		if (!asset) return;
		const result = await devSaveJson(asset);
		if (result.success) {
			store.markClean();
			alert(`Saved to: ${result.path}`);
		} else {
			alert(`Failed to save: ${result.error}`);
		}
	}

	async function handleDevSavePng() {
		if (!asset) return;
		const result = await devSavePng(asset);
		if (result.success) {
			alert(`Exported to: ${result.path}`);
		} else {
			alert(`Failed to export: ${result.error}`);
		}
	}

	function handleRename(newName: string) {
		if (!asset) return;
		store.updateAsset({ ...asset, name: newName });
		store.markDirty();
	}
</script>

<svelte:head>
	<title>{asset ? `${asset.name}${isDirty ? '*' : ''} - ` : ''}Pixel Art Editor - Gnomad</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} onbeforeunload={handleBeforeUnload} />

<div class="editor-layout">
	<header class="toolbar">
		<div class="toolbar-section">
			<PresetSelector {store} />
		</div>

		<div class="toolbar-section file-controls">
			<button
				class="file-btn"
				onclick={handleOpen}
				title="Open (Ctrl+O)"
			>
				Open
			</button>
			<button
				class="file-btn"
				onclick={handleSave}
				disabled={!asset}
				title="Save (Ctrl+S)"
			>
				Save
			</button>
			<button
				class="file-btn"
				onclick={handleSaveAs}
				disabled={!asset}
				title="Save As (Ctrl+Shift+S)"
			>
				Save As
			</button>
			<button
				class="file-btn export-btn"
				onclick={handleExportPng}
				disabled={!asset}
				title="Export PNG (Ctrl+E)"
			>
				Export PNG
			</button>
			{#if dev}
				<span class="dev-separator">|</span>
				<button
					class="file-btn dev-btn"
					onclick={handleDevSaveJson}
					disabled={!asset}
					title="Save JSON to src/lib/assets/source/ (Dev Only)"
				>
					Dev: Save JSON
				</button>
				<button
					class="file-btn dev-btn"
					onclick={handleDevSavePng}
					disabled={!asset}
					title="Export PNG to src/lib/assets/sprites/ (Dev Only)"
				>
					Dev: Export PNG
				</button>
			{/if}
		</div>

		<div class="toolbar-section">
			<ToolPalette {store} />
		</div>

		<div class="toolbar-section history-controls">
			<button
				class="history-btn"
				onclick={handleUndo}
				disabled={!canUndo}
				title="Undo (Ctrl+Z)"
			>
				&#x21B6;
			</button>
			<button
				class="history-btn"
				onclick={handleRedo}
				disabled={!canRedo}
				title="Redo (Ctrl+Y)"
			>
				&#x21B7;
			</button>
		</div>

		<div class="toolbar-section">
			<ColorPicker {store} />
		</div>

		<div class="toolbar-section view-controls">
			<button class="view-btn" onclick={handleZoomOut} title="Zoom Out (-)">-</button>
			<span class="zoom-display">{zoom}x</span>
			<button class="view-btn" onclick={handleZoomIn} title="Zoom In (+)">+</button>
			<button class="view-btn" onclick={handleResetZoom} title="Reset Zoom (0)">1:1</button>
			<button
				class="view-btn"
				class:active={showGrid}
				onclick={handleToggleGrid}
				title="Toggle Grid (#)"
			>
				#
			</button>
		</div>
	</header>

	<main class="canvas-area">
		<Canvas {store} />
	</main>

	<aside class="sidebar">
		{#if asset}
			<div class="asset-info">
				<h3>Asset Info</h3>
				<div class="name-field">
					<span class="name-label">Name</span>
					<button class="name-value" onclick={() => showRenameModal = true} title="Click to rename">
						<span class="name-text">{asset.name}</span>
						{#if isDirty}<span class="dirty-indicator">*</span>{/if}
						<span class="edit-icon">&#x270E;</span>
					</button>
				</div>
				<dl>
					<dt>Size</dt>
					<dd>{asset.width} x {asset.height}</dd>
					<dt>Preset</dt>
					<dd>{asset.preset}</dd>
					<dt>Pixels</dt>
					<dd>{asset.pixels.length}</dd>
				</dl>
			</div>
		{/if}

		<Preview {store} />
	</aside>

	{#if showRenameModal && asset}
		<RenameModal
			currentName={asset.name}
			onSave={handleRename}
			onClose={() => showRenameModal = false}
		/>
	{/if}
</div>

<style>
	.editor-layout {
		display: grid;
		grid-template-columns: 1fr 200px;
		grid-template-rows: auto 1fr;
		height: 100vh;
		background: #1a1a2e;
		color: #fff;
	}

	.toolbar {
		grid-column: 1 / -1;
		display: flex;
		gap: 1.5rem;
		padding: 0.5rem 1rem;
		background: #16213e;
		border-bottom: 1px solid #0f3460;
		align-items: center;
		flex-wrap: wrap;
	}

	.toolbar-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.file-controls {
		gap: 0.25rem;
	}

	.file-btn {
		padding: 0.5rem 0.75rem;
		background: #0f3460;
		border: 1px solid #1a1a2e;
		color: #fff;
		cursor: pointer;
		border-radius: 4px;
		font-size: 0.8rem;
	}

	.file-btn:hover:not(:disabled) {
		background: #1a4a7e;
	}

	.file-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.export-btn {
		background: #2e5a32;
	}

	.export-btn:hover:not(:disabled) {
		background: #3d7a43;
	}

	.dev-separator {
		color: #666;
		margin: 0 0.25rem;
	}

	.dev-btn {
		background: #8b4513;
		border-color: #a0522d;
	}

	.dev-btn:hover:not(:disabled) {
		background: #a0522d;
	}

	.history-controls {
		gap: 0.25rem;
	}

	.history-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: #0f3460;
		border: 1px solid #1a1a2e;
		color: #fff;
		cursor: pointer;
		border-radius: 4px;
		font-size: 1rem;
	}

	.history-btn:hover:not(:disabled) {
		background: #1a4a7e;
	}

	.history-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.view-controls {
		margin-left: auto;
	}

	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 32px;
		height: 32px;
		padding: 0 0.5rem;
		background: #0f3460;
		border: 1px solid #1a1a2e;
		color: #fff;
		cursor: pointer;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.view-btn:hover {
		background: #1a4a7e;
	}

	.view-btn.active {
		background: #1a4a7e;
		border-color: #fff;
	}

	.zoom-display {
		font-size: 0.875rem;
		font-family: monospace;
		min-width: 3rem;
		text-align: center;
	}

	.canvas-area {
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: auto;
		padding: 1rem;
	}

	.sidebar {
		background: #0f3460;
		padding: 1rem;
		border-left: 1px solid #16213e;
		overflow-y: auto;
	}

	.asset-info h3 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.name-field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		min-width: 0;
	}

	.name-label {
		font-size: 0.8rem;
		color: #666;
		flex-shrink: 0;
	}

	.name-value {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.35rem 0.5rem;
		background: #1a1a2e;
		border: 1px solid #16213e;
		color: #fff;
		border-radius: 4px;
		font-size: 0.8rem;
		font-family: monospace;
		cursor: pointer;
		text-align: left;
	}

	.name-value:hover {
		border-color: #1a4a7e;
		background: #252545;
	}

	.name-text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.edit-icon {
		flex-shrink: 0;
		font-size: 0.7rem;
		color: #666;
	}

	.name-value:hover .edit-icon {
		color: #fff;
	}

	.dirty-indicator {
		flex-shrink: 0;
		color: #f0a500;
		font-weight: bold;
	}

	.asset-info dl {
		margin: 0;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}

	.asset-info dt {
		color: #666;
	}

	.asset-info dd {
		margin: 0;
		font-family: monospace;
	}
</style>
