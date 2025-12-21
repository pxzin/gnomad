# Contracts: Climbing Mechanics

**Feature**: 011-climbing-mechanics
**Date**: 2025-12-21

## Overview

This feature has no external API contracts. All functionality is internal game logic:

- ECS components (Health, extended Gnome)
- Game systems (climbing, health)
- Configuration constants

## Internal Interfaces

The following TypeScript interfaces serve as internal contracts (defined in data-model.md):

- `Health` - Health component interface
- `SurfaceModifier` - Surface climbing properties
- `ClimbableSurfaceType` - Enum for surface types

These interfaces are documented in `data-model.md` and implemented in source files.
