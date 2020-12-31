import { coins } from '../helpers/decorators'

/**
 * 金币旋转动画
 */
export default class CoinSpin extends Phaser.GameObjects.Sprite {
  body: Phaser.Physics.Arcade.Body

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture, 'coin/spin1')
    scene.physics.world.enable(this)
    scene.add.existing(this)

    this.body.setAllowGravity(false)

    scene.anims.create({
      key: 'coinSpin',
      frames: this.anims.generateFrameNames(texture, {
        prefix: 'coin/spin',
        start: 1,
        end: 4,
      }),
      frameRate: 15,
      repeat: -1,
      repeatDelay: 0,
    })
  }

  @coins(1)
  spin() {
    this.anims.play('coinSpin')

    this.scene.tweens.add({
      targets: this,
      y: this.y - 50,
      duration: 300,
      onComplete: () => {
        this.destroy()
      },
    })
    this.scene.sound.playAudioSprite('sfx', 'smb_coin')
  }
}
