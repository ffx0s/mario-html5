import Player from '../objects/player'
import { Enemy, Turtle } from '../objects/enemies'

import { Jump } from './jump'
import { Move } from './move'
import { Invincible } from './invincible'
import { Large } from './large'
import { Fire } from './fire'
import { EnterPipe } from './enterPipe'
import { HitBrick } from './hitBrick'

export { Jump, Move, Invincible, Large, Fire, EnterPipe, HitBrick }

export { PowerManage } from './powerManage'

export type TargetObject = Player | Turtle

/**
 * 能力类实现接口
 */
export interface Power {
  /**
   * 在目标对象 update 方法中会调用此函数
   * @param time 当前时间
   * @param delta 与上一帧时间差值
   * @param target 目标对象
   * @param cursors 键盘 keys
   */
  update?(
    time: number,
    delta: number,
    target: TargetObject,
    cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  ): boolean | void
  /**
   * 在目标对象与敌人接触时调用此函数
   * @param target 目标对象
   * @param enemy 敌人
   * @param stepOnEnemy 目标对象是否踩到敌人
   */
  overlapEnemy?(target: TargetObject, enemy: Enemy, stepOnEnemy: boolean): boolean | void
  /**
   * 在目标对象与地图接触时调用此函数
   * @param target 目标对象
   * @param tile
   */
  colliderWorld?(target: TargetObject, tile: Phaser.Tilemaps.Tile): boolean | void
  /**
   * 在目标对象移除该能力前调用此函数（可以还原目标对象状态或卸载事件）
   * @param target 目标对象
   */
  beforeRemove?(target: TargetObject): void
}
