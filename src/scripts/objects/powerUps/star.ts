import { PowerUp } from './index'
import { score } from '../../helpers/decorators'

type Config = {
  scene: Phaser.Scene
  x: number
  y: number
  texture: string
}

export class Star extends PowerUp {
  body: Phaser.Physics.Arcade.Body

  constructor({ scene, x, y, texture }: Config) {
    super({ scene, x, y, texture })

    this.body.setSize(16, 16).setOffset(0)

    this.anims.create({
      key: 'star',
      frames: this.anims.generateFrameNames(texture, {
        prefix: 'powerup/star',
        start: 1,
        end: 4,
      }),
      frameRate: 15,
      repeat: -1,
      repeatDelay: 0,
    })
    this.anims.play('star')
  }

  onDisplay() {
    this.body.setAllowGravity(true).setBounce(1, 1).setMaxVelocity(100, 200).setVelocity(200)
  }

  @score(1000)
  onOverlap(obj1, obj2) {
    super.onOverlap(obj1, obj2)
  }
}
