/**
 * Background Component
 *
 * Types for permanent background layers that cannot be mined.
 */

/**
 * Permanent background types.
 * Rendered as fill regions, not individual tiles.
 */
export enum PermanentBackgroundType {
	/** Above horizon - sky color */
	Sky = 'sky',
	/** Below horizon - cave/rock color */
	Cave = 'cave'
}
