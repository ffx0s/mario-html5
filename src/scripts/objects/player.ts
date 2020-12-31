import Invincible from '../powers/invincible'
import Large from '../powers/large'
import Fire from '../powers/fire'
import { lives } from '../helpers/decorators'

type Power = Invincible | Large | Fire

type Config = {
  scene: Phaser.Scene
  x: number
  y: number
  texture: string
  frame: string
  options?: Options
}

interface Options {
  ax: number
  vy: number
  maxVx: number
  maxVy: number
  defaultSize: number[]
  jumpDuration: number
  stopSpeed: number
}

/**
 * 玩家参数
 */
const defaultOptions = {
  /**
   * 移动时的加速度
   */
  ax: 250,
  /**
   * 跳跃时的速度
   */
  vy: -200,
  /**
   * 最大移动速度
   */
  maxVx: 200,
  /**
   * 最大跳跃速度
   */
  maxVy: 300,
  /**
   * 初始大小
   */
  defaultSize: [8, 16],
  /**
   * 跳跃持续时间，越大跳得越高
   */
  jumpDuration: 220,
  /**
   * 当速度小于指定值时停止移动
   */
  stopSpeed: 30,
}

export default class Player extends Phaser.GameObjects.Sprite {
  body: Phaser.Physics.Arcade.Body
  /**
   * 玩家的能力
   */
  power = {}
  /**
   * 是否死亡
   */
  dead: boolean = false
  /**
   * 死亡回调函数
   */
  onDie: Function = function () {}
  /**
   * 是否受保护
   */
  protected: boolean = false
  /**
   * 玩家动画 key 后缀
   */
  animSuffix = ''
  /**
   * 人物参数
   */
  options: Options
  /**
   * 当前跳跃持续时间的计数
   */
  jumpTimer = 0

  constructor({ scene, x, y, texture, frame, options }: Config) {
    super(scene, x, y, texture, frame)
    scene.physics.world.enable(this)
    scene.add.existing(this)

    this.options = { ...defaultOptions, ...options }

    this.makeAnimaions()

    this.body.setSize(...this.options.defaultSize).setMaxVelocity(this.options.maxVx, this.options.maxVy)
  }

  /**
   * 创建玩家行走跳跃等各种状态下的动画
   */
  private makeAnimaions() {
    const config = {
      frameRate: 10,
      repeat: -1,
      repeatDelay: 0,
    }

    // Mario animations: One without suffix, super after mushroom and fire after flower
    ;['', 'Super', 'Fire'].forEach((suffix: string) => {
      this.anims.create({
        key: 'run' + suffix,
        frames: this.anims.generateFrameNames('atlas', {
          prefix: 'mario/walk' + suffix,
          start: 1,
          end: 3,
        }),
        ...config,
      })

      // Jump, Stand and Turn: one frame each
      ;['jump', 'stand', 'turn', 'bend'].forEach((anim) => {
        if (anim === 'bend' && suffix === '') {
          // No bend animation when Mario is small
          return
        }
        this.anims.create({
          key: anim + suffix,
          frames: [
            {
              frame: 'mario/' + anim + suffix,
              key: 'atlas',
            },
          ],
          ...config,
        })
      })

      // Climb
      this.anims.create({
        key: 'climb' + suffix,
        frames: this.anims.generateFrameNames('atlas', {
          prefix: 'mario/climb' + suffix,
          start: 0,
          end: 1,
        }),
        ...config,
      })

      // Swim
      this.anims.create({
        key: 'swim' + suffix,
        frames: this.anims.generateFrameNames('atlas', {
          prefix: 'mario/swim' + suffix,
          start: 1,
          end: 5,
        }),
        ...config,
      })
    })

    const growFrames = [
      'mario/half',
      'mario/stand',
      'mario/half',
      'mario/standSuper',
      'mario/half',
      'mario/standSuper',
    ].map((frame) => ({ frame, key: 'atlas' }))

    this.anims.create({
      key: 'grow',
      frames: growFrames,
      frameRate: 10,
      repeat: 0,
      repeatDelay: 0,
    })

    this.anims.create({
      key: 'shrink',
      frames: growFrames.reverse(),
      frameRate: 10,
      repeat: 0,
      repeatDelay: 0,
    })

    this.anims.create({
      key: 'dead',
      frames: [{ frame: 'mario/dead', key: 'atlas' }],
      frameRate: 1,
      repeat: -1,
    })

    // fire
    this.anims.create({
      key: 'fire',
      frames: this.anims.generateFrameNames('atlas', {
        prefix: 'mario/walkFire',
        start: 1,
        end: 1,
      }),
    })
  }

