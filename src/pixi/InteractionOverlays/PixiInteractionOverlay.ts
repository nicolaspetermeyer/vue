import { Graphics, FederatedPointerEvent, FederatedWheelEvent, Rectangle, PointData } from 'pixi.js'
import { PixiContainer } from '@/pixi/Base/PixiContainer'
import { PixiTooltip } from './PixiTooltip'
import { PixiDimred } from '@/pixi/PixiDimred'
import { PixiDimredPoint } from '@/pixi/PixiDimredPoint'
import { PixiAttributeRing } from '@/pixi/PixiAttributeRing'
import { HoverManager } from '@/utils/HoverManager'

export class PixiInteractionOverlay extends PixiContainer {
  private hitAreaGraphic: Graphics = new Graphics()
  private tooltip: PixiTooltip
  private brushRect: Graphics = new Graphics()
  private dragStart: PointData | null = null
  private dragEnd: PointData | null = null
  private isDragging = false
  private dimred: PixiDimred | null = null
  private attributeRing: PixiAttributeRing | null = null

  // pan and zoom variables
  private isPanning = false
  private lastPanPosition: PointData | null = null
  private minZoom = 0.1
  private maxZoom = 10
  private zoomSpeed = 0.1

  private hoverManager: HoverManager

  constructor(width: number, height: number) {
    super({
      width,
      height,
      background: null,
      positionAbsolute: true,
    })

    this.sortableChildren = true
    this.zIndex = 1000
    this.hitAreaGraphic.zIndex = 15
    this.eventMode = 'static'

    // Setup hit area for input
    this.hitAreaGraphic.rect(0, 0, width, height)
    this.hitAreaGraphic.fill({ color: 0x000000, alpha: 0 }) // transparent
    this.hitAreaGraphic.eventMode = 'static'
    this.hitAreaGraphic.cursor = 'crosshair'
    this.addChild(this.hitAreaGraphic)

    // Setup brush rectangle
    this.brushRect.zIndex = 20
    this.addChild(this.brushRect)

    // Setup tooltip
    this.tooltip = new PixiTooltip()
    this.addChild(this.tooltip)

    // Create hover manager
    this.hoverManager = new HoverManager(this.tooltip)

    // Bind events
    this.hitAreaGraphic.on('pointermove', this.onPointerMove.bind(this))
    this.hitAreaGraphic.on('pointerdown', this.onPointerDown.bind(this))
    this.hitAreaGraphic.on('pointerup', this.onPointerUp.bind(this))
    this.hitAreaGraphic.on('pointerupoutside', this.onPointerUp.bind(this))
    this.hitAreaGraphic.on('pointertap', this.onPointerTap.bind(this))

    // Add wheel event listener for zoom
    this.hitAreaGraphic.on('wheel', this.onWheel.bind(this))
  }
  setDimred(dimred: PixiDimred) {
    if (this.dimred) {
      this.hoverManager.removeProvider(this.dimred)
    }
    this.dimred = dimred
    this.dimred.zIndex = 5
    this.hoverManager.addProvider(dimred)
  }

  setAttributeRing(attributeRing: PixiAttributeRing) {
    if (this.attributeRing) {
      this.hoverManager.removeProvider(this.attributeRing)
    }
    this.attributeRing = attributeRing
    this.attributeRing.zIndex = 10
    this.hoverManager.addProvider(attributeRing)
  }

  private onPointerTap(e: FederatedPointerEvent) {
    if (!this.dimred) return

    const global = e.global
    const point = this.dimred.findElementAtGlobal(global)

    if (point) {
      this.dimred.setSelection([point.dimredpoint.id])
    }
  }

  private onPointerDown(e: FederatedPointerEvent) {
    const pos = this.toLocal(e.global)
    // Detect if we should pan or drag-select
    if (e.buttons === 1 && e.ctrlKey) {
      // Left button + ctrl for panning
      this.isPanning = true
      this.lastPanPosition = { x: pos.x, y: pos.y }
      this.cursor = 'grab'
    } else {
      // Normal drag behavior (selection)
      this.dragStart = { x: pos.x, y: pos.y }
      this.dragEnd = null
      this.isDragging = true

      this.hoverManager.clearHover()
    }
  }

