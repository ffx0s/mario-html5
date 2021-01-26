import config from '../config'
import AnimatedTiles from '../helpers/animatedTiles'
import Debug from '../helpers/debug'
import CountDown from '../helpers/countdown'

import Hud from '../objects/hud'
import Player from '../objects/player'
import Brick from '../objects/brick'
import CoinSpin from '../objects/coinSpin'
import Flag from '../objects/flag'
import { Enemy, EnemyGroup, EnemyName } from '../objects/enemies'
import { PowerUpGroup, Mushroom, Flower, Star } from '../objects/powerUps'

import { Move, Jump, Large, Fire, Invincible, EnterPipe, HitBrick } from '../powers'
import { arrayProps2ObjProps } from '../utils'
import { container } from 'tsyringe'

type SceneData = {
  [prop: string]: any
}

export default class MainScene extends Phaser.Scene {
  music: Phaser.Sound.BaseSound
  cursors: Phaser.Types.Input.Keyboard.CursorKeys
  animatedTiles: AnimatedTiles
  hud: Hud
  mario: Player
  powerUpGroup: PowerUpGroup
  enemyGroup: EnemyGroup
  rooms: rooms = {}
  dests: dests = {}

  constructor() {
    super({ key: 'MainScene' })
  }

  create(sceneData: SceneData) {
    // @ts-ignore debug
    window.__myGame = this

    const map = this.make.tilemap({ key: 'map' })
    const tileset = map.addTilesetImage('SuperMarioBros-World1-1', 'tiles')
    const worldLayer = map.createLayer('world', tileset).setCollisionByProperty({ collide: true })

    this.cursors = this.input.keyboard.createCursorKeys()

    // 添加背景音乐
    this.music = this.sound.add('overworld')
    this.music.play({ loop: true })

    // 添加游戏背景
    this.add.tileSprite(0, 0, worldLayer.width, 500, 'background-clouds')

    // 添加游戏说明
    this.add.bitmapText(16, 100, 'font', config.helpText, 8).setDepth(100)

    // tile 动画
    this.animatedTiles = new AnimatedTiles(map, tileset)

    this.parseModifiersLayer(map, 'modifiers')

    const enemiesData = this.parseEnemiesLayer(map, 'enemies')
    this.enemyGroup = new EnemyGroup(this, enemiesData)
    this.powerUpGroup = new PowerUpGroup(this)

    // 分数、金币、倒计时等信息显示
    this.hud = new Hud(this, [
      { title: 'SCORE', key: 'score', value: 0 },
      { title: 'COINS', key: 'coins', value: sceneData.coins || 0 },
      { title: 'TIME', key: 'time', value: config.playTime },
      { title: 'LIVES', key: 'lives', value: sceneData.lives || config.lives },
      { title: 'FPS', key: 'fps', value: () => Math.floor(this.game.loop.actualFps) },
    ])

    this.mario = new Player({
      scene: this,
      texture: 'atlas',
      frame: 'mario/stand',
      x: config.initX,
      y: config.initY,
      allowPowers: [Jump, Move, Invincible, Large, Fire, EnterPipe, HitBrick],
    }).on('die', () => {
      this.time.delayedCall(3000, () => {
        if (this.hud.getValue('lives') === 0) {
          this.gameOver()
        } else {
          this.restartGame()
        }
      })
    })

    const endPoint = worldLayer.findByIndex(5)
    // 终点旗杆
    new Flag(this, endPoint.pixelX, endPoint.pixelY).overlap(this.mario, () => this.restartGame(false))

    // 游戏倒计时
    new CountDown(this)
      .start(config.playTime)
      .on('interval', (time: number) => {
        this.hud.setValue('time', time)
      })
      .on('end', () => this.mario.die())

    // 调试
    new Debug({ scene: this, layer: worldLayer })

    // 砖块对象
    const brick = new Brick({ scene: this })

    // 在容器里注册这些对象，用于提供给依赖它们的类自动注入
    container
      .register('Map', { useValue: map })
      .register('WorldLayer', { useValue: worldLayer })
      .register('Cursors', { useValue: this.cursors })
      .register(Brick, { useValue: brick })
      .register(Player, { useValue: this.mario })
      .register(EnemyGroup, { useValue: this.enemyGroup })
      .register(PowerUpGroup, { useValue: this.powerUpGroup })

    this.mario.powers
      .add(Move, () => new Move(this.mario))
      .add(Jump, () => new Jump(this.mario))
      .add(EnterPipe, () => new EnterPipe(this.cursors, this.dests, this.rooms))
      .add(HitBrick, () => new HitBrick(this.mario, ['up']))

    const camera = this.cameras.main
    const room = this.rooms.room1
    camera.setBounds(room.x, room.y, room.width, room.height).startFollow(this.mario)
    camera.roundPixels = true

    this.physics.add.collider(this.powerUpGroup, worldLayer)
    // @ts-ignore
    this.physics.add.collider(this.enemyGroup, worldLayer, this.enemyColliderWorld, undefined, this)
    // @ts-ignore
    this.physics.add.collider(this.mario, worldLayer, this.playerColliderWorld, undefined, this)
    // @ts-ignore
    this.physics.add.overlap(this.mario, this.enemyGroup, this.playerOverlapEnemy, undefined, this)
    // @ts-ignore
    this.physics.add.overlap(this.enemyGroup, this.enemyGroup, this.enemyOverlapEnemy, undefined, this)
    // @ts-ignore
    this.physics.add.collider(brick, this.enemyGroup, this.brickColliderEnemy, undefined, this)
    this.physics.add.collider(brick, this.powerUpGroup)
  }

