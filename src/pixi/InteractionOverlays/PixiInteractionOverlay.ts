import {
  Graphics,
  FederatedPointerEvent,
  FederatedWheelEvent,
  Rectangle,
  PointData,
  Circle,
} from 'pixi.js'
import { PixiContainer } from '@/pixi/Base/PixiContainer'
import { PixiTooltip } from './PixiTooltip'
import { PixiDimred } from '@/pixi/PixiDimred'

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
  private maskBoundary: Graphics | null = null

  // pan and zoom variables
  private isPanning = false
  private lastPanPosition: PointData | null = null
  private minZoom = 0.1
  private maxZoom = 10
  private zoomSpeed = 0.1

  // Track viewport transform
  private viewportScale: number = 1
  private viewportX = 0
  private viewportY = 0

  // Keep track of base point size for constant-size rendering
  private basePointSize = 5

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

    // Initialize viewport position to center the dimred
    this.resetView()

    if (this.dimred.mask instanceof Graphics) {
      this.maskBoundary = this.dimred.mask as Graphics
      this.maskBoundary.hitArea = new Circle(350, 350, 350)
    }
  }

  setAttributeRing(attributeRing: PixiAttributeRing) {
    if (this.attributeRing) {
      this.hoverManager.removeProvider(this.attributeRing)
    }
    this.attributeRing = attributeRing
    this.attributeRing.zIndex = 10
    this.hoverManager.addProvider(attributeRing)
  }

  // Transform a screen position to world position
  private screenToWorld(screenPos: PointData): PointData {
    return {
      x: (screenPos.x - this.viewportX) / this.viewportScale,
      y: (screenPos.y - this.viewportY) / this.viewportScale,
    }
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

      // Update viewport position
      this.viewportX += dx
      this.viewportY += dy
      this.applyViewportTransform()

      this.lastPanPosition = { x: pos.x, y: pos.y }
      return
    }

    // Standard hover behavior
    if (!this.isPanning && !this.isDragging) {
      if (this.isPointInMask(e.global)) this.hoverManager.handlePointerEvent(e)
    } else {
      this.hoverManager.clearHover()
    }

    // drag selection logic
    if (this.isDragging && this.dragStart) {
      this.dragEnd = { x: pos.x, y: pos.y }
      this.drawBrush()
    }
  }

  private isPointInMask(point: PointData): boolean {
    if (!this.maskBoundary) return true

    const localPoint = this.maskBoundary.toLocal(point)

    const centerX = 349
    const centerY = 349
    const radius = 349

    const dx = localPoint.x - centerX
    const dy = localPoint.y - centerY
    const distanceSquared = dx * dx + dy * dy

    return distanceSquared <= radius * radius
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

    this.brushRect
      .clear()
      .rect(x, y, w, h)
      .fill({ color: 0xff00ff, alpha: 0.2 })
      .stroke({ width: 1, color: 0xff00ff })
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

  private onWheel(e: FederatedWheelEvent) {
    if (!this.dimred) return

    e.preventDefault?.()

    // Get the mouse position relative to the stage
    const mouseScreenPos = this.toLocal(e.global)

    // Convert screen position to world position before zoom
    const mouseWorldPos = this.screenToWorld(mouseScreenPos)

    // Calculate the position before zoom
    const worldPos = {
      x: (mouseScreenPos.x - this.dimred.position.x) / this.dimred.scale.x,
      y: (mouseScreenPos.y - this.dimred.position.y) / this.dimred.scale.y,
    }

    // Calculate zoom factor based on wheel delta
    const delta = e.deltaY > 0 ? -1 : 1
    const zoomFactor = 1 + delta * this.zoomSpeed

    // Calculate new scale, clamped to min/max
    const newScale = Math.max(this.minZoom, Math.min(this.maxZoom, this.viewportScale * zoomFactor))

    this.viewportScale = newScale

    // Adjust viewport position to keep mouse position fixed
    this.viewportX = mouseScreenPos.x - mouseWorldPos.x * newScale
    this.viewportY = mouseScreenPos.y - mouseWorldPos.y * newScale
    // Adjust hover detection radius to scale with zoom
    this.dimred.setDetectRadius((5 * 1) / this.viewportScale)
    this.applyViewportTransform()
  }

  private applyViewportTransform() {
    if (!this.dimred) return

    // Position and scale the dimred container based on viewport transform
    this.dimred.position.set(this.viewportX, this.viewportY)
    this.dimred.scale.set(this.viewportScale, this.viewportScale)

    this.updatePointSizes()
  }

  private updatePointSizes() {
    if (!this.dimred) return

    // Calculate inverse scale to maintain constant visual size
    const inverseScale = 1 / this.viewportScale

    this.dimred.updateAllPointScales(inverseScale)
  }

  // Method to reset zoom and pan
  resetView() {
    if (!this.dimred) return

    // Reset viewport state
    this.viewportScale = 1

    // Center the dimred in the container
    this.viewportX = 270
    this.viewportY = 270

    // Apply transforms
    this.applyViewportTransform()
  }
}
