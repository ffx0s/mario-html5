import AnimatedTiles from '../helpers/animatedTiles'
import Debug from '../helpers/debug'
import CountDown from '../helpers/countdown'
import Hud from '../objects/hud'
import Player from '../objects/player'
import Brick from '../objects/brick'
import CoinSpin from '../objects/coinSpin'
import Mushroom from '../objects/powerUps/mushroom'
import Flower from '../objects/powerUps/flower'
import Star from '../objects/powerUps/star'
import Enemy from '../objects/enemies/enemyClass'
import Flag from '../objects/flag'
import Invincible from '../powers/invincible'
import Large from '../powers/large'
import Fire from '../powers/fire'
import EnemyGroup, { EnemyData, EnemyName } from '../objects/enemies/enemyGroup'
import PowerUpGroup from '../objects/powerUps/powerUpGroup'
import { parseTiledProperties } from '../utils'

/**
 * 房间信息
 */
interface rooms {
  [name: string]: {
    /**
     * 房间名
     */
    name: string
    /**
     * 坐标
     */
    x: number
    y: number
    /**
     * 大小
     */
    width: number
    height: number
  }
}

/**
 * 目的地坐标信息
 */
interface dests {
  [name: string]: {
    /**
     * 目的地名称
     */
    name: string
    /**
     * 方向
     */
    direction?: string
    /**
     * 坐标
     */
    x: number
    y: number
  }
}

type SceneData = {
  [prop: string]: any
}

/**
 * 游戏配置
 */
const gameConfig = {
  /**
   * 游戏结束倒计时（秒）
   */
  playTime: 60 * 3,
  /**
   * 玩家生命数
   */
  lives: 3,
}

export default class MainScene extends Phaser.Scene {
  music: Phaser.Sound.BaseSound
  map: Phaser.Tilemaps.Tilemap
  cursors: Phaser.Types.Input.Keyboard.CursorKeys
  animatedTiles: AnimatedTiles
  worldLayer: Phaser.Tilemaps.TilemapLayer
  hud: Hud
  mario: Player
  brick: Brick
  flag: Flag
  blockEmitter: Phaser.GameObjects.Particles.ParticleEmitterManager
  powerUpGroup: PowerUpGroup
  enemyGroup: EnemyGroup
  rooms: rooms = {}
  dests: dests = {}

  constructor() {
    super({ key: 'MainScene' })
  }

