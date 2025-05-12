import { Graphics, Text } from 'pixi.js'
import { PixiContainer } from '../../Base/PixiContainer'

export class PixiTooltip extends PixiContainer {
  private bg: Graphics
  private labels: Text
  private padding = 8
  private maxLines = 20

  constructor() {
    super({
      width: 0,
      height: 0,
      positionAbsolute: true,
      background: null,
    })

    this.bg = new Graphics()
    this.addChild(this.bg)

    this.labels = new Text({
      text: '',
      style: {
        fontSize: 12,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 300, // maximum wrap width (optional)
        fontFamily: 'monospace',
      },
    })
    this.addChild(this.labels)

    this.visible = false

    this.eventMode = 'none' // Disable interaction for the tooltip
  }

  show(text: string, x: number, y: number) {
    const lines = text.split('\n')
    let limitedText = text

    if (lines.length > this.maxLines) {
      limitedText = lines.slice(0, this.maxLines).join('\n') + '\n...'
    }

    this.labels.text = limitedText

    const labelWidth = this.labels.width
    const labelHeight = this.labels.height

    // Update label position with padding
    this.labels.position.set(this.padding, this.padding)

    // Resize and redraw background
    const bgWidth = labelWidth + this.padding * 2
    const bgHeight = labelHeight + this.padding * 2

    this.bg.clear()
    this.bg.roundRect(0, 0, bgWidth, bgHeight, 6).fill({ color: 0x333333, alpha: 0.9 })

    this.position.set(x, y)
    this.visible = true
  }

  hide() {
    this.visible = false
  }
}
