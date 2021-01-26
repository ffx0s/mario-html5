export default class FireBall extends Phaser.Physics.Arcade.Sprite {
  body: Phaser.Physics.Arcade.Body

  /**
   * 火球是否为爆炸状态（接触到游戏对象的左右侧会时有爆炸的效果）
   */
  isExplode = false
  /**
   * 火球的移动速度
   */
  private speedX = 300
  /**
   * 火球的垂直弹力
   */
  private bounceY = 1

  constructor(scene: Phaser.Scene, texture: string) {
    super(scene, 0, 0, texture, 'fire/fly1')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.anims.create({
      key: 'fireFly',
      frames: this.anims.generateFrameNames(texture, {
        prefix: 'fire/fly',
        start: 1,
        end: 4,
      }),
      frameRate: 15,
      repeat: -1,
      repeatDelay: 0,
    })

    this.anims.create({
      key: 'fireExplode',
      frames: this.anims.generateFrameNames(texture, {
        prefix: 'fire/explode',
        start: 1,
        end: 3,
      }),
      frameRate: 15,
    })
  }

  /**
   * 火球移动
   * @param direction 移动方向
   * @param x 水平坐标
   * @param y 垂直坐标
   */
  run(direction: number, x = 0, y = 0) {
    this.isExplode = false
    if (!this.active && !this.visible) {
      this.enableBody(true, x, y, true, true)
    } else {
      this.setX(x).setY(y)
    }
    this.body
      .setAllowGravity(true)
      .setBounceY(this.bounceY)
      .setVelocityX(this.speedX * direction)

    this.play('fireFly')
  }

  /**
   *  火球爆炸
   */
  explode() {
    if (this.isExplode) return
    this.isExplode = true
    this.scene.sound.playAudioSprite('sfx', 'smb_bump')
    this.body.setAllowGravity(false).stop()
    this.play('fireExplode').once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.disableBody(true, true)
    })
  }
}
