/**
 * Physics Constants
 *
 * Values that control physical simulation behavior.
 */

// Gravity
/** Acceleration applied to falling entities per tick */
export const GRAVITY = 0.02;
/** Maximum falling speed (tiles per tick) */
export const TERMINAL_VELOCITY = 0.5;

// Movement
/** Gnome movement speed (tiles per tick) - equals 6 tiles/sec at 60 TPS */
export const GNOME_SPEED = 0.1;
/** Gnome idle stroll speed (30% of normal walking speed) */
export const GNOME_IDLE_SPEED = 0.03;
/** Damage dealt to tile per tick when mining */
export const GNOME_MINE_RATE = 1;

// Health
/** Starting/max health for gnomes */
export const GNOME_MAX_HEALTH = 100;
/** HP recovered per tick when incapacitated */
export const HEALTH_RECOVERY_RATE = 1;
