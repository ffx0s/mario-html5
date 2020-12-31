import Player from '../player'
import PowerUpClass from './powerUpClass'

// export type PowerUpName = 'flower' | 'mushroom' | 'star' | '1up'

/**
 * 存储道具的 Group
 */
export default class PowerUpGroup extends Phaser.GameObjects.Group {
  /**
   * 道具与玩家的距离超出指定范围时销毁道具
   */
  private maxX = 500
  /**
   * 道具与玩家的距离超出指定范围时销毁道具
   */
  private maxY = 500

  constructor(scene: Phaser.Scene) {
    super(scene)
  }

  update(player: Player, time: number, delta: number) {
    const canvas = this.scene.sys.game.canvas
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height

    // @ts-ignore
    this.children.iterate((powerUp: PowerUpClass) => {
      if (powerUp) {
        // 超出与玩家的最大范围时，直接销毁道具
        if (
          Math.abs(player.x - powerUp.x) > this.maxX + canvasWidth ||
          Math.abs(player.y - powerUp.y) > this.maxY + canvasHeight
        ) {
          powerUp.destroy()
        }
      }
    })
  }
}
