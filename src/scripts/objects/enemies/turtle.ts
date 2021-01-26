import { Enemy } from './index'
import Player from '../player'
import { HitBrick, PowerManage } from '../../powers'

type Config = {
  scene: Phaser.Scene
  x: number
  y: number
  texture: string
}

export class Turtle extends Enemy {
  body: Phaser.Physics.Arcade.Body

  /**
   * 乌龟是否为收缩状态
   */
  private shrink = false
  /**
   * 收缩状态下的移动速度
   */
  private shrinkSpeed = 250
  /**
   * 能力管理
   */
  powers: PowerManage

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

    this.powers = new PowerManage(this, [HitBrick])
  }

  /**
   * 与玩家接触时调用
   * @param player
   * @param stepOnEnemy 玩家是否踩到敌人
   */
  overlapPlayer(player: Player, stepOnEnemy: boolean) {
    if (this.shrink) {
      // 如果处于收缩和静止状态，则让乌龟移动
      if (this.body.velocity.x === 0) {
        const direction = player.x > this.x ? -1 : 1
        this.x += direction * 6
        this.body.setVelocityX(direction * this.shrinkSpeed)
        this.scene.sound.playAudioSprite('sfx', 'smb_kick')
        this.attackPower = true
        this.powers.add(HitBrick, () => new HitBrick(this, ['left', 'right']))
        return true
      }
      // 如果在收缩和移动状态下被玩家踩中，则让乌龟停止移动
      else if (stepOnEnemy) {
        this.scene.sound.playAudioSprite('sfx', 'smb_stomp')
        this.body.stop()
        this.attackPower = false
      } else {
        this.attackPower = true
      }
    }
    // 如果在正常状态下被玩家踩中，则切换为收缩状态
    else if (stepOnEnemy) {
      this.play('turtleShell')
      this.scene.sound.playAudioSprite('sfx', 'smb_stomp')
      this.body.stop().setSize(16, 16).setOffset(0, 8)
      this.shrink = true
      this.attackPower = false
    }

    return false
  }

  /**
   * 与另外一个敌人接触时调用
   * @param enemy 另一个敌人
   */
  overlapEnemy(enemy: Enemy) {
    // 如果乌龟处于缩起来的状态移动，干掉另外一个敌人
    if (this.shrink && this.body.velocity.x !== 0) {
      enemy.die(true)
    }
  }

  /**
   * 与地图接触时调用
   * @param tile 接触的对象
   */
  colliderWorld(tile: Phaser.Tilemaps.Tile) {
    if (this.shrink && this.body.velocity.x !== 0) {
      this.powers.get(HitBrick)?.colliderWorld?.(this, tile)
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
