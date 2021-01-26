type Config = {
  scene: Phaser.Scene
  x?: number
  y?: number
}

/**
 * 透明的砖块对象，代替 Tile 砖块
 */
export default class Brick extends Phaser.GameObjects.Rectangle {
  body: Phaser.Physics.Arcade.Body
  private blockEmitter: Phaser.GameObjects.Particles.ParticleEmitterManager

  constructor({ scene, x = 0, y = 0 }: Config) {
    super(scene, x, y, 16, 16)
    scene.physics.world.enable(this)
    scene.add.existing(this)
    this.body.setAllowGravity(false)

    // 砖块破碎效果
    this.blockEmitter = scene.add.particles('atlas')
    this.blockEmitter.createEmitter({
      frame: {
        frames: ['brick'],
        cycle: true,
      },
      gravityY: 1000,
      lifespan: 2000,
      speed: 400,
      angle: {
        min: -90 - 25,
        max: -45 - 25,
      },
      frequency: -1,
    })

    this.hide()
  }

  show(x: number, y: number) {
    this.scene.physics.world.enableBody(this)
    this.body.setBounce(0, 1).setVelocity(0, -50).setMass(30)
    this.setX(x + 8).setY(y + 8)
  }

  hide() {
    this.scene.physics.world.disableBody(this.body)
  }

  /**
   * 撞破砖块的效果
   * @param tile 目标
   */
  public break(tile: Phaser.Tilemaps.Tile) {
    tile.tilemapLayer.removeTileAt(tile.x, tile.y, true, true)
    this.blockEmitter.emitParticle(6, tile.x * 16, tile.y * 16)
    this.scene.sound.playAudioSprite('sfx', 'smb_breakblock')
  }
}
