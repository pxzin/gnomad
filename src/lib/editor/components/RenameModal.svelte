<script lang="ts">
	import { tick } from 'svelte';

	interface Props {
		currentName: string;
		onSave: (newName: string) => void;
		onClose: () => void;
	}

	let { currentName, onSave, onClose }: Props = $props();

	let inputValue = $state(currentName);
	let inputEl: HTMLInputElement | undefined = $state(undefined);

	// Focus and select input when element is available
	$effect(() => {
		if (inputEl) {
			// Wait for DOM update then focus and select
			tick().then(() => {
				if (inputEl) {
					inputEl.focus();
					inputEl.select();
				}
			});
		}
	});

	function handleSave() {
		const newName = inputValue.trim() || 'untitled';
		onSave(newName);
		onClose();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSave();
		} else if (event.key === 'Escape') {
			onClose();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="modal-backdrop" onclick={handleBackdropClick} onkeydown={handleKeydown} role="dialog" aria-modal="true" tabindex="0">
	<div class="modal">
		<h3>Rename Asset</h3>
		<input
			bind:this={inputEl}
			type="text"
			bind:value={inputValue}
			placeholder="Asset name"
		/>
		<div class="modal-actions">
			<button class="btn-cancel" onclick={onClose}>Cancel</button>
			<button class="btn-save" onclick={handleSave}>Save</button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: #16213e;
		border: 1px solid #0f3460;
		border-radius: 8px;
		padding: 1.5rem;
		min-width: 300px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
	}

	.modal h3 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
	}

	.modal input {
		width: 100%;
		padding: 0.75rem;
		background: #1a1a2e;
		border: 1px solid #0f3460;
		color: #fff;
		border-radius: 4px;
		font-size: 1rem;
		font-family: monospace;
		margin-bottom: 1rem;
	}

	.modal input:focus {
		outline: none;
		border-color: #1a4a7e;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.modal-actions button {
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-size: 0.875rem;
		cursor: pointer;
		border: 1px solid transparent;
	}

	.btn-cancel {
		background: #1a1a2e;
		color: #888;
		border-color: #0f3460;
	}

	.btn-cancel:hover {
		background: #0f3460;
		color: #fff;
	}

	.btn-save {
		background: #1a4a7e;
		color: #fff;
	}

	.btn-save:hover {
		background: #2a5a8e;
	}
</style>