  private onPointerMove(e: FederatedPointerEvent) {
    const pos = this.toLocal(e.global)

    // Handle panning
    if (this.isPanning && this.lastPanPosition && this.dimred) {
      const dx = pos.x - this.lastPanPosition.x
      const dy = pos.y - this.lastPanPosition.y

      this.dimred.position.x += dx
      this.dimred.position.y += dy

      this.lastPanPosition = { x: pos.x, y: pos.y }
      return
    }

    // Standard hover behavior
    if (!this.isPanning && !this.isDragging) {
      this.hoverManager.handlePointerEvent(e)
    }

    // drag selection logic
    if (this.isDragging && this.dragStart) {
      this.dragEnd = { x: pos.x, y: pos.y }
      this.drawBrush()
    }
  }

  private onPointerUp(e: FederatedPointerEvent) {
    if (this.isPanning) {
      // End panning mode
      this.isPanning = false
      this.lastPanPosition = null
    } else if (this.isDragging && this.dragStart && this.dragEnd) {
      const bounds = this.getBrushBounds()
      this.emit('brushend', bounds)
    }

    this.isDragging = false
    this.dragStart = null
    this.dragEnd = null
    this.brushRect.clear()

    this.hoverManager.clearHover()
  }

  private drawBrush() {
    if (!this.dragStart || !this.dragEnd) return

    const x = Math.min(this.dragStart.x, this.dragEnd.x)
    const y = Math.min(this.dragStart.y, this.dragEnd.y)
    const w = Math.abs(this.dragEnd.x - this.dragStart.x)
    const h = Math.abs(this.dragEnd.y - this.dragStart.y)

    this.brushRect.clear()
    this.brushRect
      .setStrokeStyle({ width: 1, color: 0xff00ff, alpha: 1 })
      .fill({ color: 0xff00ff, alpha: 0.2 })
      .rect(x, y, w, h)
      .fill()
      .stroke()
  }

  private getBrushBounds(): Rectangle {
    if (!this.dragStart || !this.dragEnd) return new Rectangle(0, 0, 0, 0)
    const x = Math.min(this.dragStart.x, this.dragEnd.x)
    const y = Math.min(this.dragStart.y, this.dragEnd.y)
    const w = Math.abs(this.dragEnd.x - this.dragStart.x)
    const h = Math.abs(this.dragEnd.y - this.dragStart.y)

    // Transform the top-left and bottom-right corners to global space
    const topLeft = this.toGlobal({ x: x, y: y })
    const bottomRight = this.toGlobal({ x: x + w, y: y + h })

    const globalX = Math.min(topLeft.x, bottomRight.x)
    const globalY = Math.min(topLeft.y, bottomRight.y)
    const globalW = Math.abs(bottomRight.x - topLeft.x)
    const globalH = Math.abs(bottomRight.y - topLeft.y)

    return new Rectangle(globalX, globalY, globalW, globalH)
  }

  getTooltip(): PixiTooltip {
    return this.tooltip
  }

  // handle zooming with the mouse wheel
  private onWheel(e: FederatedWheelEvent) {
    if (!this.dimred) return

    e.preventDefault?.()

    // Get the mouse position relative to the stage
    const mousePosition = this.toLocal(e.global)

    // Calculate the position before zoom
    const worldPos = {
      x: (mousePosition.x - this.dimred.position.x) / this.dimred.scale.x,
      y: (mousePosition.y - this.dimred.position.y) / this.dimred.scale.y,
    }

    // Calculate zoom factor based on wheel delta
    // Normalize wheel delta across browsers
    const delta = e.deltaY > 0 ? -1 : 1
    const zoomFactor = 1 + delta * this.zoomSpeed

    // Calculate new scale, clamped to min/max
    const newScaleX = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, this.dimred.scale.x * zoomFactor),
    )
    const newScaleY = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, this.dimred.scale.y * zoomFactor),
    )

    // Apply new scale
    this.dimred.scale.set(newScaleX, newScaleY)

    // Calculate the position after zoom
    const newPos = {
      x: mousePosition.x - worldPos.x * newScaleX,
      y: mousePosition.y - worldPos.y * newScaleY,
    }

    // Apply position to zoom around mouse position
    this.dimred.position.set(newPos.x, newPos.y)
  }

  // Method to reset zoom and pan
  resetView() {
    if (!this.dimred) return

    // Reset scale and position
    this.dimred.scale.set(1, 1)

    // Center the dimred in the container
    this.dimred.position.x = (this.width - this.dimred.width) / 2
    this.dimred.position.y = (this.height - this.dimred.height) / 2
  }
}
