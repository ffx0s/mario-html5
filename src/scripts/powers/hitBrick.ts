type direction = 'up' | 'left' | 'right'

import 'reflect-metadata'
import { autoInjectable, inject } from 'tsyringe'
import Brick from '../objects/brick'
import { Power, TargetObject, Large } from './index'

@autoInjectable()
export class HitBrick implements Power {
  private target: TargetObject
  private directions: direction[] = []

  constructor(target: TargetObject, directions: direction[], @inject(Brick) private brick?: Brick) {
    this.target = target
    this.directions = directions
  }

  public colliderWorld(target: TargetObject, tile: Phaser.Tilemaps.Tile) {
    this.directions.forEach((direction) => {
      if (target.body.blocked[direction]) {
        if (direction === 'up') {
          this.verticalHit(target, tile)
        } else {
          this.levelHit(target, tile)
        }
      }
    })
  }

  verticalHit(target: TargetObject, tile: Phaser.Tilemaps.Tile) {
    const brick = this.brick as Brick

    let collideTile = tile
    // 查找离目标位置最近的砖块
    const nextTile = tile.tilemapLayer.getTileAt(tile.x + 1, tile.y)
    if (nextTile?.properties?.callback) {
      const xpos = target.x - target.width / 2
      if (Math.abs(xpos - nextTile.pixelX) < Math.abs(xpos - tile.pixelX)) {
        collideTile = nextTile
      }
    }

    if (!collideTile?.properties?.callback) return

    // 有设置回调函数名则执行对应回调
    const { callback } = collideTile.properties

    if (this[callback]) {
      this[callback](collideTile)
      brick.show(collideTile.pixelX, collideTile.pixelY)
      // 目标头部撞击砖块时，砖块会有一个上移的动画：
      target.scene.tweens.add({
        targets: collideTile,
        pixelY: collideTile.pixelY - 4,
        duration: 100,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          brick.hide()
          collideTile.pixelY = collideTile.y * 16
        },
        yoyo: true,
      })
    }
  }

  levelHit(target: TargetObject, tile: Phaser.Tilemaps.Tile) {
    if (!tile.properties) return
    // 有设置回调函数名则执行对应回调
    const { callback } = tile.properties
    if (this[callback]) {
      this[callback](tile)
    }
  }

  /**
   * 撞击普通砖块时调用
   * @param tile 撞击目标
   */
  private breakable(tile: Phaser.Tilemaps.Tile) {
    const brick = this.brick as Brick
    if (this.target.powers.has(Large) || !this.directions.includes('up')) {
      brick.break(tile)
    } else {
      this.target.scene.sound.playAudioSprite('sfx', 'smb_bump')
    }
  }

  /**
   * 撞击“问号”砖块时调用
   * @param tile 撞击目标
   */
  private questionMark(tile: Phaser.Tilemaps.Tile) {
    if (tile.properties.hitNumber) {
      tile.properties.hitNumber--
    } else {
      tile.setCollision(true)
      tile.properties.stopAnimation = true
      tile.properties.callback = null
      tile.index = 44
    }

    // @ts-ignore
    this.target.scene.createPowerUp(tile.properties.powerUp, tile.pixelX + 8, tile.pixelY - 10)
  }
}