  update(time: number, delta: number) {
    if (this.physics.world.isPaused) return
    const { animatedTiles, hud, mario, cursors, enemyGroup, powerUpGroup } = this
    animatedTiles.update(delta)
    hud.update()
    mario.update(time, delta, cursors)
    enemyGroup.update(time, delta, mario)
    powerUpGroup.update(time, delta, mario)
  }

  /**
   * 解析修饰层，扩展瓷砖属性
   * @param name 图层名称
   */
  private parseModifiersLayer(map: Phaser.Tilemaps.Tilemap, name: string) {
    const worldLayer = map.getLayer('world').tilemapLayer
    const parser = {
      powerUp: (modifier: Phaser.Types.Tilemaps.TiledObject) => {
        const tile = worldLayer.getTileAt(Number(modifier.x) / 16, Number(modifier.y) / 16 - 1)
        tile.properties.powerUp = modifier.name
        switch (modifier.name) {
          case '1up':
            tile.properties.callback = 'questionMark'
            tile.setCollision(false, false, false, true)
            break
          case 'coin':
            tile.properties.hitNumber = 4
        }
      },
      pipe: (modifier: Phaser.Types.Tilemaps.TiledObject) => {
        const tile = worldLayer.getTileAt(Number(modifier.x) / 16, Number(modifier.y) / 16)
        tile.properties.dest = modifier.name
        Object.assign(tile.properties, arrayProps2ObjProps(modifier.properties))
      },
      dest: ({ name, x, y, properties }: Phaser.Types.Tilemaps.TiledObject) => {
        this.dests[name] = {
          name,
          x: Number(x),
          y: Number(y),
          ...arrayProps2ObjProps(properties),
        }
      },
      room: ({ name, x, y, width, height }: Phaser.Types.Tilemaps.TiledObject) => {
        this.rooms[name] = {
          name,
          x: Number(x),
          y: Number(y),
          width: Number(width),
          height: Number(height),
        }
      },
    }

    map.getObjectLayer(name).objects.forEach((tiled) => {
      parser[tiled.type]?.(tiled)
    })
  }

  /**
   * 解析敌人图层，获取敌人的坐标数据
   * @param name 图层名称
   */
  private parseEnemiesLayer(map: Phaser.Tilemaps.Tilemap, name: string) {
    return map.getObjectLayer(name).objects.map((tile) => ({
      name: tile.name as EnemyName,
      x: tile.x as number,
      y: tile.y as number,
    }))
  }

  private enemyColliderWorld(enemy: Enemy, tile: Phaser.Tilemaps.Tile) {
    enemy.colliderWorld(tile)
  }

  private enemyOverlapEnemy(enemy1: Enemy, enemy2: Enemy) {
    enemy1.overlapEnemy(enemy2)
    enemy2.overlapEnemy(enemy1)
  }

  private playerOverlapEnemy(mario: Player, enemy: Enemy) {
    if (enemy.dead || mario.dead) return

    // body.touching 对象会出现多个为 true 的值，为避免错误，加上了玩家速度的判断。
    const stepOnEnemy = mario.body.touching.down && enemy.body.touching.up && mario.body.velocity.y !== 0

    if (mario.overlapEnemy(enemy, stepOnEnemy)) return
    if (enemy.overlapPlayer(mario, stepOnEnemy)) return

    if (stepOnEnemy) {
      mario.body.setVelocityY(-80)
    } else if (!mario.protected && enemy.attackPower) {
      mario.die()
    }
  }

  private playerColliderWorld(mario: Player, tile: Phaser.Tilemaps.Tile) {
    if (mario.colliderWorld(tile)) return
  }

  private brickColliderEnemy(brick: Brick, enemy: Enemy) {
    if (enemy.dead) return
    if (this.mario.powers.has(Large)) {
      enemy.die(true)
    }
  }

  /**
   * 创建道具
   * @param name 道具名
   */
  private createPowerUp(name: string, x: number, y: number) {
    const mario = this.mario
    let params: any[] = []

    switch (name) {
      case 'mushroom':
        params = mario.powers.has(Large) ? [Flower, Fire] : [Mushroom, Large, { type: 'super' }]
        break
      case 'star':
        params = [Star, Invincible]
        break
      case '1up':
        params = [Mushroom, null, { type: '1up' }, () => this.hud.incDec('lives', 1)]
        break
      default:
        new CoinSpin(this, x, y, 'atlas').spin()
    }

    const [PowerUp, Power, options, onOverlap] = params
    if (PowerUp) {
      const powerUp = new PowerUp({ scene: this, x, y, texture: 'atlas', ...options }).overlap(
        mario,
        onOverlap || (() => mario.powers.add(Power, () => new Power(mario)))
      )
      this.powerUpGroup.add(powerUp)
    }
  }

  private restartGame(saveData = true) {
    const data = saveData
      ? {
          coins: this.hud.getValue('coins'),
          lives: this.hud.getValue('lives'),
        }
      : {}
    container.clearInstances()
    this.scene.restart(data)
  }

  private gameOver() {
    if (window.confirm('GameOver!')) {
      this.restartGame(false)
    }
  }
}
