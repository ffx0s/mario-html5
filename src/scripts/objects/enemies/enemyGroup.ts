import Player from '../player'
import { Enemy, Goomba, Turtle } from './index'
import { removeArrayMember } from '../../utils'

export type EnemyName = 'goomba' | 'turtle'

export interface EnemyData {
  name: EnemyName
  x: number
  y: number
}

/**
 * 存储敌人的 Group
 */
export class EnemyGroup extends Phaser.GameObjects.Group {
  /**
   * 创建敌人时所需要的数据
   */
  enemiesData: EnemyData[] = []
  /**
   * 当从组里移除一个成员时，对应成员会 push 到这里，等待下次创建时再取出
   */
  pool: Enemy[] = []
  /**
   * 敌人与玩家的距离超出指定范围时，设置为不可见状态
   */
  private maxX = 500
  /**
   * 敌人与玩家的距离超出指定范围时，设置为不可见状态
   */
  private maxY = 500

  constructor(scene: Phaser.Scene, enemiesData: EnemyData[] = []) {
    super(scene)
    this.enemiesData = enemiesData
    // @ts-ignore
    this.removeCallback = (enemy: Enemy) => {
      this.pool.push(enemy)
    }
  }

  /**
   * 创建对应敌人，并添加到组里
   * @param name 敌人的类型名称
   * @param x 水平坐标
   * @param y 垂直坐标
   */
  createEnemy(name: EnemyName, x: number, y: number) {
    let enemy = this.pool.find((enemy) => enemy.constructor.name.toLowerCase() === name)

    if (enemy) {
      enemy.restore(x, y)
      this.add(enemy)
      this.pool.splice(this.pool.indexOf(enemy), 1)
    } else {
      switch (name) {
        case 'goomba':
          enemy = new Goomba({ scene: this.scene, x, y, texture: 'atlas' })
          break
        case 'turtle':
          enemy = new Turtle({ scene: this.scene, x, y, texture: 'atlas' })
          break
      }
      this.add(enemy)
    }

    return enemy
  }

  update(time: number, delta: number, player: Player) {
    const canvas = this.scene.sys.game.canvas
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height

    // 当玩家与敌人距离小于画布宽度时才创建敌人，创建敌人后删除对应 enemiesData 数组的成员
    removeArrayMember(this.enemiesData, ({ x, y, name }: EnemyData) => {
      if (Math.abs(player.x - x) < canvasWidth) {
        this.createEnemy(name, x, y)
        return true
      }
    })

    // @ts-ignore
    this.children.iterate((enemy: Enemy) => {
      if (enemy) {
        if (enemy.active) {
          // 超出与玩家的最大范围时从组里移除敌人
          if (
            Math.abs(player.x - enemy.x) > this.maxX + canvasWidth ||
            Math.abs(player.y - enemy.y) > this.maxY + canvasHeight
          ) {
            this.killAndHide(enemy)
            this.remove(enemy)
          }

          // 切换方向
          const isMovingRight = enemy.body.velocity.x >= 0
          enemy.setFlipX(!isMovingRight)
        } else {
          this.remove(enemy)
        }
      }
    })
  }
}
