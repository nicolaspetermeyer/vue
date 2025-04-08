import { Graphics, FederatedPointerEvent } from 'pixi.js'
import { PixiContainer } from '@/pixi/PixiContainer'
import { PixiTooltip } from './PixiTooltip'

export class PixiInteractionOverlay extends PixiContainer {
  private hitAreaGraphic: Graphics
  private tooltip: PixiTooltip

  constructor(width: number, height: number) {
    super({
      width,
      height,
      background: null,
      positionAbsolute: true,
    })

    this.hitAreaGraphic = new Graphics()
    this.hitAreaGraphic.rect(0, 0, width, height)
    this.hitAreaGraphic.fill({ color: 0x000000, alpha: 0 }) // transparent
    this.addChild(this.hitAreaGraphic)

    this.enableInteractions()

    this.tooltip = new PixiTooltip()
    this.addChild(this.tooltip)
  }

  enableInteractions() {
    this.eventMode = 'none'
    this.hitAreaGraphic.eventMode = 'passive'
    this.hitAreaGraphic.cursor = 'crosshair'
    this.hitAreaGraphic.on('pointermove', (e: FederatedPointerEvent) => {
      const pos = e.client
    })
    this.hitAreaGraphic.on('pointerdown', (e: FederatedPointerEvent) => {
      const pos = e.client
      console.log('Click at:', pos.x, pos.y)
    })
  }

  getTooltip(): PixiTooltip {
    return this.tooltip
  }
}
