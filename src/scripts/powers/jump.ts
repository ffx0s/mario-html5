import { Power, Large } from './index'
import Player from '../objects/player'

const defaultOptions = {
  /**
   * 跳跃时的速度
   */
  vy: -200,
  /**
   * 最大跳跃速度
   */
  maxVy: 300,
  /**
   * 跳跃持续时间，越大跳得越高
   */
  jumpDuration: 220,
}

/**
 * 跳跃能力，支持长按和短按跳跃
 */
export class Jump implements Power {
  /**
   * 当前跳跃持续时间的计数
   */
  private jumpTimer = 0
  private options = defaultOptions

  constructor(player: Player, options = {}) {
    this.options = { ...defaultOptions, ...options }
    player.body.setMaxVelocityY(this.options.maxVy)
  }

  public update(time: number, delta: number, player: Player, cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    const { vy, jumpDuration } = this.options
    const animSuffix = player.animSuffix
    const upSpaceDown = cursors.up.isDown || cursors.space.isDown
    const bodyBlockedDown = player.body.blocked.down

    if (player.body.blocked.up) {
      this.jumpTimer = 0
      return
    }

    // 已按下跳跃键开始跳跃
    if (upSpaceDown && bodyBlockedDown) {
      this.jumpTimer = time
      player.body.setVelocityY(vy)
      player.scene.sound.playAudioSprite('sfx', 'smb_jump-' + (player.powers.has(Large) ? 'super' : 'small'))
    }
    // 已按下跳跃键并处于空中
    else if (upSpaceDown && this.jumpTimer !== 0) {
      // 超过跳跃持续时间，清除计时
      if (time - this.jumpTimer > jumpDuration) {
        this.jumpTimer = 0
      } else {
        player.body.setVelocityY(vy)
      }
    }
    // 松开了跳跃键，清除计时
    else if (this.jumpTimer !== 0) {
      this.jumpTimer = 0
    }

    if (!bodyBlockedDown) {
      player.anims.play('jump' + animSuffix, true)
    }
  }
}