  create(sceneData: SceneData) {
    // @ts-ignore
    window.myGame = this

    // 背景音乐
    this.music = this.sound.add('overworld')
    this.music.play({
      loop: true,
    })

    this.map = this.make.tilemap({
      key: 'map',
    })

    const tileset = this.map.addTilesetImage('SuperMarioBros-World1-1', 'tiles')
    this.worldLayer = this.map.createLayer('world', tileset).setCollisionByProperty({ collide: true })

    this.add.tileSprite(0, 0, this.worldLayer.width, 500, 'background-clouds')

    this.blockEmitter = this.add.particles('atlas')
    // 砖块破碎效果
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

    this.parseModifiersLayer('modifiers')

    const enemiesData = this.parseEnemiesLayer('enemies')
    this.enemyGroup = new EnemyGroup(this, enemiesData)

    this.powerUpGroup = new PowerUpGroup(this)

    // 创建 tile 动画
    this.animatedTiles = new AnimatedTiles(this.map, tileset)

    // 分数、金币、倒计时等信息显示
    this.hud = new Hud(this, [
      { title: 'SCORE', key: 'score', value: 0 },
      { title: 'COINS', key: 'coins', value: sceneData.coins || 0 },
      { title: 'TIME', key: 'time', value: gameConfig.playTime },
      { title: 'LIVES', key: 'lives', value: sceneData.lives || gameConfig.lives },
      { title: 'FPS', key: 'fps', value: () => Math.floor(this.game.loop.actualFps) },
    ])

    // 游戏时间倒计时更新
    new CountDown().start(
      this,
      gameConfig.playTime,
      (time: number) => {
        this.hud.setValue('time', time)
      },
      () => this.mario.die()
    )

    // 调试
    new Debug({ scene: this, layer: this.worldLayer })

    this.mario = new Player({
      scene: this,
      texture: 'atlas',
      frame: 'mario/stand',
      x: 16 * 6,
      y: 100,
    })
    this.mario.onDie = () => {
      this.time.addEvent({
        delay: 3000,
        callback: () => {
          // @ts-ignore
          const { coins, lives } = this.hud
          this.scene.restart({
            coins: coins.value,
            lives: lives.value,
          })
        },
      })
    }
    this.brick = new Brick({ scene: this })

    // 终点
    const endPoint = this.worldLayer.findByIndex(5)
    // 终点旗杆
    this.flag = new Flag(this, endPoint.pixelX, endPoint.pixelY).overlap(this.mario, () => {
      this.scene.restart()
    })

    this.cursors = this.input.keyboard.createCursorKeys()

    const camera = this.cameras.main
    const room = this.rooms.room1
    camera.setBounds(room.x, room.y, room.width, room.height)
    camera.startFollow(this.mario)
    camera.roundPixels = true

    this.physics.add.collider(
      this.enemyGroup,
      this.worldLayer,
      // @ts-ignore
      this.enemyColliderWorld,
      (enemy: Enemy) => {
        return !enemy.disableCollide
      },
      this
    )
    this.physics.add.collider(this.powerUpGroup, this.worldLayer)
    // @ts-ignore
    this.physics.add.collider(this.mario, this.worldLayer, this.playerColliderWorld, () => !this.mario.dead, this)

    this.physics.add.collider(this.brick, this.powerUpGroup)
    // @ts-ignore
    this.physics.add.collider(this.brick, this.enemyGroup, this.brickColliderEnemy, undefined, this)

    // @ts-ignore
    this.physics.add.overlap(this.mario, this.enemyGroup, this.playerOverlapEnemy, undefined, this)
    // @ts-ignore
    this.physics.add.overlap(this.enemyGroup, this.enemyGroup, this.enemyOverlapEnemy, undefined, this)
  }

  update(time: number, delta: number) {
    this.animatedTiles.update(delta)
    this.hud.update()
    this.mario.update(this.cursors, time, delta)
    this.enemyGroup.update(this.mario, time, delta)
    this.powerUpGroup.update(this.mario, time, delta)
  }

  /**
   * 解析除敌人外与游戏有交互的层
   * @param name 图层名称
   */
  private parseModifiersLayer(name: string) {
    const worldLayer = this.worldLayer
    const ctx = this
    const parser = {
      powerUp(modifier: Phaser.Types.Tilemaps.TiledObject) {
        const tile = worldLayer.getTileAt(Number(modifier.x) / 16, Number(modifier.y) / 16 - 1)
        tile.properties.powerUp = modifier.name
        switch (modifier.name) {
          case '1up':
            tile.properties.callback = 'questionMark'
            tile.setCollision(true)
            break
          case 'coin':
            tile.properties.hitNumber = 4
        }
      },
      pipe(modifier: Phaser.Types.Tilemaps.TiledObject) {
        const tile = worldLayer.getTileAt(Number(modifier.x) / 16, Number(modifier.y) / 16)
        tile.properties.dest = modifier.name
        Object.assign(tile.properties, parseTiledProperties(modifier.properties))
      },
      dest({ name, x, y, properties }: Phaser.Types.Tilemaps.TiledObject) {
        ctx.dests[name] = {
          name,
          x: Number(x),
          y: Number(y),
        }
        Object.assign(ctx.dests[name], parseTiledProperties(properties))
      },
      room({ name, x, y, width, height }: Phaser.Types.Tilemaps.TiledObject) {
        ctx.rooms[name] = {
          name,
          x: Number(x),
          y: Number(y),
          width: Number(width),
          height: Number(height),
        }
      },
    }
    this.map.getObjectLayer(name).objects.forEach((modifier) => {
      parser[modifier.type]?.(modifier)
    })
  }

