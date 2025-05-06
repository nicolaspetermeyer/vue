// Pixi Base Classes
import {
  Graphics,
  FederatedPointerEvent,
  FederatedWheelEvent,
  Rectangle,
  PointData,
  Circle,
} from 'pixi.js'
import { PixiContainer } from '@/pixi/Base/PixiContainer'

// Pixi Components
import { PixiTooltip } from './PixiTooltip'
import { PixiDimred } from '@/pixi/PixiDimred'
import { PixiDimredPoint } from '@/pixi/PixiDimredPoint'
import { PixiAttributeRing } from '@/pixi/PixiAttributeRing'

// Controllers
import { HoverManager } from '@/utils/HoverManager'
import { ViewportController } from '@/pixi/interactions/controllers/ViewportController'
import {
  SelectionController,
  SelectionEvents,
} from '@/pixi/interactions/controllers/SelectionController'

// Stores
import { useDataStore } from '@/stores/dataStore'
import { useFingerprintStore } from '@/stores/fingerprintStore'

// Utils
import { StatisticalNormalizer } from '@/utils/calculations/StatisticalNormalizer'
import { Colors } from '@/config/Themes'

export class PixiInteractionOverlay extends PixiContainer {
  private hitAreaGraphic: Graphics = new Graphics()
  private tooltip: PixiTooltip
  private dimred: PixiDimred | null = null
  private attributeRing: PixiAttributeRing | null = null
  private maskBoundary: Graphics | null = null
  private fingerprintStore = useFingerprintStore()
  private viewportController: ViewportController | null = null
  private selectionController: SelectionController | null = null
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

    this.eventMode = 'static'

    // Setup hit area for input
    this.hitAreaGraphic.rect(0, 0, width, height)
    this.hitAreaGraphic.fill({ color: 0x000000, alpha: 0 }) // transparent
    this.hitAreaGraphic.eventMode = 'static'
    this.hitAreaGraphic.cursor = 'crosshair'
    this.addChild(this.hitAreaGraphic)

    // Setup tooltip
    this.tooltip = new PixiTooltip()
    this.addChild(this.tooltip)

    // Create hover manager
    this.hoverManager = new HoverManager(this.tooltip)
    this.selectionController = new SelectionController({ container: this }, this.hoverManager)

    // Subscribe to selection events
    this.selectionController.on(SelectionEvents.BRUSH_END, this.onBrushEnd.bind(this))
    this.selectionController.on(SelectionEvents.TAP_SELECT, this.onTapSelect.bind(this))

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

    this.hoverManager.addProvider(dimred)

    this.viewportController = new ViewportController(
      this.dimred,
      { initialX: 270, initialY: 270 },
      this.onViewportChanged.bind(this),
    )

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
    this.hoverManager.addProvider(attributeRing)
  }

  private onPointerTap(e: FederatedPointerEvent) {
    if (e.button === 2) {
      if (this.dimred) {
        this.dimred.setSelection([])
        this.fingerprintStore.setSelection([])
        this.attributeRing?.clearPointStats('99')
      }
      return
    }
    if (this.selectionController) {
      this.selectionController.handleTap(e)
    }
  }

  private updateAttributeRingForPoint(point: PixiDimredPoint | null) {
    if (!this.attributeRing || !point) return
    const globalStats = useDataStore().globalStats

    const attributes: Record<string, number> = {}
    for (const [key, value] of Object.entries(point.dimredpoint.original)) {
      if (key.toLowerCase() === 'id') continue
      if (typeof value === 'number') {
        attributes[key] = value
      }
    }

    const normalizedValues = StatisticalNormalizer.normalizeAttributes(
      attributes,
      globalStats,
      'minmax',
    )

    const localStats: Record<string, { normMean?: number }> = {}
    for (const [key, value] of Object.entries(normalizedValues)) {
      localStats[key] = { normMean: value }
    }

    this.attributeRing.setLocalStats('99', localStats, Colors.POINT_SELECT)
  }

  // Handle tap selection events from the selection controller
  private onTapSelect(position: PointData) {
    if (!this.dimred) return

    const point = this.dimred.findElementAtGlobal(position)
    if (point) {
      this.dimred.setSelection([point.dimredpoint.id])
      this.fingerprintStore.setSelection(this.dimred.getSelectedProjections())
      this.attributeRing?.clearPointStats('99')
      this.updateAttributeRingForPoint(point)
    } else if (this.attributeRing) {
      // Clear the attribute ring if no point is selected
    }
  }

  private onPointerDown(e: FederatedPointerEvent) {
    const pos = this.toLocal(e.global)
    // Detect if we should pan or drag-select
    if (e.buttons === 1 && e.ctrlKey && this.viewportController) {
      // Left button + ctrl for panning
      this.viewportController.handlePointerDown(e)
      this.cursor = 'grab'
      this.hoverManager.clearHover()
    } else if (this.selectionController) {
      // Normal drag behavior (selection)
      this.selectionController.handlePointerDown(e)
    }
  }

  private onPointerMove(e: FederatedPointerEvent) {
    // Handle panning
    if (this.viewportController && this.viewportController.isPanningActive()) {
      this.viewportController.handlePointerMove(e)
      return
    }

    // Handle selection
    if (this.selectionController && this.selectionController.isSelecting()) {
      this.selectionController.handlePointerMove(e)
      return
    }

    // Standard hover behavior (when not panning or selecting)

    this.hoverManager.handlePointerEvent(e)
  }

  // Check if the point is within the mask boundary
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
    if (this.viewportController && this.viewportController.isPanningActive()) {
      this.viewportController.handlePointerUp()
      this.cursor = 'crosshair'
    } else if (this.selectionController) {
      this.selectionController.handlePointerUp()
    }
  }

  // Handle brush selection events from the selection controller
  private onBrushEnd(bounds: Rectangle) {
    if (!this.dimred) return
    const selected = this.dimred.getPointsInBounds(bounds)

    this.dimred.setSelection(selected)
    if (selected.length > 0) {
      this.fingerprintStore.setSelection(this.dimred.getSelectedProjections())
    }
  }

  getTooltip(): PixiTooltip {
    return this.tooltip
  }

  private onWheel(e: FederatedWheelEvent) {
    if (!this.viewportController) return
    this.viewportController.handleWheel(e)
  }

  /**
   * Callback when viewport scale changes
   */
  private onViewportChanged(scale: number): void {
    if (!this.dimred) return

    // Update point detection radius inversely to scale
    this.dimred.setDetectRadius((5 * 1) / scale)

    // Update point sizes for constant visual size
    this.updatePointSizes(scale)
  }

  private updatePointSizes(scale: number) {
    if (!this.dimred) return

    // Calculate inverse scale to maintain constant visual size
    const inverseScale = 1 / scale

    this.dimred.updateAllPointScales(inverseScale)
  }

  // Method to reset zoom and pan
  resetView() {
    if (this.viewportController) {
      this.viewportController.resetView(270, 270, 1)
    }
  }
  // Clean up resources when component is destroyed
  destroy() {
    super.destroy()

    if (this.selectionController) {
      this.selectionController.destroy()
      this.selectionController = null
    }

    if (this.viewportController) {
      // No destroy method on ViewportController yet
      this.viewportController = null
    }
  }
}
