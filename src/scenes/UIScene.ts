import Phaser from 'phaser';
import { XP_TO_LEVEL } from '../entities/ExperienceOrb';
import { GameEvents, type XpSnapshot } from '../systems/events';
import { MINIMAP_SIZE, MINIMAP_TOP, minimapScreenX } from '../systems/minimap';
import { pickRandomUpgrades, type UpgradeDef } from '../systems/upgrades';
import { GameScene } from './GameScene';

const BAR_WIDTH = 720;
const BAR_HEIGHT = 18;
const CARD_WIDTH = 240;
const CARD_HEIGHT = 280;
const CARD_GAP = 28;

export class UIScene extends Phaser.Scene {
  private barFill!: Phaser.GameObjects.Rectangle;
  private xpLabel!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Container;
  private gameOverOverlay!: Phaser.GameObjects.Container;
  private choosing = false;
  private showingGameOver = false;

  constructor() {
    super('UIScene');
  }

  create(): void {
    const { width } = this.scale;
    const barX = (width - BAR_WIDTH) / 2;
    const barY = 16;

    this.add
      .rectangle(width / 2, barY + BAR_HEIGHT / 2, BAR_WIDTH + 8, BAR_HEIGHT + 8, 0x07090f, 0.88)
      .setScrollFactor(0);
    this.add
      .rectangle(width / 2, barY + BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, 0x1b2433)
      .setScrollFactor(0);

    this.barFill = this.add
      .rectangle(barX, barY + BAR_HEIGHT / 2, 1, BAR_HEIGHT - 4, 0x42a5f5)
      .setOrigin(0, 0.5)
      .setScrollFactor(0);
    this.barFill.displayWidth = 0;

    this.xpLabel = this.add
      .text(width / 2, barY + BAR_HEIGHT / 2, `LV 1  XP 0/${XP_TO_LEVEL}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#e8eef7',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.drawMinimapFrame(width);

    this.overlay = this.add.container(0, 0).setVisible(false).setDepth(1000);
    this.gameOverOverlay = this.add.container(0, 0).setVisible(false).setDepth(2000);

    this.game.events.on(GameEvents.XpChanged, this.onXpChanged, this);
    this.game.events.on(GameEvents.LevelUp, this.onLevelUp, this);
    this.game.events.on(GameEvents.GameOver, this.onGameOver, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.unbindEvents, this);

    const gameScene = this.scene.get('GameScene');
    if (gameScene instanceof GameScene) {
      this.onXpChanged(gameScene.getXpSnapshot());
    }
  }

  private drawMinimapFrame(width: number): void {
    const x = minimapScreenX(width);
    const y = MINIMAP_TOP;
    const frame = this.add.graphics().setScrollFactor(0).setDepth(40);
    frame.lineStyle(4, 0x0a0c12, 0.95);
    frame.strokeRect(x - 3, y - 3, MINIMAP_SIZE + 6, MINIMAP_SIZE + 6);
    frame.lineStyle(2, 0x8ea0bf, 1);
    frame.strokeRect(x - 1, y - 1, MINIMAP_SIZE + 2, MINIMAP_SIZE + 2);
  }

  private unbindEvents(): void {
    this.game.events.off(GameEvents.XpChanged, this.onXpChanged, this);
    this.game.events.off(GameEvents.LevelUp, this.onLevelUp, this);
    this.game.events.off(GameEvents.GameOver, this.onGameOver, this);
  }

  private onXpChanged = (snapshot: XpSnapshot): void => {
    const ratio = snapshot.max <= 0 ? 0 : Phaser.Math.Clamp(snapshot.current / snapshot.max, 0, 1);
    this.barFill.displayWidth = Math.max(ratio * BAR_WIDTH, ratio > 0 ? 4 : 0);
    this.xpLabel.setText(`LV ${snapshot.level}  XP ${snapshot.current}/${snapshot.max}`);
  };

  private onLevelUp = (): void => {
    if (this.choosing || this.showingGameOver) {
      return;
    }
    this.choosing = true;
    this.showUpgradeCards(pickRandomUpgrades(3));
  };

  private onGameOver = (): void => {
    this.showingGameOver = true;
    this.choosing = false;
    this.overlay.setVisible(false);
    this.overlay.removeAll(true);
    this.showGameOver();
  };

  private showUpgradeCards(upgrades: UpgradeDef[]): void {
    this.overlay.removeAll(true);

    const { width, height } = this.scale;
    const dim = this.add
      .rectangle(width / 2, height / 2, width, height, 0x05070c, 0.62)
      .setInteractive();

    const title = this.add
      .text(width / 2, height / 2 - CARD_HEIGHT / 2 - 56, 'LEVEL UP', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#ffe14d',
      })
      .setOrigin(0.5);

    this.overlay.add([dim, title]);

    const totalWidth = upgrades.length * CARD_WIDTH + (upgrades.length - 1) * CARD_GAP;
    const startX = width / 2 - totalWidth / 2 + CARD_WIDTH / 2;

    upgrades.forEach((upgrade, index) => {
      this.overlay.add(this.createCard(startX + index * (CARD_WIDTH + CARD_GAP), height / 2, upgrade));
    });

    this.overlay.setVisible(true);
  }

  private createCard(x: number, y: number, upgrade: UpgradeDef): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);

    const background = this.add
      .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0x121826, 0.96)
      .setStrokeStyle(2, 0x8ec8ff)
      .setInteractive({ useHandCursor: true });

    const title = this.add
      .text(0, -36, upgrade.title, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e8eef7',
        align: 'center',
        wordWrap: { width: CARD_WIDTH - 36 },
      })
      .setOrigin(0.5);

    const description = this.add
      .text(0, 48, upgrade.description, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9fb0c8',
        align: 'center',
        wordWrap: { width: CARD_WIDTH - 40 },
      })
      .setOrigin(0.5);

    card.add([background, title, description]);

    background.on('pointerover', () => {
      background.setFillStyle(0x1c2740, 1);
      background.setStrokeStyle(3, 0xffe14d);
    });
    background.on('pointerout', () => {
      background.setFillStyle(0x121826, 0.96);
      background.setStrokeStyle(2, 0x8ec8ff);
    });
    background.on('pointerdown', () => {
      this.selectUpgrade(upgrade);
    });

    return card;
  }

  private selectUpgrade(upgrade: UpgradeDef): void {
    if (!this.choosing) {
      return;
    }

    this.choosing = false;
    this.overlay.setVisible(false);
    this.overlay.removeAll(true);
    this.game.events.emit(GameEvents.UpgradeSelected, upgrade.id);
  }

  private showGameOver(): void {
    this.gameOverOverlay.removeAll(true);

    const { width, height } = this.scale;
    const dim = this.add
      .rectangle(width / 2, height / 2, width, height, 0x05070c, 0.78)
      .setInteractive();

    const title = this.add
      .text(width / 2, height / 2 - 70, 'GAME OVER', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#ff4d4d',
      })
      .setOrigin(0.5);

    const button = this.add
      .rectangle(width / 2, height / 2 + 50, 260, 64, 0x121826, 0.98)
      .setStrokeStyle(2, 0xffe14d)
      .setInteractive({ useHandCursor: true });

    const buttonLabel = this.add
      .text(width / 2, height / 2 + 42, 'Restart', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffe14d',
      })
      .setOrigin(0.5);

    const buttonHint = this.add
      .text(width / 2, height / 2 + 68, 'Перезапуск', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#9fb0c8',
      })
      .setOrigin(0.5);

    button.on('pointerover', () => {
      button.setFillStyle(0x1c2740, 1);
      button.setStrokeStyle(3, 0xffffff);
    });
    button.on('pointerout', () => {
      button.setFillStyle(0x121826, 0.98);
      button.setStrokeStyle(2, 0xffe14d);
    });
    button.on('pointerdown', () => {
      this.requestRestart();
    });

    this.gameOverOverlay.add([dim, title, button, buttonLabel, buttonHint]);
    this.gameOverOverlay.setVisible(true);
  }

  private requestRestart(): void {
    if (!this.showingGameOver) {
      return;
    }
    this.showingGameOver = false;
    this.game.events.emit(GameEvents.RestartRequested);
  }
}
