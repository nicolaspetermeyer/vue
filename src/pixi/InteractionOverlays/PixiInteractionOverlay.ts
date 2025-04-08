import { Graphics, FederatedPointerEvent, Rectangle, PointData } from 'pixi.js'
import { PixiContainer } from '@/pixi/PixiContainer'
import { PixiTooltip } from './PixiTooltip'
import { PixiDimred } from '@/pixi/PixiDimred'
import { PixiDimredPoint } from '@/pixi/PixiDimredPoint'

export class PixiInteractionOverlay extends PixiContainer {
  private hitAreaGraphic: Graphics = new Graphics()
  private tooltip: PixiTooltip
  private brushRect: Graphics = new Graphics()
  private dragStart: PointData | null = null
  private dragEnd: PointData | null = null
  private isDragging = false
  private dimred: PixiDimred | null = null
  private currentHovered: PixiDimredPoint | null = null

  constructor(width: number, height: number) {
    super({
      width,
      height,
      background: null,
      positionAbsolute: true,
    })
    this.eventMode = 'static'

    // Setup hit area for input
    this.hitAreaGraphic.rect(0, 0, width, height)
    this.hitAreaGraphic.fill({ color: 0x000000, alpha: 0 }) // transparent
    this.hitAreaGraphic.eventMode = 'static'
    this.hitAreaGraphic.cursor = 'crosshair'
    this.addChild(this.hitAreaGraphic)

    // Setup brush rectangle
    this.addChild(this.brushRect)

    // Setup tooltip
    this.tooltip = new PixiTooltip()
    this.addChild(this.tooltip)

    // Bind events
    this.hitAreaGraphic.on('pointermove', this.onPointerMove.bind(this))
    this.hitAreaGraphic.on('pointerdown', this.onPointerDown.bind(this))
    this.hitAreaGraphic.on('pointerup', this.onPointerUp.bind(this))
    this.hitAreaGraphic.on('pointerupoutside', this.onPointerUp.bind(this))
    this.hitAreaGraphic.on('pointerover', this.onPointerOver.bind(this))

    this.sortableChildren = true
    this.brushRect.zIndex = 1000
  }
  setDimred(dimred: PixiDimred) {
    this.dimred = dimred
  }

  private onPointerDown(e: FederatedPointerEvent) {
    const pos = e.global
    this.dragStart = { x: pos.x, y: pos.y }
    this.dragEnd = null
    this.isDragging = true
    console.log('Brush start:', this.dragStart.x, this.dragStart.y)
  }

  private onPointerMove(e: FederatedPointerEvent) {
    const pos = e.global

    if (this.dimred) {
      const hovered = this.dimred.findPointAtGlobal(pos)
      if (hovered !== this.currentHovered) {
        if (this.currentHovered) this.currentHovered.emit('unhover')
        if (hovered?.dimredpoint) hovered.emit('hover', hovered.dimredpoint)
        this.currentHovered = hovered
      }
    }

    if (this.isDragging && this.dragStart) {
      this.dragEnd = { x: pos.x, y: pos.y }
      console.log('Brush move:', this.dragEnd.x, this.dragEnd.y)
      this.drawBrush()
    }
  }
  private onPointerUp(e: FederatedPointerEvent) {
    if (this.isDragging && this.dragStart && this.dragEnd) {
      const bounds = this.getBrushBounds()
      this.emit('brushend', bounds)
    }

    this.isDragging = false
    this.dragStart = null
    this.dragEnd = null
    this.brushRect.clear()
  }

  private drawBrush() {
    if (!this.dragStart || !this.dragEnd) return

    const x = Math.min(this.dragStart.x, this.dragEnd.x)
    const y = Math.min(this.dragStart.y, this.dragEnd.y)
    const w = Math.abs(this.dragEnd.x - this.dragStart.x)
    const h = Math.abs(this.dragEnd.y - this.dragStart.y)

    console.log('Brush rect:', x, y, w, h)

    this.brushRect.clear()
    this.brushRect
      .setStrokeStyle({ width: 1, color: 0xff00ff, alpha: 1 })
      .fill({ color: 0xff00ff, alpha: 0.2 })
      .rect(x, y, w, h).visible = true
  }

  private getBrushBounds(): Rectangle {
    if (!this.dragStart || !this.dragEnd) return new Rectangle(0, 0, 0, 0)
    const x = Math.min(this.dragStart.x, this.dragEnd.x)
    const y = Math.min(this.dragStart.y, this.dragEnd.y)
    const w = Math.abs(this.dragEnd.x - this.dragStart.x)
    const h = Math.abs(this.dragEnd.y - this.dragStart.y)
    return new Rectangle(x, y, w, h)
  }

  private onPointerOver(e: FederatedPointerEvent) {
    const dimred = this.parent?.children.find((child) => child instanceof PixiDimred) as
      | PixiDimred
      | undefined
    if (!dimred) return

    const hovered = dimred.findPointAtGlobal(e.global)
    if (hovered) {
      this.tooltip.show('ID:  + ${hovered.item_id}', hovered.x, hovered.y)
    } else {
      this.tooltip.hide()
    }
  }

  getTooltip(): PixiTooltip {
    return this.tooltip
  }
}
