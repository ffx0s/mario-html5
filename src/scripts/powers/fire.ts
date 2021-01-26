import 'reflect-metadata'
import { autoInjectable, inject } from 'tsyringe'

import Player from '../objects/player'
import { Enemy, EnemyGroup } from '../objects/enemies'
import FireBall from '../objects/fireBall'
import { Power } from './index'

/**
 * 发射火球的能力
 */
@autoInjectable()
export class Fire implements Power {
  private key = 'keydown-Z'
  // 是否发射中
  private launch: boolean = false
  private fireBallGroup: Phaser.GameObjects.Group
  private worldCollider: Phaser.Physics.Arcade.Collider
  private enemyCollider: Phaser.Physics.Arcade.Collider
  private maxBallNums = 2

  constructor(
    player: Player,
    @inject('WorldLayer') private worldLayer?: Phaser.Tilemaps.TilemapLayer,
    @inject(EnemyGroup) private enemyGroup?: EnemyGroup
  ) {
    this.fireBallGroup = player.scene.add.group()

    // 火球与地图的检测
    this.worldCollider = player.scene.physics.add.collider(
      this.fireBallGroup,
      worldLayer as Phaser.Tilemaps.TilemapLayer,
      (fireBall: any, tile) => {
        if (!fireBall.isExplode && (fireBall.body.blocked.left || fireBall.body.blocked.right)) {
          fireBall.explode()
        }
      }
    )

    // 火球与敌人的检测
    this.enemyCollider = player.scene.physics.add.overlap(
      this.fireBallGroup,
      enemyGroup as Phaser.GameObjects.Group,
      // @ts-ignore
      this.fireBallOverlapEnemy,
      undefined,
      this
    )

    // 改变人物的动画
    player.animSuffix = 'Fire'
    // 监听键盘事件发射火球
    player.scene.input.keyboard.on(this.key, this.handleKeydown, player)
  }

  public overlapEnemy(player: Player, enemy: Enemy, stepOnEnemy: boolean) {
    if (stepOnEnemy) return
    player.powers.remove(Fire)
  }

  public update(time: number, delta: number, player: Player, cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
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

  public beforeRemove(player: Player) {
    player.scene.input.keyboard.removeListener(this.key, this.handleKeydown, player)
    player.scene.physics.world.removeCollider(this.worldCollider)
    player.scene.physics.world.removeCollider(this.enemyCollider)
  }

  private fireBallOverlapEnemy(fireBall: FireBall, enemy: Enemy) {
    if (enemy.dead) return
    fireBall.explode()
    enemy.die(true)
  }

  /**
   * 创建火球
   * @param player 玩家（火球创建依赖玩家的一些参数）
   */
  private createFireBall(player: Player): FireBall | undefined {
    const direction = player.flipX ? -1 : 1

    if (this.fireBallGroup.getLength() < this.maxBallNums) {
      const fireBall = new FireBall(player.scene, 'atlas')
      fireBall.run(direction, player.x, player.y)
      this.fireBallGroup.add(fireBall)
      return fireBall
    } else {
      const fireBall = this.fireBallGroup.getFirstDead()
      if (fireBall) {
        fireBall.run(direction, player.x, player.y)
        return fireBall
      }
    }
  }

  /**
   * 火球发射的键盘事件
   */
  private handleKeydown() {
    const player: Player = this as any
    const fireInstance = player.powers.get(Fire) as Fire

    if (!fireInstance?.launch) {
      fireInstance.launch = true
      fireInstance.createFireBall(player)
      player.scene.sound.playAudioSprite('sfx', 'smb_fireball')
      player.scene.time.delayedCall(150, () => {
        fireInstance.launch = false
      })
    }
  }
}
