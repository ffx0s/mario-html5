import Player from '../objects/player'
import Goomba from '../objects/enemies/goomba'
import Turtle from '../objects/enemies/turtle'

class FireBall extends Phaser.Physics.Arcade.Sprite {
  body: Phaser.Physics.Arcade.Body

  /**
   * 火球是否为爆炸状态（接触到游戏对象的左右侧会时有爆炸的效果）
   */
  isExplode = false
  /**
   * 火球的移动速度
   */
  private speedX = 200
  /**
   * 火球的垂直弹力
   */
  private bounceY = 1

  constructor(scene: Phaser.Scene, texture: string) {
    super(scene, 0, 0, texture, 'fire/fly1')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.anims.create({
      key: 'fireFly',
      frames: this.anims.generateFrameNames(texture, {
        prefix: 'fire/fly',
        start: 1,
        end: 4,
      }),
      frameRate: 15,
      repeat: -1,
      repeatDelay: 0,
    })

    this.anims.create({
      key: 'fireExplode',
      frames: this.anims.generateFrameNames(texture, {
        prefix: 'fire/explode',
        start: 1,
        end: 3,
      }),
      frameRate: 15,
    })
  }

  /**
   * 火球移动
   * @param direction 移动方向
   * @param x 水平坐标
   * @param y 垂直坐标
   */
  run(direction: number, x = 0, y = 0) {
    this.isExplode = false
    if (!this.active && !this.visible) {
      this.enableBody(true, x, y, true, true)
    } else {
      this.setX(x).setY(y)
    }
    this.body
      .setAllowGravity(true)
      .setBounceY(this.bounceY)
      .setVelocityX(this.speedX * direction)

    this.play('fireFly')
  }

  /**
   *  火球爆炸
   */
  explode() {
    if (this.isExplode) return
    this.isExplode = true
    this.scene.sound.playAudioSprite('sfx', 'smb_bump')
    this.body.setAllowGravity(false).stop()
    this.play('fireExplode').once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.disableBody(true, true)
    })
  }
}

/**
 * 发射火球的能力
 */
export default class Fire {
  private key: string
  // 是否发射中
  private launch: boolean = false
  private fireBallGroup: Phaser.GameObjects.Group
  private worldCollider: Phaser.Physics.Arcade.Collider
  private emenyCollider: Phaser.Physics.Arcade.Collider
  private maxBallNums = 2

  constructor(
    player: Player,
    worldLayer: Phaser.Tilemaps.TilemapLayer,
    emenyGroup: Phaser.GameObjects.Group,
    key = 'keydown-Z'
  ) {
    if (!player.hasPower(Fire.name)) {
      this.key = key

      this.fireBallGroup = player.scene.add.group()

      // 火球与地图的检测
      this.worldCollider = player.scene.physics.add.collider(this.fireBallGroup, worldLayer, (fireBall: any, tile) => {
        if (!fireBall.isExplode && (fireBall.body.blocked.left || fireBall.body.blocked.right)) {
          fireBall.explode()
        }
      })

      // 火球与敌人的检测
      this.emenyCollider = player.scene.physics.add.overlap(
        this.fireBallGroup,
        emenyGroup,
        // @ts-ignore
        this.fireBallOverlapEmeny,
        undefined,
        this
      )

      // 改变人物的动画
      player.animSuffix = 'Fire'
      // 监听键盘事件发射火球
      player.scene.input.keyboard.on(key, this.handleKeydown, player)
      player.addPower(Fire.name, this, false)
    }
  }

  private fireBallOverlapEmeny(fireBall: FireBall, emeny: Goomba | Turtle) {
    if (emeny.dead) return
    fireBall.explode()
    emeny.die(true)
  }

  /**
   * 创建火球
   * @param player 玩家（火球创建依赖玩家的一些参数）
   */
  private createFireBall(player: Player) {
    const direction = player.flipX ? -1 : 1

    if (this.fireBallGroup.getLength() < this.maxBallNums) {
      const fireBall = new FireBall(player.scene, 'atlas')
      fireBall.run(direction, player.x, player.y)
      this.fireBallGroup.add(fireBall)
    } else {
      const fireBall = this.fireBallGroup.getFirstDead()
      if (fireBall) {
        fireBall.run(direction, player.x, player.y)
      }
    }
  }

  /**
   * 火球发射的键盘事件
   */
  private handleKeydown() {
    const player: Player = this as any
    const fireInstance = player.hasPower(Fire.name)

    if (!fireInstance.launch) {
      fireInstance.launch = true
      fireInstance.createFireBall(player)
      player.scene.sound.playAudioSprite('sfx', 'smb_fireball')
      player.scene.time.addEvent({
        delay: 150,
        callback() {
          fireInstance.launch = false
        },
      })
    }
  }

  /**
   * 与敌人接触时，移除该能力
   * @param player 玩家
   */
  public overlapEnemy(player: Player) {
    if (!player.body.touching.down) {
      player.removePower(Fire.name)
      player.scene.input.keyboard.removeListener(this.key, this.handleKeydown, player)
      player.scene.physics.world.removeCollider(this.worldCollider)
      player.scene.physics.world.removeCollider(this.emenyCollider)
    }
  }

  public update(player: Player, cursors: Phaser.Types.Input.Keyboard.CursorKeys, time: number, delta: number) {
    if (this.launch) {
      player.anims.play('fire', true)
    }

    // 超出范围时设置不可见
    const maxX = Math.abs(player.x) + 1000
    const maxY = Math.abs(player.y) + 1000
    this.fireBallGroup.children.each((fireBall: any) => {
      if (Math.abs(fireBall.x) > maxX || Math.abs(fireBall.y) > maxY) {
        fireBall.setVisible(false).setActive(false)
      }
    })
  }
}
