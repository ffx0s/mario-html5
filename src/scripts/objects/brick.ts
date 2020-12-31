type Config = {
  scene: Phaser.Scene
  x?: number
  y?: number
}

/**
 * 透明的砖块对象，代替 Tile 砖块的碰撞效果
 */
export default class Brick extends Phaser.GameObjects.Rectangle {
  body: Phaser.Physics.Arcade.Body

  constructor({ scene, x = 0, y = 0 }: Config) {
    super(scene, x, y, 16, 16)
    scene.physics.world.enable(this)
    scene.add.existing(this)

    this.body.setAllowGravity(false)
    this.hide()
  }

  show(x: number, y: number) {
    this.scene.physics.world.enableBody(this)
    this.body.setBounce(0, 1).setVelocityY(-50).setMass(30)
    this.setX(x + 8).setY(y + 8)
  }

  hide() {
    this.body.enable = false
    this.scene.physics.world.disableBody(this.body)
  }
}
