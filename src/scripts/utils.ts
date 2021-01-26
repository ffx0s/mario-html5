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
 * 将属性数组转换成对象的形式
 * @param arrayProps 属性数组
 */
export function arrayProps2ObjProps(arrayProps?: { name: string; value: any }[]) {
  const props = {}
  if (Array.isArray(arrayProps)) {
    arrayProps.forEach((prop) => {
      props[prop.name] = prop.value
    })
  }
  return props
}
