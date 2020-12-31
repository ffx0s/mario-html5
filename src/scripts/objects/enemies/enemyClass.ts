import Player from '../player'
import { score } from '../../helpers/decorators'

export default class EnemyClass extends Phaser.Physics.Arcade.Sprite {
  body: Phaser.Physics.Arcade.Body
  /**
   * 是否死亡
   */
  dead = false
  /**
   * 是否禁止与地图进行碰撞检测
   */
  disableCollide = false
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
    this.deadAnimKey = deadAnimKey
    this.setOrigin(0, 1)
  }

  /**
   * 与玩家接触时触发
   * @param player
   * @param stepOn 玩家是否踩到敌人
   */
  overlapPlayer(player: Player, stepOn: boolean) {
    // 被踩到默认直接死亡
    if (stepOn) {
      this.die()
    }

    return false
  }

  /**
   * 与另外一个敌人接触时触发
   * @param enemy 另一个敌人
   */
  overlapEnemy(enemy: EnemyClass) {}

  /**
   * 与地图接触时触发
   * @param tile 接触的对象
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
      this.disableCollide = true
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
    this.disableCollide = false
    this.attackPower = true
    this.enableBody(true, x, y, true, true).clearAlpha().resetFlip()
  }
}
