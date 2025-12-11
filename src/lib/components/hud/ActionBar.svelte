<script lang="ts">
	import type { GameState } from '$lib/game/state';
	import type { Command } from '$lib/game/commands';
	import { dig, cancelDig } from '$lib/game/commands';
	import { computeActionButtonState } from './types';

	interface Props {
		state: GameState;
		onCommand: (command: Command) => void;
	}

	let { state, onCommand }: Props = $props();

	let actionButton = $derived(computeActionButtonState(state));

	function handleAction() {
		if (!actionButton.enabled) return;

		if (actionButton.action === 'dig') {
			onCommand(dig(state.selectedTiles));
		} else {
			onCommand(cancelDig(state.selectedTiles));
		}
	}
</script>

<div class="action-bar">
	<button
		class="action-button"
		class:enabled={actionButton.enabled}
		disabled={!actionButton.enabled}
		onclick={handleAction}
		title={actionButton.label}
	>
		{actionButton.label}
	</button>
</div>

<style>
	.action-bar {
		background: rgba(0, 0, 0, 0.8);
		padding: 8px 12px;
		border-radius: 4px;
	}

	.action-button {
		background: #333;
		color: #666;
		border: 1px solid #444;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: not-allowed;
		font-family: monospace;
		font-size: 13px;
		font-weight: bold;
		transition: background 0.15s, border-color 0.15s, color 0.15s;
	}

	.action-button.enabled {
		background: #4a9a4a;
		color: white;
		border-color: #5aaa5a;
		cursor: pointer;
	}

	.action-button.enabled:hover {
		background: #5aaa5a;
		border-color: #6aba6a;
	}
</style>
