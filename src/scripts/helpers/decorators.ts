/**
 * 增减分数
 */
export const score = updateHud('score')

/**
 * 增减金币数量
 */
export const coins = updateHud('coins')

/**
 * 生命条数增减
 */
export const lives = updateHud('lives')

function updateHud(key: string) {
  return function (value: number) {
    return function (target: Object, propertyName: string, propertyDescriptor: PropertyDescriptor): PropertyDescriptor {
      const method = propertyDescriptor.value

      propertyDescriptor.value = function (...args: any[]) {
        // @ts-ignore
        this.scene.hud.incDec(key, value)
        const result = method.apply(this, args)
        return result
      }
      return propertyDescriptor
    }
  }
}
