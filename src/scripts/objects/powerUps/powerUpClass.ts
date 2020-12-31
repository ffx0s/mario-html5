import Player from '../player'

type Config = {
  scene: Phaser.Scene
  x: number
  y: number
  texture: string
}

export default class PowerUpClass extends Phaser.GameObjects.Sprite {
  body: Phaser.Physics.Arcade.Body

  constructor({ scene, x, y, texture }: Config) {
    super(scene, x, y, texture)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setDepth(-1)
    this.y += 16
    this.body.setVelocityY(0).setAllowGravity(false)

    this.scene.tweens.add({
      y,
      targets: this,
      duration: 300,
      ease: 'Cubic.ease',
      onComplete: () => {
        this.setDepth(1)
        this.onDisplay()
      },
    })

    scene.sound.playAudioSprite('sfx', 'smb_powerup_appears')
  }

  /**
   * 显示动画完成后的回调
   */
  onDisplay() {}

  /**
   * 与玩家接触时的回调
   */
  onOverlap(
    obj1: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    obj2: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    this.scene.sound.playAudioSprite('sfx', 'smb_powerup')
    this.destroy()
  }

  /**
   * 执行玩家与游戏道具接触的检测
   * @param player 玩家
   * @param callback 接触后的回调函数
   */
  public overlap(player: Player, callback: ArcadePhysicsCallback) {
    this.scene.physics.add.overlap(this, player, (obj1, obj2) => {
      callback?.(obj1, obj2)
      this.onOverlap(obj1, obj2)
    })
    return this
  }
}
