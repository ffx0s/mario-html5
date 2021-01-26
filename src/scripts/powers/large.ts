import Player from '../objects/player'
import { Enemy } from '../objects/enemies'
import { Power } from './index'

/**
 * 身体变大的能力
 */
export class Large implements Power {
  /**
   * 变大前的宽度和高度
   */
  private originSize: [number, number]
  /**
   * 变大后的宽度和高度
   */
  private largeSize: [number, number] = [8, 32]

  constructor(player: Player) {
    this.originSize = [player.body.width, player.body.height]
    this.toLarge(player)
  }

  /**
   * 与敌人接触时，变回默认大小，并移除该能力
   * @param player 玩家
   * @param enemy 敌人
   */
  public overlapEnemy(player: Player, enemy: Enemy, stepOnEnemy: boolean) {
    if (stepOnEnemy || player.protected || !enemy.attackPower) return
    player.powers.remove(Large)
    return true
  }

  public beforeRemove(player: Player) {
    this.toOrigin(player)
    player.setAlpha(0.8)
    player.protected = true
    player.scene.time.delayedCall(2000, () => {
      player.setAlpha(1)
      player.protected = false
    })
  }

  /**
   * 改变身体大小
   * @param player 玩家
   * @param animsKey 切换时的动画 key
   * @param animSuffix 最终的动画 key
   * @param size 身体大小
   */
  private changeSize(player: Player, animsKey: string, animSuffix: string, size: [number, number]) {
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
   * 变回原来的大小
   * @param player 玩家
   */
  private toOrigin(player: Player) {
    this.changeSize(player, 'shrink', '', this.originSize)
    player.scene.sound.playAudioSprite('sfx', 'smb_pipe')
  }
}
