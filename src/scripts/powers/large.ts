import Player from '../objects/player'
import Enemy from '../objects/enemies/enemyClass'

let timeEvents: Phaser.Time.TimerEvent[] = []

/**
 * 身体变大的能力
 */
export default class Large {
  /**
   * 变大后的宽度和高度
   */
  private largeSize = [8, 32]

  constructor(player: Player) {
    this.toLarge(player)
    player.addPower(Large.name, this, true)
  }

  /**
   * 改变身体大小
   * @param player 玩家
   * @param animsKey 切换时的动画 key
   * @param animSuffix 最终的动画 key
   * @param size 身体大小
   */
  private changeSize(player: Player, animsKey: string, animSuffix: string, size: number[]) {
    player.scene.physics.world.pause()
    player.anims.play(animsKey, true).once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      player.scene.physics.world.resume()
      player.animSuffix = animSuffix
      player.body.setSize(...size).setOffset(4, 0)
    })
  }

  /**
   * 变大
   * @param player 玩家
   */
  private toLarge(player: Player) {
    player.y -= 8
    this.changeSize(player, 'grow', 'Super', this.largeSize)
  }

  /**
   * 变回默认大小
   * @param player 玩家
   */
  private toDefault(player: Player) {
    this.changeSize(player, 'shrink', '', player.options.defaultSize)
    player.setAlpha(0.8)
    player.protected = true
    timeEvents.forEach((timeEvent) => timeEvent.remove())
    timeEvents.push(
      player.scene.time.addEvent({
        delay: 2000,
        callback: () => {
          player.setAlpha(1)
          player.removePower(Large.name)
          player.protected = false
          timeEvents = []
        },
      })
    )
    player.scene.sound.playAudioSprite('sfx', 'smb_pipe')
  }

  /**
   * 与敌人接触时，变回默认大小，并移除该能力
   * @param player 玩家
   * @param enemy 敌人
   */
  public overlapEnemy(player: Player, enemy: Enemy) {
    if (player.protected || !enemy.attackPower) return
    if (!player.body.touching.down || player.body.velocity.y <= 0) {
      this.toDefault(player)
      return true
    }
  }
}
