export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    const progress = this.add.graphics()

    this.load.on('progress', (value: number) => {
      progress.clear()
      progress.fillStyle(0xffffff, 1)
      progress.fillRect(0, Number(this.sys.game.config.height) / 2, Number(this.sys.game.config.width) * value, 20)
    })
    this.load.on('complete', () => {
      progress.destroy()
    })

    // 背景
    this.load.image('background-clouds', 'assets/images/clouds.png')

    // 地图数据
    this.load.tilemapTiledJSON('map', 'assets/maps/super-mario.json')

    this.load.spritesheet('tiles', 'assets/images/super-mario.png', {
      frameWidth: 16,
      frameHeight: 16,
      spacing: 2,
    })

    this.load.atlas('atlas', 'assets/mario-sprites.png', 'assets/mario-sprites.json')

    // 马赛克字体
    this.load.bitmapFont('font', 'assets/fonts/font.png', 'assets/fonts/font.fnt')

    // 背景音乐
    this.load.audio('overworld', 'assets/music/overworld.mp3')
    // 游戏特效音乐
    this.load.audioSprite('sfx', 'assets/audio/sfx.json', ['assets/audio/sfx.ogg', 'assets/audio/sfx.mp3'], {
      instances: 4,
    })
  }

  create() {
    this.scene.start('MainScene')
  }
}
