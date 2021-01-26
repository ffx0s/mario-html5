import { Power, TargetObject } from './index'

/**
 * 负责添加/删除能力
 */
export class PowerManage {
  /**
   * 能力 Map
   */
  private powerMap: Map<any, Power> = new Map()
  /**
   * 目标对象（能力拥有者）
   */
  private target: TargetObject

  readonly allowPowers: Function[]

  constructor(target: TargetObject, allowPowers: Function[] = []) {
    this.target = target
    this.allowPowers = allowPowers
  }

  /**
   * 给目标对象添加能力
   * @param powerClass 能力类
   * @param createPower 创建函数
   * @param replace 是否替换已有能力，默认 false 不替换
   */
  add(powerClass: Function, createPower: Function, replace = false) {
    if (!this.allowPowers.includes(powerClass)) {
      throw '不允许添加此能力：' + powerClass
    }

    if (replace) {
      this.remove(powerClass)
    }

    if (!this.get(powerClass)) {
      this.powerMap.set(powerClass, createPower())
    }

    return this
  }

  /**
   * 移除目标对象的能力
   * @param powerClass 能力类
   */
  remove(powerClass: Function) {
    const power = this.get(powerClass)
    if (power) {
      power?.beforeRemove?.(this.target)
      this.powerMap.delete(powerClass)
    }

    return this
  }

  /**
   * 获取对应能力
   * @param powerClass 能力类
   */
  get(powerClass: Function) {
    return this.powerMap.get(powerClass)
  }

  /**
   * 是否有对应能力
   * @param powerClass 能力类
   */
  has(powerClass: Function) {
    return this.powerMap.has(powerClass)
  }
}
