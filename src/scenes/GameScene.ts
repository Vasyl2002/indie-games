import Phaser from 'phaser';

const PLAYER_SPEED = 260;
const PLAYER_SIZE = 40;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private keys!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super('GameScene');
  }

  create(): void {
    const { width, height } = this.scale;

    this.drawArena(width, height);
    this.createPlayerTexture();

    this.player = this.physics.add.sprite(width / 2, height / 2, 'player');
    this.player.setCollideWorldBounds(true);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is not available');
    }

    this.keys = {
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.add
      .text(width / 2, 24, 'WASD to move', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e8eef7',
      })
      .setOrigin(0.5, 0);
  }

  update(): void {
    let vx = 0;
    let vy = 0;

    if (this.keys.a.isDown) {
      vx -= 1;
    }
    if (this.keys.d.isDown) {
      vx += 1;
    }
    if (this.keys.w.isDown) {
      vy -= 1;
    }
    if (this.keys.s.isDown) {
      vy += 1;
    }

    if (vx !== 0 || vy !== 0) {
      const length = Math.hypot(vx, vy);
      vx = (vx / length) * PLAYER_SPEED;
      vy = (vy / length) * PLAYER_SPEED;
    }

    this.player.setVelocity(vx, vy);
  }

  private drawArena(width: number, height: number): void {
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2c3350, 0.7);

    const step = 64;
    for (let x = 0; x <= width; x += step) {
      grid.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += step) {
      grid.lineBetween(0, y, width, y);
    }
  }

  private createPlayerTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0x3dd6c6, 1);
    graphics.fillRoundedRect(2, 2, PLAYER_SIZE - 4, PLAYER_SIZE - 4, 8);
    graphics.fillStyle(0x0b3d3a, 1);
    graphics.fillCircle(PLAYER_SIZE / 2, PLAYER_SIZE / 2 - 2, 7);
    graphics.lineStyle(3, 0x9ff5ea, 1);
    graphics.strokeRoundedRect(2, 2, PLAYER_SIZE - 4, PLAYER_SIZE - 4, 8);
    graphics.generateTexture('player', PLAYER_SIZE, PLAYER_SIZE);
    graphics.destroy();
  }
}
