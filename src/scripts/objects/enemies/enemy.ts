import Player from '../player'
import { score } from '../../helpers/decorators'

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  body: Phaser.Physics.Arcade.Body
  /**
   * 是否死亡
   */
  dead = false
  /**
   * 是否有攻击能力（当为真时接触玩家，玩家死亡）
   */
  attackPower = true
  /**
   * 死亡时播放的动画 key
   */
  deadAnimKey: string
  /**
   * 默认移动速度
   */
  vx = -30

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame: string, deadAnimKey: string) {
    super(scene, x, y, texture, frame)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setOrigin(0, 1)
    this.deadAnimKey = deadAnimKey
  }

  /**
   * 接触玩家时调用该方法
   * @param player
   * @param stepOnEnemy 玩家是否踩到敌人
   */
  overlapPlayer(player: Player, stepOnEnemy: boolean): boolean | void {
    // 被踩到默认直接死亡
    if (stepOnEnemy) {
      this.die()
    }
  }

  /**
   * 与另外一个敌人接触时调用
   * @param enemy 另一个敌人
   */
  overlapEnemy(enemy: Enemy) {}

  /**
   * 与地图接触时调用
   * @param tile
   */
  colliderWorld(tile: Phaser.Tilemaps.Tile) {}

  /**
   * 敌人死亡
   * @param flipY 死亡时是否播放翻转敌人的动画效果
   */
  @score(50)
  die(flipY = false) {
    if (this.dead) return

    this.dead = true
    this.scene.sound.playAudioSprite('sfx', 'smb_stomp')

    if (flipY) {
      this.body.checkCollision.none = true
      this.setFlipY(true)
      this.setVelocity(0, -100)
    } else {
      this.body.stop()
      this.play(this.deadAnimKey)
      this.scene.tweens.add({
        targets: this,
        duration: 100,
        alpha: 0,
        repeat: 4,
        onComplete: () => {
          this.disableBody(true, true)
        },
      })
    }

    this.anims.stop()
  }

  /**
   * 还原状态
   * @param x 新的水平坐标
   * @param y 新的垂直坐标
   */
  restore(x: number, y: number) {
    this.dead = false
    this.attackPower = true
    this.body.checkCollision.none = false
    this.enableBody(true, x, y, true, true).clearAlpha().resetFlip()
  }
}
