import { Enemy } from './index'

type Config = {
  scene: Phaser.Scene
  x: number
  y: number
  texture: string
}

export class Goomba extends Enemy {
  body: Phaser.Physics.Arcade.Body

  constructor({ scene, x, y, texture }: Config) {
    super(scene, x, y, texture, 'goomba/walk1', 'goombaFlat')
    scene.physics.world.enable(this)
    scene.add.existing(this)

    this.body.setBounce(1, 0).setVelocityX(this.vx)

    this.anims.create({
      key: 'goombaWalk',
      frames: this.anims.generateFrameNames(texture, {
        prefix: 'goomba/walk',
        start: 1,
        end: 2,
      }),
      frameRate: 4,
      repeat: -1,
      repeatDelay: 0,
    })

    this.anims.create({
      key: 'goombaFlat',
      frames: [{ frame: 'goomba/flat', key: 'atlas' }],
      frameRate: 1,
      repeat: 0,
      repeatDelay: 0,
    })

    this.anims.play('goombaWalk')
  }

  /**
   * 还原状态
   * @param x 新的水平坐标
   * @param y 新的垂直坐标
   */
  restore(x: number, y: number) {
    super.restore(x, y)
    this.body.setBounce(1, 0).setVelocity(this.vx, 0)
    this.anims.play('goombaWalk')
  }
}
