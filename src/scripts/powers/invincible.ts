import { Enemy } from '../objects/enemies'
import { Power, TargetObject } from './index'

/**
 * 无敌的能力
 */
export class Invincible implements Power {
  /**
   * 当前时间
   */
  private current: number = 0
  /**
   * 持续时间
   */
  private duration: number = 10000
  /**
   * 无敌动画的当前帧索引
   */
  private frameIndex: number = 0

  /**
   * 无敌状态下玩家颜色变换数组
   */
  private tints = [0xffffff, 0xff0000, 0xffffff, 0x00ff00, 0xffffff, 0x0000ff]

  public update(time: number, delta: number, targetObject: TargetObject) {
    this.current += delta
    // 时间结束移除能力
    if (this.current >= this.duration) {
      targetObject.powers.remove(Invincible)
    } else {
      targetObject.setTint(this.tints[this.frameIndex++])
      this.frameIndex %= this.tints.length
    }
  }

  public overlapEnemy(targetObject: TargetObject, enemy: Enemy) {
    // 与敌人接触时，干掉敌人
    enemy.die(true)
    return true
  }

  public beforeRemove(targetObject: TargetObject) {
    targetObject.setTint(this.tints[0])
  }
}
