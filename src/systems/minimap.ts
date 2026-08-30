export const MINIMAP_SIZE = 176;
export const MINIMAP_MARGIN = 18;
export const MINIMAP_TOP = 16;
export const MINIMAP_WORLD_VIEW = 1500;

export const MINIMAP_PLAYER_BLIP_R = 36;
export const MINIMAP_TOWER_BLIP = 56;
export const MINIMAP_CHEST_BLIP_R = 22;

export function minimapScreenX(gameWidth: number): number {
  return gameWidth - MINIMAP_MARGIN - MINIMAP_SIZE;
}

export function minimapZoom(): number {
  return MINIMAP_SIZE / MINIMAP_WORLD_VIEW;
}