  /**
   * 解析敌人图层，获取敌人的坐标数据
   * @param name 图层名称
   */
  private parseEnemiesLayer(name: string) {
    const enemiesData: EnemyData[] = []
    this.map.getObjectLayer(name).objects.forEach((tile) => {
      enemiesData.push({
        name: tile.name as EnemyName,
        x: tile.x as number,
        y: tile.y as number,
      })
    })
    return enemiesData
  }

  private enemyColliderWorld(enemy: Enemy, tile: Phaser.Tilemaps.Tile) {
    enemy.colliderWorld(tile)
  }

  private enemyOverlapEnemy(enemy1: Enemy, enemy2: Enemy) {
    enemy1.overlapEnemy(enemy2)
    enemy2.overlapEnemy(enemy1)
  }

  /**
   * 玩家与敌人接触时触发
   * @param mario 玩家
   * @param enemy 敌人
   */
  private playerOverlapEnemy(mario: Player, enemy: Enemy) {
    if (enemy.dead || mario.dead) return

    let isBreak = [Invincible, Fire, Large].some(({ name }) => this.mario.power?.[name]?.overlapEnemy(mario, enemy))
    if (isBreak) return

    // Bug: body.touching 会出现多个为true的值
    // 解决：加多一个速度的判断
    const stepOnEmeny = mario.body.touching.down && enemy.body.touching.up && mario.body.velocity.y !== 0

    if (enemy.overlapPlayer(mario, stepOnEmeny)) return

    if (stepOnEmeny) {
      mario.body.setVelocityY(-80)
    } else if (!mario.protected && enemy.attackPower) {
      mario.die()
    }
  }

