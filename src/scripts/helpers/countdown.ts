export default class CountDown extends Phaser.Events.EventEmitter {
  private timedEvent: Phaser.Time.TimerEvent
  private scene: Phaser.Scene
  private current: number
  private delay = 1000

  constructor(scene: Phaser.Scene) {
    super()
    this.scene = scene
  }

  start(time = 250) {
    this.current = time
    this.timedEvent?.remove()
    this.timedEvent = this.scene.time.addEvent({
      delay: this.delay,
      callback: () => {
        this.current--
        this.emit('interval', this.current)
        if (this.current === 0) {
          this.timedEvent.remove()
          this.emit('end', this.current)
        }
      },
      loop: true,
    })

    return this
  }
}
