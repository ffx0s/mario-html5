import Player from '../player'

type Config = {
  scene: Phaser.Scene
  x: number
  y: number
  texture: string
}

export class PowerUp extends Phaser.GameObjects.Sprite {
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
  onOverlap(powerUp: PowerUp, player: Player) {
    this.scene.sound.playAudioSprite('sfx', 'smb_powerup')
    this.destroy()
  }

  /**
   * 执行玩家与游戏道具接触的检测
   * @param player 玩家
   * @param callback 接触后的回调函数
   */
  public overlap(player: Player, callback: Function) {
    // @ts-ignore
    this.scene.physics.add.overlap(this, player, (powerUp: PowerUp, player: Player) => {
      callback?.(powerUp, player)
      this.onOverlap(powerUp, player)
    })
    return this
  }
}