  /**
   * 玩家移动
   * @param ax 移动时的加速度
   */
  walk(ax: number) {
    this.body.setAccelerationX(ax)
  }

  /**
   * 停止移动
   */
  stopWalk() {
    this.body.setAcceleration(0, 0)
    this.body.setVelocityX(0)
  }

  /**
   * 跳跃
   * @param vy 跳跃的速度
   */
  jump(vy = this.options.vy) {
    this.body.setVelocityY(vy)
    const name = 'smb_jump-' + (this.hasPower(Large.name) ? 'super' : 'small')
    this.scene.sound.playAudioSprite('sfx', name)
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, time: number, delta: number) {
    if (this.scene.physics.world.isPaused || this.dead) return

    const { ax, vy, stopSpeed, jumpDuration } = this.options
    const velocity = this.body.velocity
    const animSuffix = this.animSuffix

    // 移动
    if (cursors.left.isDown) {
      this.setFlipX(true)
      this.walk(-ax - (velocity.x > 0 ? velocity.x * 2 : 0))
    } else if (cursors.right.isDown) {
      this.setFlipX(false)
      this.walk(ax + (velocity.x < 0 ? -velocity.x * 2 : 0))
    } else {
      if (Math.abs(velocity.x) < stopSpeed) {
        this.stopWalk()
      } else {
        // 速度在10以上时会有一个减速的效果
        this.body.setAccelerationX((velocity.x < 0 ? 1 : -1) * ax)
      }
    }

    // 跳跃：长按和短按跳跃
    const upSpaceDown = cursors.up.isDown || cursors.space.isDown
    if (upSpaceDown && this.body.blocked.down) {
      this.jumpTimer = time
      this.jump()
    } else if (upSpaceDown && this.jumpTimer !== 0) {
      if (time - this.jumpTimer > jumpDuration) {
        this.jumpTimer = 0
      } else {
        this.body.setVelocityY(vy)
      }
    } else if (this.jumpTimer !== 0) {
      this.jumpTimer = 0
    }

    // 动画
    if (this.body.blocked.down) {
      if (cursors.down.isDown && this.hasPower(Large.name)) {
        this.anims.play('bend' + animSuffix, true)
        this.stopWalk()
      } else {
        if ((cursors.left.isDown && velocity.x > 0) || (cursors.right.isDown && velocity.x < 0)) {
          this.anims.play('turn' + animSuffix, true)
        } else {
          this.anims.play((Math.abs(velocity.x) >= 10 ? 'run' : 'stand') + animSuffix, true)
        }
      }
    } else {
      this.anims.play('jump' + animSuffix, true)
    }

    ;[Fire, Invincible].some(({ name }) => {
      return this.power[name]?.update?.(this, cursors, time, delta)
    })

    if (this.x < 0 || this.y > this.scene.sys.game.canvas.height) {
      this.die()
    }
  }

  /**
   * 玩家死亡
   */
  @lives(-1)
  die() {
    this.dead = true
    this.anims.play('dead')
    // @ts-ignore
    this.scene.music.pause()
    this.scene.sound.playAudioSprite('sfx', 'smb_mariodie')
    this.body.setAcceleration(0, 0).setVelocity(0, -200)
    this.onDie()
  }

  /**
   * 给玩家添加能力
   * @param name 能力名称
   * @param object 具体能力的对象
   * @param replace 是否替换已有的对象
   */
  addPower(name: string, object: Power, replace = false) {
    if (replace) {
      this.removePower(name)
    }
    if (!this.power[name]) {
      this.power[name] = object
    }
  }

  /**
   * 移除玩家的能力
   * @param name 能力名称
   */
  removePower(name: string) {
    if (this.power[name]) {
      this.power[name] = null
    }
  }

  /**
   * 判断玩家是否有某项能力，如果有则返回该能力的对象
   * @param name 能力名称
   */
  hasPower(name: string) {
    return this.power[name]
  }
}
