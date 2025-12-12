<script lang="ts">
	import type { GameState } from '$lib/game/state';
	import type { Command } from '$lib/game/commands';
	import { dig, cancelDig } from '$lib/game/commands';
	import { computeAvailableActions } from './types';

	interface Props {
		state: GameState;
		onCommand: (command: Command) => void;
	}

	let { state, onCommand }: Props = $props();

	let actions = $derived(computeAvailableActions(state));

	function handleDig() {
		if (actions.canDig) {
			onCommand(dig(actions.digTiles));
		}
	}

	function handleCancelDig() {
		if (actions.canCancelDig) {
			onCommand(cancelDig(actions.cancelTiles));
		}
	}
</script>

<div class="action-bar">
	<button
		class="action-button"
		class:enabled={actions.canDig}
		disabled={!actions.canDig}
		onclick={handleDig}
		title="Dig selected tiles"
	>
		Dig (D)
	</button>
	<button
		class="action-button cancel"
		class:enabled={actions.canCancelDig}
		disabled={!actions.canCancelDig}
		onclick={handleCancelDig}
		title="Cancel dig tasks"
	>
		Cancel (X)
	</button>
</div>

<style>
	.action-bar {
		background: rgba(0, 0, 0, 0.8);
		padding: 8px 12px;
		border-radius: 4px;
		display: flex;
		gap: 8px;
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

	.action-button.cancel.enabled {
		background: #9a4a4a;
		border-color: #aa5a5a;
	}

	.action-button.cancel.enabled:hover {
		background: #aa5a5a;
		border-color: #ba6a6a;
	}
</style>
