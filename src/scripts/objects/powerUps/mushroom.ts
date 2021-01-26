import { PowerUp } from './index'
import { score } from '../../helpers/decorators'

type Config = {
  scene: Phaser.Scene
  x: number
  y: number
  texture: string
  type: string
  speed?: number
}

export class Mushroom extends PowerUp {
  body: Phaser.Physics.Arcade.Body
  speed: number
  type: string

  constructor({ scene, x, y, texture, type, speed = 50 }: Config) {
    super({ scene, x, y, texture })

    this.setTexture(texture, 'powerup/' + type)
    this.body.setSize(16, 16)
    this.speed = speed
    this.type = type
  }

  onDisplay() {
    this.body.setAllowGravity(true).setBounce(1, 0).setVelocityX(this.speed)
  }

  @score(1000)
  onOverlap() {
    this.scene.sound.playAudioSprite('sfx', this.type === '1up' ? 'smb_1-up' : 'smb_powerup')
    this.destroy()
  }
}
