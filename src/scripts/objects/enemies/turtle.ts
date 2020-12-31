import Enemy from './enemyClass'
import Player from '../player'

type Config = {
  scene: Phaser.Scene
  x: number
  y: number
  texture: string
}

export default class Turtle extends Enemy {
  body: Phaser.Physics.Arcade.Body

  /**
   * 乌龟是否为缩起状态
   */
  private shrink = false

  constructor({ scene, x, y, texture }: Config) {
    super(scene, x, y, texture, 'turtle/turtle0', 'turtleShell')
    scene.physics.world.enable(this)
    scene.add.existing(this)

    this.body.setBounce(1, 0).setVelocityX(this.vx)

    this.anims.create({
      key: 'turtleWalk',
      frames: this.anims.generateFrameNames(texture, {
        prefix: 'turtle/turtle',
        start: 0,
        end: 1,
      }),
      frameRate: 4,
      repeat: -1,
      repeatDelay: 0,
    })

    this.anims.create({
      key: 'turtleShell',
      frames: [{ frame: 'turtle/shell', key: 'atlas' }],
      frameRate: 1,
      repeat: 0,
      repeatDelay: 0,
    })

    this.play('turtleWalk')
  }

  /**
   * 与玩家接触时触发
   * @param player
   * @param stepOn 玩家是否踩到敌人
   */
  overlapPlayer(player: Player, stepOn: boolean) {
    if (this.shrink) {
      if (this.body.velocity.x === 0) {
        const direction = player.x > this.x ? -1 : 1
        const speed = 250
        this.x += direction * 6
        this.body.setVelocityX(direction * speed)
        this.scene.sound.playAudioSprite('sfx', 'smb_kick')
        this.attackPower = true
        return true
      } else if (stepOn) {
        this.scene.sound.playAudioSprite('sfx', 'smb_stomp')
        this.body.stop()
        this.attackPower = false
      } else {
        this.attackPower = true
      }
    } else if (stepOn) {
      this.play('turtleShell')
      this.scene.sound.playAudioSprite('sfx', 'smb_stomp')
      this.body.stop().setSize(16, 16).setOffset(0, 8)
      this.shrink = true
      this.attackPower = false
    }

    return false
  }

  /**
   * 与另外一个敌人接触时触发
   * @param enemy 另一个敌人
   */
  overlapEnemy(enemy: Enemy) {
    // 如果乌龟处于缩起来的状态移动，干掉另外一个敌人
    if (this.shrink && this.body.velocity.x !== 0) {
      enemy.die(true)
    }
  }

  /**
   * 与地图接触时触发
   * @param tile 接触的对象
   */
  colliderWorld(tile: Phaser.Tilemaps.Tile) {
    if (this.shrink && this.body.velocity.x !== 0) {
      if (tile?.properties?.callback === 'breakable') {
        // @ts-ignore
        this.scene.breakBrick(tile)
      }
    }
  }

  /**
   * 还原状态
   * @param x 新的水平坐标
   * @param y 新的垂直坐标
   */
  restore(x: number, y: number) {
    super.restore(x, y)
    this.shrink = false
    this.setBodySize(16, 24)
    this.body.setBounce(1, 0).setVelocity(this.vx, 0)
    this.anims.play('turtleWalk')
  }
}
