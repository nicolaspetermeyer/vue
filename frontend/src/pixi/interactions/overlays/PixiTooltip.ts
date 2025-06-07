import { Graphics, Text, Sprite, Texture } from 'pixi.js'
import { PixiContainer } from '../../Base/PixiContainer'

export interface TooltipOptions {
  text?: string
  texture?: Texture
  title?: string
  x: number
  y: number
}

export class PixiTooltip extends PixiContainer {
  private bg: Graphics
  private labels: Text
  private title: Text | null = null
  private densityPlot: Sprite | null = null
  private padding = 8
  private maxLines = 30
  private contentGap = 5

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
        wordWrapWidth: 300, // maximum wrap width
        fontFamily: 'monospace',
      },
    })
    this.addChild(this.labels)

    this.visible = false

    this.eventMode = 'none'
  }

  show(text: string, x: number, y: number) {
    this.showWithOptions({
      text,
      x,
      y,
    })
  }

  showWithOptions(options: TooltipOptions) {
    const { text, texture, title, x, y } = options

    this.clearContent()

    let contentY = this.padding
    let contentWidth = 0
    let contentHeight = 0

    if (title) {
      this.title = new Text({
        text: title,
        style: {
          fontSize: 14,
          fontWeight: 'bold',
          fill: 0xffffff,
          wordWrap: true,
          wordWrapWidth: 300,
        },
      })

      this.title.position.set(this.padding, contentY)
      this.addChild(this.title)

      contentY += this.title.height + this.contentGap
      contentWidth = Math.max(contentWidth, this.title.width)
    }

    if (texture) {
      this.densityPlot = new Sprite(texture)
      this.densityPlot.position.set(this.padding, contentY)

      // Scale down if too large
      if (this.densityPlot.width > 300) {
        const scale = 300 / this.densityPlot.width
        this.densityPlot.scale.set(scale)
      }

      this.addChild(this.densityPlot)

      contentY += this.densityPlot.height + this.contentGap
      contentWidth = Math.max(contentWidth, this.densityPlot.width)
    }

    if (text) {
      const lines = text.split('\n')
      let limitedText = text

      if (lines.length > this.maxLines) {
        limitedText = lines.slice(0, this.maxLines).join('\n') + '\n...'
      }

      this.labels.text = limitedText
      this.labels.position.set(this.padding, contentY)

      contentY += this.labels.height
      contentWidth = Math.max(contentWidth, this.labels.width)
    } else {
      // Hide labels if no text
      this.labels.visible = false
    }

    // Calculate final dimensions
    contentHeight = contentY

    // Resize and redraw background
    const bgWidth = contentWidth + this.padding * 2
    const bgHeight = contentHeight + this.padding

    this.bg.clear()
    this.bg.roundRect(0, 0, bgWidth, bgHeight, 6).fill({ color: 0x333333, alpha: 0.9 })

    // Position the tooltip
    this.position.set(x, y)
    this.visible = true
  }

  private clearContent(): void {
    // Reset text
    this.labels.text = ''
    this.labels.visible = true

    // Remove title if it exists
    if (this.title) {
      this.removeChild(this.title)
      this.title.destroy()
      this.title = null
    }

    // Remove density plot if it exists
    if (this.densityPlot) {
      this.removeChild(this.densityPlot)
      this.densityPlot.destroy()
      this.densityPlot = null
    }
  }

  hide() {
    this.visible = false
    this.clearContent()
  }
}
