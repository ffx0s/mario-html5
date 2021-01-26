interface TextItem {
  title: string
  value: string | number | Function
  key: string
}

export default class Hud {
  private items: TextItem[] = []

  constructor(scene: Phaser.Scene, items: TextItem[]) {
    const canvas = scene.sys.game.canvas
    const itemWidth = canvas.width / items.length

    this.items = items
    items.forEach(({ title, value, key }, index) => {
      if (typeof value === 'function') {
        value = value()
      }
      this[key] = new HeaderText(scene, itemWidth * index || 16, 8, title, value.toString(), 1)
    })
  }

  public update() {
    this.items.forEach((item) => {
      if (typeof item.value === 'function') {
        this.setValue(item.key, item.value())
      }
      this[item.key].update()
    })
  }

  public setValue(key: string, value: string | number) {
    this[key].value = value
  }

  public getValue(key: string): string | number {
    return this[key].value
  }

  /**
   * 增加或减少
   * @param key
   * @param value 正数增加、负数减少
   */
  public incDec(key: string, value: number) {
    this[key].value = Number(this[key].value) + value
  }
}

export class HeaderText extends Phaser.GameObjects.BitmapText {
  title: string
  value: string

  constructor(scene: Phaser.Scene, x: number, y: number, title: string, value: string, align: number) {
    super(scene, x, y, 'font', '', 8, align)
    scene.add.existing(this)
    this.setOrigin(0)
    this.setScrollFactor(0, 0)
    this.setDepth(100)

    this.title = title
    this.value = value
  }

  public update() {
    this.setText(`${this.title}\n${this.value}`)
  }
}
