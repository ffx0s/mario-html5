import Player from '../objects/player'
import Goomba from '../objects/enemies/goomba'

const tints = [0xffffff, 0xff0000, 0xffffff, 0x00ff00, 0xffffff, 0x0000ff]
const tintsLength = tints.length

/**
 * 无敌的能力
 */
export default class Invincible {
  /**
   * 当前时间
   */
  private current: number = 0
  /**
   * 无敌持续时间
   */
  private duration: number = 10000
  /**
   * 无敌动画的当前帧索引
   */
  private frameIndex: number = 0

  constructor(player: Player) {
    player.addPower(Invincible.name, this, true)
  }

  /**
   * 移除能力
   * @param player 玩家
   */
  private remove(player: Player) {
    player.setTint(tints[0])
    player.removePower(Invincible.name)
  }

  public update(player: Player, cursors: Phaser.Types.Input.Keyboard.CursorKeys, time: number, delta: number) {
    this.current += delta
    if (this.current >= this.duration) {
      this.remove(player)
    } else {
      player.setTint(tints[this.frameIndex++])
      this.frameIndex %= tintsLength
    }
  }

  /**
   * 与敌人接触时，干掉敌人
   * @param player 玩家
   * @param enemy 敌人
   */
  public overlapEnemy(player: Player, enemy: Goomba) {
    enemy.die(true)
    return true
  }
}