  /**
   * 玩家与地图接触时触发
   * @param mario 玩家
   * @param tile 目标 tile
   */
  private playerColliderWorld(mario: Player, tile: Phaser.Tilemaps.Tile) {
    const properties = tile.properties
    if (!properties) return

    // 出入管道
    if (properties.dest) {
      if (this.cursors[properties.direction].isDown) {
        this.pipeAnimation(properties.direction, () => {
          const { x, y, direction } = this.dests[properties.dest]
          this.moveTo(x + mario.width, y + this.mario.height / 2)
          if (direction) {
            this.pipeAnimation(direction)
          }
        })
      }
    }

    // 玩家撞击砖块
    if (this.mario.body.blocked.up) {
      // 重置跳跃的计时，阻止维持的跳跃速度
      this.mario.jumpTimer = 0
      console.log('playerColliderWorld', tile, mario)

      // 查找离玩家位置最近的砖块
      let collideTile = tile
      const nextTile = this.worldLayer.getTileAt(tile.x + 1, tile.y)
      if (nextTile?.properties?.callback) {
        const xpos = this.mario.x - this.mario.width / 2
        if (Math.abs(xpos - nextTile.pixelX) < Math.abs(xpos - tile.pixelX)) {
          collideTile = nextTile
        }
      }

      // 有设置回调函数名则执行对应回调
      if (collideTile?.properties?.callback) {
        const { callback } = collideTile.properties
        if (this[callback]) {
          this[callback](collideTile)
          // 玩家顶到砖块时，砖块需要有一个上移的动画：
          this.brick.show(collideTile.pixelX, collideTile.pixelY)
          this.tweens.add({
            targets: collideTile,
            pixelY: collideTile.pixelY - 4,
            duration: 100,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              this.brick.hide()
              collideTile.pixelY = collideTile.y * 16
            },
            yoyo: true,
          })
        }
      }
    }
  }

  private brickColliderEnemy(brick: Brick, enemy: Enemy) {
    if (enemy.dead) return
    if (this.mario.hasPower(Large.name)) {
      enemy.die(true)
    }
    console.log('brick enemy collider', enemy)
  }

  /**
   * 撞破砖块的效果
   * @param tile 目标
   */
  public breakBrick(tile: Phaser.Tilemaps.Tile) {
    this.map.removeTileAt(tile.x, tile.y, true, true, this.worldLayer)
    this.blockEmitter.emitParticle(6, tile.x * 16, tile.y * 16)
    this.sound.playAudioSprite('sfx', 'smb_breakblock')
  }

  /**
   * 玩家撞击普通砖块时触发
   * @param tile 撞击目标
   */
  private breakable(tile: Phaser.Tilemaps.Tile) {
    if (this.mario.hasPower(Large.name)) {
      this.breakBrick(tile)
    } else {
      this.sound.playAudioSprite('sfx', 'smb_bump')
    }
    console.log('breakable', tile)
  }

  /**
   * 玩家撞击“问号”砖块时触发
   * @param tile 撞击目标
   */
  private questionMark(tile: Phaser.Tilemaps.Tile) {
    if (!tile.properties.hitNumber) {
      tile.properties.stopAnimation = true
      tile.properties.callback = null
      tile.index = 44
    }

    const powerUp = tile.properties.powerUp

    if (powerUp) {
      this.createPowerUp(powerUp, tile)
    } else {
      new CoinSpin(this, tile.pixelX + 8, tile.pixelY - 10, 'atlas').spin()
    }
    console.log('questionMark', tile)
  }

  /**
   * 创建对应道具
   * @param name 道具名
   * @param tile tile
   */
  private createPowerUp(name: string, tile: Phaser.Tilemaps.Tile) {
    const baseOptions = {
      scene: this,
      x: tile.pixelX + 8,
      y: tile.pixelY - 10,
      texture: 'atlas',
    }
    let powerUp: Flower | Mushroom | Star | undefined

    switch (name) {
      case 'mushroom':
        if (this.mario.hasPower(Large.name)) {
          powerUp = new Flower({ ...baseOptions }).overlap(this.mario, () => {
            new Fire(this.mario, this.worldLayer, this.enemyGroup)
          })
        } else {
          powerUp = new Mushroom({ ...baseOptions, type: 'super' }).overlap(this.mario, () => {
            new Large(this.mario)
          })
        }
        break
      case 'star':
        powerUp = new Star({ ...baseOptions }).overlap(this.mario, () => {
          new Invincible(this.mario)
        })
        break
      case '1up':
        powerUp = new Mushroom({ ...baseOptions, type: '1up' }).overlap(this.mario, () => {
          this.hud.incDec('lives', 1)
        })
        break
      case 'coin':
        tile.properties.hitNumber--
        new CoinSpin(this, tile.pixelX + 8, tile.pixelY - 10, 'atlas').spin()
        break
    }

    if (powerUp) {
      this.powerUpGroup.add(powerUp)
    }
  }

  /**
   * 进出管道的动画
   * @param direction 方向
   * @param callback 动画完成的回调
   */
  private pipeAnimation(direction: string, callback?: Function) {
    if (this.physics.world.isPaused) return

    this.mario
      .play('stand' + this.mario.animSuffix, true)
      .setDepth(-1)
      .body.stop()

    this.physics.world.pause()
    this.sound.playAudioSprite('sfx', 'smb_pipe')

    const propMap = {
      down: ['y', 1],
      up: ['y', -1],
      right: ['x', 1],
      left: ['x', -1],
    }
    const [prop, value] = propMap[direction]

    this.tweens.add({
      targets: this.mario,
      [prop]: this.mario[prop] + this.mario.height * value,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.physics.world.resume()
        this.mario.setDepth(1)
        callback?.()
      },
    })
  }

  /**
   * 将玩家移动到指定坐标，并更新相机边界
   * @param x
   * @param y
   */
  private moveTo(x: number, y: number) {
    Object.values(this.rooms)
      .sort((a, b) => a.x - b.x)
      .some((room) => {
        if (x < room.x + room.width) {
          this.cameras.main.setBounds(room.x, room.y, room.width, room.height)
          return true
        }
      })
    this.mario.setX(x).setY(y)
  }
}
