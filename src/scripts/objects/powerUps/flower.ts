import { PowerUp } from './index'
import { score } from '../../helpers/decorators'

type Config = {
  scene: Phaser.Scene
  x: number
  y: number
  texture: string
}

export class Flower extends PowerUp {
  body: Phaser.Physics.Arcade.Body

  constructor({ scene, x, y, texture }: Config) {
    super({ scene, x, y, texture })

    this.body.setSize(16, 16).setOffset(0)

    this.anims.create({
      key: 'flower',
      frames: this.anims.generateFrameNames(texture, {
        prefix: 'powerup/flower',
        start: 1,
        end: 4,
      }),
      frameRate: 15,
      repeat: -1,
      repeatDelay: 0,
    })

    this.anims.play('flower')
  }

  @score(2000)
  onOverlap(obj1, obj2) {
    super.onOverlap(obj1, obj2)
  }
}
