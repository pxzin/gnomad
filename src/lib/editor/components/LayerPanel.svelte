<script lang="ts">
	import type { EditorStore } from '../state/editor.svelte.js';

	interface Props {
		store: EditorStore;
	}

	let { store }: Props = $props();

	const asset = $derived(store.state.asset);
	const activeLayerId = $derived(store.state.activeLayerId);

	// Reverse layers for display (top layer first in UI)
	const layersReversed = $derived(asset ? [...asset.layers].reverse() : []);

	// State for renaming
	let editingLayerId = $state<string | null>(null);
	let editingName = $state('');

	// Drag state
	let draggedLayerId = $state<string | null>(null);

	function handleAddLayer() {
		store.addLayer();
	}

	function handleDeleteLayer(layerId: string) {
		store.deleteLayer(layerId);
	}

	function handleSelectLayer(layerId: string) {
		store.selectLayer(layerId);
	}

	function handleToggleVisibility(layerId: string, currentVisible: boolean) {
		store.setLayerVisibility(layerId, !currentVisible);
	}

	function handleOpacityChange(layerId: string, event: Event) {
		const target = event.target as HTMLInputElement;
		const opacity = parseFloat(target.value) / 100;
		store.setLayerOpacity(layerId, opacity);
	}

	function handleMergeDown(layerId: string) {
		store.mergeLayerDown(layerId);
	}

	function handleFlatten() {
		store.flattenAllLayers();
	}

	function handleDuplicateLayer(layerId: string) {
		store.duplicateLayer(layerId);
	}

	// Renaming
	function startRename(layerId: string, currentName: string) {
		editingLayerId = layerId;
		editingName = currentName;
	}

	function commitRename() {
		if (editingLayerId && editingName.trim()) {
			store.renameLayer(editingLayerId, editingName.trim());
		}
		editingLayerId = null;
		editingName = '';
	}

	function cancelRename() {
		editingLayerId = null;
		editingName = '';
	}

	function handleRenameKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			commitRename();
		} else if (event.key === 'Escape') {
			cancelRename();
		}
	}

	// Drag and drop
	function handleDragStart(event: DragEvent, layerId: string) {
		draggedLayerId = layerId;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', layerId);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(event: DragEvent, targetLayerId: string) {
		event.preventDefault();
		if (!draggedLayerId || !asset) return;
		if (draggedLayerId === targetLayerId) return;

		// Find the indices (in original order, not reversed)
		const draggedIndex = asset.layers.findIndex(l => l.id === draggedLayerId);
		const targetIndex = asset.layers.findIndex(l => l.id === targetLayerId);

		if (draggedIndex !== -1 && targetIndex !== -1) {
			store.reorderLayer(draggedLayerId, targetIndex);
		}

		draggedLayerId = null;
	}

	function handleDragEnd() {
		draggedLayerId = null;
	}

	// Check if layer is at bottom (cannot merge down)
	function isBottomLayer(layerId: string): boolean {
		if (!asset) return true;
		return asset.layers[0]?.id === layerId;
	}

	// Check if this is the only layer
	function isOnlyLayer(): boolean {
		return !asset || asset.layers.length <= 1;
	}

	// Helper to stop propagation
	function stopProp<T extends Event>(handler: (e: T) => void) {
		return (e: T) => {
			e.stopPropagation();
			handler(e);
		};
	}
</script>

