interface Arr {
  [prop: string]: any
}

/**
 * 移除数组中符合条件的成员
 * @param array 目标数组
 * @param fn 判断是否符合条件的回调函数
 */
export function removeArrayMember(array: Arr = [], fn: Function) {
  const length = array.length
  for (let i = 0; i < length; i++) {
    const value = array[i]
    if (value !== undefined && fn(value)) {
      array.splice(i--, 1)
    }
  }
}

/**
 * 解析 tiled 导出的属性数组，将其转换成对象的形式
 * @param properties 属性数组
 */
export function parseTiledProperties(properties: any) {
  if (Array.isArray(properties)) {
    const object = {}
    properties.forEach((prop) => {
      object[prop.name] = prop.value
    })
    return object
  }
  return {}
}
