export default class CountDown {
  private timedEvent: Phaser.Time.TimerEvent
  public current: number

  constructor() {}

  start(scene: Phaser.Scene, current = 250, callback?: Function, endCallback?: Function) {
    this.current = current
    this.timedEvent = scene.time.addEvent({
      delay: 1000,
      callback: () => {
        this.current--
        callback?.(this.current)
        if (this.current === 0) {
          endCallback?.(this.current)
          this.timedEvent.remove()
        }
      },
      loop: true,
    })
  }
}
