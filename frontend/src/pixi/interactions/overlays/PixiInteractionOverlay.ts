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
import { PixiProjection } from '@/pixi/PixiProjection'
import { PixiApp } from '@/pixi/Base/PixiApp'

// Controllers
import { HoverManager } from '@/pixi/interactions/controllers/HoverManager'
import { ViewportController } from '@/pixi/interactions/controllers/ViewportController'
import {
  SelectionController,
  SelectionEvents,
  SelectionMode,
} from '@/pixi/interactions/controllers/SelectionController'

// Stores
import { useProjectionStore } from '@/stores/projectionStore'
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
    this.hitAreaGraphic.cursor = 'default'
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
    this.hitAreaGraphic.on('wheel', this.onWheel.bind(this))
  }

  registerMiniRing(ring: PixiAttributeRing): void {
    this.hoverManager.addProvider(ring)
  }

  unregisterMiniRing(ring: PixiAttributeRing): void {
    this.hoverManager.removeProvider(ring)
  }

  getHoverManager(): HoverManager {
    return this.hoverManager
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
    if (this.dimred) {
      let miniRingResult
      for (const [id, ring] of this.dimred.pixiGlyph.entries()) {
        if (ring.containsPoint(e.global)) {
          miniRingResult = { ring, id }
        }
      }
      // Handle right-click on mini ring (drill down)
      if (miniRingResult && e.button === 2) {
        this.handleDrillDown(miniRingResult.id)
        return
      }
      // Handle left-click on mini ring (selection)
      else if (miniRingResult) {
        const { id } = miniRingResult
        if (id) {
          this.handleMiniRingSelection(id)
        }
        return
      }
    }
    // Handle right-click on empty area (reset selection)
    if (e.button === 2) {
      if (this.dimred) {
        this.dimred.setSelection([])
        this.fingerprintStore.setSelection([])
        this.attributeRing?.clearPointRing('99')
      }
      return
    }
    // Handle regular left-click (normal selection)
    if (this.selectionController) {
      this.selectionController.handleTap(e)
    }
  }

  /**
   * Handle drill-down into a fingerprint when right-clicking on a mini ring
   * Creates a new projection that only includes points from this fingerprint
   */
  private handleDrillDown(fingerprintId: string): void {
    const fingerprint = this.fingerprintStore.fingerprints.find((fp) => fp.id === fingerprintId)
    if (!fingerprint) return

    useProjectionStore().drillDownToProjection(fingerprint.projectedPoints)
    useProjectionStore().setGlobalStats(fingerprint.localStats)
  }

  private handleMiniRingSelection(fingerprintId: string): void {
    const fingerprint = this.fingerprintStore.fingerprints.find((fp) => fp.id === fingerprintId)
    if (!fingerprint) return

    this.fingerprintStore.toggleSelectedFingerprint(fingerprint, this.parent)
  }

  private updateAttributeRingForPoint(point: PixiDimredPoint | null) {
    if (!this.attributeRing || !point) return
    const globalStats = useProjectionStore().globalStats

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

    this.attributeRing.setLocalRing('99', localStats, Colors.POINT_SELECT)
  }

  // Handle tap selection events from the selection controller
  private onTapSelect(position: PointData) {
    if (!this.dimred) return

    const point = this.dimred.findElementAtGlobal(position)
    if (point) {
      this.dimred.setSelection([point.dimredpoint.id])
      this.fingerprintStore.setSelection(this.dimred.getSelectedProjections())
      this.attributeRing?.clearPointRing('99')
      this.updateAttributeRingForPoint(point)
    } else if (this.attributeRing) {
      // Clear the attribute ring if no point is selected
    }
  }

  private onPointerDown(e: FederatedPointerEvent) {
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
  // Currently unused because masking to the inner cirlce excludes the attribute ring from hover
  // private isPointInMask(point: PointData): boolean {
  //   if (!this.maskBoundary) return true

  //   const localPoint = this.maskBoundary.toLocal(point)

  //   const centerX = 349
  //   const centerY = 349
  //   const radius = 349

  //   const dx = localPoint.x - centerX
  //   const dy = localPoint.y - centerY
  //   const distanceSquared = dx * dx + dy * dy

  //   return distanceSquared <= radius * radius
  // }

  private onPointerUp(e: FederatedPointerEvent) {
    if (this.viewportController && this.viewportController.isPanningActive()) {
      this.viewportController.handlePointerUp()
      this.cursor = 'default'
    } else if (this.selectionController) {
      this.selectionController.handlePointerUp()
    }
  }

  // Handle brush selection events from the selection controller
  private onBrushEnd(selectionArea: Rectangle | PointData[], mode: SelectionMode) {
    if (!this.dimred) return

    let selectedIds: string[] = []

    if (mode === SelectionMode.RECTANGLE) {
      selectedIds = this.dimred.getPointsInBounds(selectionArea as Rectangle)
    } else {
      selectedIds = this.dimred.getPointsInPolygon(selectionArea as PointData[])
    }

    const visibleSelectedIds = selectedIds.filter((id) => {
      const point = this.dimred?.pixiDimredPoints.get(id)
      return point && point.visible
    })

    this.dimred.setSelection(visibleSelectedIds)
    if (visibleSelectedIds.length > 0) {
      this.fingerprintStore.setSelection(this.dimred.getSelectedProjections())
    }
  }

  toggleSelectionMode() {
    if (this.selectionController) {
      const newMode = this.selectionController.toggleMode()
      this.hitAreaGraphic.cursor = newMode === SelectionMode.RECTANGLE ? 'default' : 'crosshair'
    }
  }

  /**
   * Handle keyboard events
   * @param e - Keyboard event
   */
  handleKeyDown(e: KeyboardEvent) {
    if (e.code === 'KeyA' && e.altKey) {
      // Toggle between rectangle and lasso selection modes
      this.toggleSelectionMode()
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