<div class="layer-panel">
	<div class="panel-header">
		<h3>Layers</h3>
		<div class="panel-actions">
			<button class="icon-btn" onclick={handleAddLayer} title="Add Layer">+</button>
			<button
				class="icon-btn"
				onclick={handleFlatten}
				disabled={isOnlyLayer()}
				title="Flatten All Layers"
			>
				&#x229E;
			</button>
		</div>
	</div>

	<div class="layer-list">
		{#each layersReversed as layer (layer.id)}
			<div
				class="layer-item"
				class:active={layer.id === activeLayerId}
				class:dragging={layer.id === draggedLayerId}
				draggable="true"
				role="button"
				tabindex="0"
				onclick={() => handleSelectLayer(layer.id)}
				onkeydown={(e) => e.key === 'Enter' && handleSelectLayer(layer.id)}
				ondragstart={(e) => handleDragStart(e, layer.id)}
				ondragover={handleDragOver}
				ondrop={(e) => handleDrop(e, layer.id)}
				ondragend={handleDragEnd}
			>
				<button
					class="visibility-btn"
					class:hidden={!layer.visible}
					onclick={stopProp(() => handleToggleVisibility(layer.id, layer.visible))}
					title={layer.visible ? 'Hide Layer' : 'Show Layer'}
				>
					{layer.visible ? '&#x1F441;' : '&#x1F576;'}
				</button>

				<div class="layer-info">
					{#if editingLayerId === layer.id}
						<input
							type="text"
							class="rename-input"
							bind:value={editingName}
							onblur={commitRename}
							onkeydown={handleRenameKeydown}
						/>
					{:else}
						<span
							class="layer-name"
							ondblclick={() => startRename(layer.id, layer.name)}
						>
							{layer.name}
						</span>
					{/if}
				</div>

				<div class="layer-actions">
					<button
						class="icon-btn small"
						onclick={stopProp(() => handleDuplicateLayer(layer.id))}
						title="Duplicate Layer"
					>
						&#x2398;
					</button>
					<button
						class="icon-btn small"
						onclick={stopProp(() => handleMergeDown(layer.id))}
						disabled={isBottomLayer(layer.id)}
						title="Merge Down"
					>
						&#x2B07;
					</button>
					<button
						class="icon-btn small danger"
						onclick={stopProp(() => handleDeleteLayer(layer.id))}
						disabled={isOnlyLayer()}
						title="Delete Layer"
					>
						&#x2715;
					</button>
				</div>
			</div>

			<div class="layer-opacity">
				<input
					type="range"
					min="0"
					max="100"
					value={Math.round(layer.opacity * 100)}
					oninput={(e) => handleOpacityChange(layer.id, e)}
					onclick={stopProp(() => {})}
					title={`Opacity: ${Math.round(layer.opacity * 100)}%`}
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	.layer-panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 300px;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.panel-header h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.panel-actions {
		display: flex;
		gap: 0.25rem;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		background: #0f3460;
		border: 1px solid #1a1a2e;
		color: #fff;
		cursor: pointer;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.icon-btn:hover:not(:disabled) {
		background: #1a4a7e;
	}

	.icon-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.icon-btn.small {
		width: 20px;
		height: 20px;
		font-size: 0.75rem;
	}

	.icon-btn.danger:hover:not(:disabled) {
		background: #8b2020;
	}

	.layer-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		overflow-y: auto;
		max-height: 240px;
	}

	.layer-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.5rem;
		background: #1a1a2e;
		border: 1px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.1s, border-color 0.1s;
	}

	.layer-item:hover {
		background: #252545;
	}

	.layer-item.active {
		border-color: #1a4a7e;
		background: #1a2a4e;
	}

	.layer-item.dragging {
		opacity: 0.5;
	}

	.visibility-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		background: transparent;
		border: none;
		color: #fff;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.visibility-btn.hidden {
		color: #666;
	}

	.layer-info {
		flex: 1;
		min-width: 0;
	}

	.layer-name {
		display: block;
		font-size: 0.8rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.rename-input {
		width: 100%;
		padding: 0.15rem 0.25rem;
		background: #0f3460;
		border: 1px solid #1a4a7e;
		color: #fff;
		border-radius: 2px;
		font-size: 0.8rem;
	}

	.layer-actions {
		display: flex;
		gap: 0.15rem;
	}

	.layer-opacity {
		padding: 0 0.5rem 0.25rem 2rem;
	}

	.layer-opacity input[type="range"] {
		width: 100%;
		height: 4px;
		background: #0f3460;
		border-radius: 2px;
		cursor: pointer;
		-webkit-appearance: none;
		appearance: none;
	}

	.layer-opacity input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 10px;
		height: 10px;
		background: #1a4a7e;
		border-radius: 50%;
		cursor: pointer;
	}

	.layer-opacity input[type="range"]::-moz-range-thumb {
		width: 10px;
		height: 10px;
		background: #1a4a7e;
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}
</style>
