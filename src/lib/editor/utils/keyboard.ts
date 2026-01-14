/**
 * Keyboard shortcuts for the Pixel Art Editor
 */

import type { EditorStore } from '../state/editor.svelte.js';
import type { EditorTool } from '../types.js';

/**
 * Keyboard shortcut definitions.
 */
export const KEYBOARD_SHORTCUTS = {
	// Tools
	p: 'pencil',
	e: 'eraser',
	g: 'fill',
	i: 'picker',

	// View
	'+': 'zoomIn',
	'=': 'zoomIn',
	'-': 'zoomOut',
	'0': 'resetZoom',
	'#': 'toggleGrid',

	// History
	'ctrl+z': 'undo',
	'ctrl+y': 'redo',
	'ctrl+shift+z': 'redo',

	// File
	'ctrl+s': 'save',
	'ctrl+shift+s': 'saveAs',
	'ctrl+e': 'exportPng',
	'ctrl+n': 'newAsset',
	'ctrl+o': 'openAsset',

	// Clipboard
	'ctrl+v': 'paste',

	// Color
	x: 'swapColors'
} as const;

export type ShortcutAction = (typeof KEYBOARD_SHORTCUTS)[keyof typeof KEYBOARD_SHORTCUTS];

/**
 * Parse keyboard event into shortcut key string.
 */
export function getShortcutKey(event: KeyboardEvent): string {
	const parts: string[] = [];

	if (event.ctrlKey || event.metaKey) parts.push('ctrl');
	if (event.shiftKey) parts.push('shift');
	if (event.altKey) parts.push('alt');

	// Normalize key
	let key = event.key.toLowerCase();

	// Handle special keys
	if (key === ' ') key = 'space';

	parts.push(key);

	return parts.join('+');
}

/**
 * Get action for a shortcut key.
 */
export function getShortcutAction(key: string): ShortcutAction | undefined {
	return KEYBOARD_SHORTCUTS[key as keyof typeof KEYBOARD_SHORTCUTS];
}

/**
 * Check if an element is an input or editable element.
 */
function isInputElement(element: Element | null): boolean {
	if (!element) return false;
	const tagName = element.tagName.toLowerCase();
	return (
		tagName === 'input' ||
		tagName === 'textarea' ||
		tagName === 'select' ||
		(element as HTMLElement).isContentEditable
	);
}

/**
 * Handle keyboard shortcut and execute action.
 * Returns true if shortcut was handled.
 */
export function handleKeyboardShortcut(
	event: KeyboardEvent,
	store: EditorStore,
	callbacks?: {
		onSave?: () => void;
		onSaveAs?: () => void;
		onExportPng?: () => void;
		onNewAsset?: () => void;
		onOpenAsset?: () => void;
		onPaste?: () => void;
	}
): boolean {
	// Don't handle shortcuts when typing in input fields
	if (isInputElement(event.target as Element)) {
		return false;
	}

	const key = getShortcutKey(event);
	const action = getShortcutAction(key);

	if (!action) return false;

	// Execute action
	switch (action) {
		// Tools
		case 'pencil':
		case 'eraser':
		case 'fill':
		case 'picker':
			store.setTool(action as EditorTool);
			break;

		// View
		case 'zoomIn':
			store.zoomIn();
			break;
		case 'zoomOut':
			store.zoomOut();
			break;
		case 'resetZoom':
			store.resetZoom();
			break;
		case 'toggleGrid':
			store.toggleGrid();
			break;

		// History
		case 'undo':
			store.undo();
			break;
		case 'redo':
			store.redo();
			break;

		// File operations (delegated to callbacks)
		case 'save':
			callbacks?.onSave?.();
			break;
		case 'saveAs':
			callbacks?.onSaveAs?.();
			break;
		case 'exportPng':
			callbacks?.onExportPng?.();
			break;
		case 'newAsset':
			callbacks?.onNewAsset?.();
			break;
		case 'openAsset':
			callbacks?.onOpenAsset?.();
			break;

		// Clipboard
		case 'paste':
			callbacks?.onPaste?.();
			break;

		// Color
		case 'swapColors':
			store.swapColors();
			break;

		default:
			return false;
	}

	// Prevent default browser behavior
	event.preventDefault();
	return true;
}

/**
 * Create keyboard event handler for the editor.
 */
export function createKeyboardHandler(
	store: EditorStore,
	callbacks?: {
		onSave?: () => void;
		onSaveAs?: () => void;
		onExportPng?: () => void;
		onNewAsset?: () => void;
		onOpenAsset?: () => void;
		onPaste?: () => void;
	}
): (event: KeyboardEvent) => void {
	return (event: KeyboardEvent) => {
		handleKeyboardShortcut(event, store, callbacks);
	};
}
