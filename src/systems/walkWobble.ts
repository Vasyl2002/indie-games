import Phaser from 'phaser';

export type WalkWobbleState = {
  phase: number;
  baseScaleX: number;
  baseScaleY: number;
};

const MOVE_SPEED_THRESHOLD = 18;

export function captureWalkBase(sprite: Phaser.GameObjects.Sprite): WalkWobbleState {
  return {
    phase: 0,
    baseScaleX: sprite.scaleX,
    baseScaleY: sprite.scaleY,
  };
}

export function applyWalkWobble(
  sprite: Phaser.GameObjects.Sprite,
  speed: number,
  deltaMs: number,
  state: WalkWobbleState,
): void {
  const moving = speed > MOVE_SPEED_THRESHOLD;
  if (moving) {
    const cadence = Phaser.Math.Clamp(speed / 90, 0.65, 2.8);
    state.phase += deltaMs * 0.012 * cadence;
    const sway = Math.sin(state.phase) * 0.22;
    const bob = Math.sin(state.phase * 2) * 0.08;
    sprite.setRotation(sway);
    sprite.setScale(state.baseScaleX * (1 + sway * 0.18), state.baseScaleY * (1 + bob));
    return;
  }

  state.phase *= Math.exp(-deltaMs * 0.01);
  const settle = Math.min(1, deltaMs * 0.016);
  sprite.setRotation(Phaser.Math.Linear(sprite.rotation, 0, settle));
  sprite.setScale(
    Phaser.Math.Linear(sprite.scaleX, state.baseScaleX, settle),
    Phaser.Math.Linear(sprite.scaleY, state.baseScaleY, settle),
  );
}

export function resetWalkWobble(sprite: Phaser.GameObjects.Sprite, state: WalkWobbleState): void {
  state.phase = 0;
  sprite.setRotation(0);
  sprite.setScale(state.baseScaleX, state.baseScaleY);
}
