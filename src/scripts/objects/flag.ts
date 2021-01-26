import Player from './player'

/**
 * 终点的旗杆
 */
export default class Flag {
  /**
   * 旗面
   */
  face: Phaser.GameObjects.Sprite
  /**
   * 杆子
   */
  pole: Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.face = scene.add.sprite(x - 9, y + 16, 'atlas', 'flag')
    this.face.setOrigin(0, 0)
    scene.physics.world.enable(this.face)
    // @ts-ignore
    this.face.body.setAllowGravity(false)

    this.pole = scene.add.rectangle(x, 0, 16, scene.sys.canvas.height)
    this.pole.setOrigin(0, 0)
    scene.physics.world.enable(this.pole)
    // @ts-ignore
    this.pole.body.setAllowGravity(false)
  }

  /**
   * 玩家与旗杆接触时调用
   * @param player 玩家
   * @param callback 回调
   */
  overlap(player: Player, callback?: Function) {
    player.scene.physics.add.overlap(player, this.pole, () => {
      this.animate(player, 0, callback)
    })
    return this
  }

  /**
   * 抓住旗杆时的动画
   * @param player 玩家
   * @param step 动画阶段
   * @param callback 动画结束回调
   */
  private animate(player: Player, step: number, callback?: Function) {
    switch (step) {
      case 0:
        // @ts-ignore
        player.scene.music.stop()
        player.scene.sound.playAudioSprite('sfx', 'smb_flagpole')
        player.scene.physics.world.pause()

        // 玩家抓住旗杆往下爬的动画
        player.setX(this.pole.x).play('climb' + player.animSuffix, true)
        player.scene.tweens.add({
          targets: player,
          y: this.pole.height - 16 * 4,
          duration: (this.pole.height - player.y) * 5,
          onComplete: () => {
            this.animate(player, 1, callback)
          },
        })

        // 旗子落下的动画
        player.scene.tweens.add({
          targets: this.face,
          y: this.pole.height - 16 * 4,
          duration: 1000,
        })
        break
      case 1:
        // 落下旗杆，进入房间的动画
        player.x += 16
        player.play('run' + player.animSuffix, true)
        const targetX = player.x + 100
        player.scene.tweens.add({
          targets: player,
          props: {
            x: {
              value: targetX,
              duration: 1200,
            },
            y: {
              value: this.pole.height - 16 * 2 - player.height / 2,
              duration: 200,
            },
          },
          onUpdate() {
            if (player.x > targetX - player.width) {
              player.setDepth(-1)
            }
          },
        })

        player.scene.sound
          .addAudioSprite('sfx')
          .on('complete', (sound: Phaser.Sound.HTML5AudioSound) => {
            callback?.()
            sound.destroy()
          })
          .play('smb_stage_clear')

        break
    }
  }
}
