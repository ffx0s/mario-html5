/**
 * 目的地坐标信息
 */
interface dests {
  [name: string]: {
    /**
     * 目的地名称
     */
    name: string
    /**
     * 方向
     */
    direction?: string
    /**
     * 坐标
     */
    x: number
    y: number
  }
}

/**
 * 房间信息
 */
interface rooms {
  [name: string]: {
    /**
     * 房间名
     */
    name: string
    /**
     * 坐标
     */
    x: number
    y: number
    /**
     * 大小
     */
    width: number
    height: number
  }
}
