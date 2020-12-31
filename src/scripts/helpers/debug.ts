interface Config {
  scene: Phaser.Scene
  layer: Phaser.Tilemaps.TilemapLayer
  key?: string
}

export default class Debug {
  private debugGraphics: Phaser.GameObjects.Graphics
  private showDebug: boolean

  constructor({ scene, key = 'keydown-C', layer }: Config) {
    this.debugGraphics = scene.add.graphics()

    scene.input.keyboard.on(key, () => {
      this.showDebug = !this.showDebug
      this.draw(layer)
    })
  }
  draw(layer: Phaser.Tilemaps.TilemapLayer) {
    this.debugGraphics.clear()

    if (this.showDebug) {
      // Pass in null for any of the style options to disable drawing that component
      layer.renderDebug(this.debugGraphics, {
        tileColor: null, // Non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 200), // Colliding tiles
        faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Colliding face edges
      })
    }
  }
}
