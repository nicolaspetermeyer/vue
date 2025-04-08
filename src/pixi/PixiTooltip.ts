import { Graphics, Text } from 'pixi.js'
import { PixiContainer } from './PixiContainer'

export class PixiTooltip extends PixiContainer {
  private bg: Graphics
  private labels: Text

  constructor() {
    super({
      width: 120,
      height: 30,
      positionAbsolute: true,
      background: null,
    })

    this.bg = new Graphics()
    this.bg.roundRect(0, 0, 120, 30, 6)
    this.bg.fill({ color: 0x333333, alpha: 0.9 })
    this.addChild(this.bg)

    this.labels = new Text({
      text: '',
      style: {
        fontSize: 12,
        fill: 0xffffff,
      },
    })
    this.labels.position.set(8, 6)
    this.addChild(this.labels)

    this.visible = false
  }

  show(text: string, x: number, y: number) {
    this.labels.text = text
    this.position.set(x, y)
    this.visible = true
  }

  hide() {
    this.visible = false
  }
}
