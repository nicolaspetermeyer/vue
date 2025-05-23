import { PixiContainer } from '@/pixi/Base/PixiContainer'
import { Colors } from '@/config/Themes'
import { HoverableProvider } from '@/pixi/interactions/controllers/HoverManager'
import { PixiDimredPoint } from '@/pixi/PixiDimredPoint'
import type { Projection, FeatureStats, Fingerprint } from '@/models/data'
import { Rectangle, PointData } from 'pixi.js'
import { ProjectionTransformer } from '@/utils/transformers/ProjectionTransformer'
import { CoordinateTransformer } from '@/utils/transformers/CoordinateTransformer'
import { PolygonUtils } from '@/utils/geometry/PolygonUtils'
import { PixiAttributeRing } from './PixiAttributeRing'
import { PixiApp } from '@/pixi/Base/PixiApp'
import { PixiInteractionOverlay } from '@/pixi/interactions/overlays/PixiInteractionOverlay'
import { usePixiUIStore } from '@/stores/pixiUIStore'

export class PixiDimred extends PixiContainer implements HoverableProvider<PixiDimredPoint> {
  pixiDimredPoints: Map<string, PixiDimredPoint> = new Map()
  public detectRadius: number = 5
  app: PixiApp
  private pixiUIStore = usePixiUIStore()

  constructor(projectedPoints: Projection[], app: PixiApp) {
    super({
      width: 460,
      height: 460,
      background: Colors.CANVAS_BACKGROUND,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      positionAbsolute: true,
      layout: 'flexColumn',
      justifyContent: 'center',
      alignItems: 'center',
    })

    this.updatePoints(projectedPoints)
    this.app = app
  }

  getOrCreatePoint(projectedPoints: Projection): PixiDimredPoint {
    const id = projectedPoints.id
    if (!this.pixiDimredPoints.has(id)) {
      const newPoint = new PixiDimredPoint(projectedPoints)
      this.pixiDimredPoints.set(id, newPoint)

      this.addChild(newPoint)
    }
    return this.pixiDimredPoints.get(id)!
  }

  addMiniRingForFingerprint(
    fingerprint: Fingerprint,
    color: number,
    stats: Record<string, FeatureStats>,
  ) {
    const { centroid, localStats, id, projectedPoints } = fingerprint
    const ids = projectedPoints.map((point) => point.id)

    if (!centroid || !localStats) return

    this.hidePointsById(ids)
    this.pixiUIStore.addMiniRing(id, centroid, color, localStats)

    const miniRing = new PixiAttributeRing(stats, {
      mini: true,
      width: 50,
      height: 50,
      localStats,
      color,
      fingerprintId: id,
    })

    miniRing.eventMode = 'static'
    miniRing.cursor = 'pointer'

    miniRing.position.set(centroid.x - miniRing.width / 2, centroid.y - miniRing.height / 2)

    this.addChild(miniRing)

    const projectionContainer = (this.app.stage.children[0] as PixiContainer)
      .children[0] as PixiContainer

    const interactionOverlay = projectionContainer.children.find(
      (c) => c.constructor.name === 'PixiInteractionOverlay',
    ) as PixiInteractionOverlay

    if (interactionOverlay) {
      interactionOverlay.registerMiniRing(miniRing)
    }

    this.app.render()
  }

  removeMiniRing(fingerprint: Fingerprint): void {
    console.log('Removing mini ring for fingerprint:', fingerprint.id)

    const children = this.children.filter(
      (child) =>
        child instanceof PixiAttributeRing &&
        (child as PixiAttributeRing).getFingerprint() === fingerprint.id,
    )

    if (children.length > 0) {
      for (const child of children) {
        this.removeChild(child)
      }
    }

    // Remove from store
    this.pixiUIStore.removeMiniRing(fingerprint.id)

    // Show the points again
    const ids = fingerprint.projectedPoints.map((point) => point.id)
    this.showPointsById(ids)

    this.app.render()
  }

  // Method to update mini rings when data changes (future use for child rings?)
  updateMiniRing(
    fingerprintId: string,
    stats: Record<string, { normMean?: number }>,
    color: number,
  ): void {
    // Update store data
    const miniRing = this.pixiUIStore.miniRings.get(fingerprintId)
    if (miniRing) {
      miniRing.stats = stats
      miniRing.color = color
    }

    // Update visuals
    const ringComponents = this.children.filter(
      (child) =>
        child instanceof PixiAttributeRing &&
        (child as PixiAttributeRing).getFingerprint() === fingerprintId,
    )

    for (const ring of ringComponents) {
      if (ring instanceof PixiAttributeRing) {
        ring.setLocalRing(fingerprintId, stats, color)
      }
    }
  }

  updatePoints(projectedPoints: Projection[]) {
    if (projectedPoints.length === 0) return

    const normPoints = ProjectionTransformer.normalizeToSize(
      projectedPoints,
      this.width,
      this.height,
    )

    normPoints.forEach((point) => {
      const pixiDimredPoint = this.getOrCreatePoint(point)
      pixiDimredPoint.dimredpoint.pos = point.pos
      pixiDimredPoint.position.set(point.pos.x, point.pos.y)
      pixiDimredPoint.updateVisualState()
    })
  }

  getPointsInBounds(bounds: Rectangle): string[] {
    const localBounds = CoordinateTransformer.globalToLocalRect(bounds, this)

    return Array.from(this.pixiDimredPoints.values())
      .filter((point) => localBounds.contains(point.x, point.y))
      .map((point) => point.getId())
  }

  getPointsInPolygon(polygon: PointData[]): string[] {
    // Convert global polygon points to local coordinates
    const localPolygon = polygon.map((point) => this.toLocal(point))

    return Array.from(this.pixiDimredPoints.values())
      .filter((point) => PolygonUtils.isPointInPolygon(point.position, localPolygon))
      .map((point) => point.getId())
  }

  findElementAtGlobal(global: PointData): PixiDimredPoint | null {
    const local = this.toLocal(global)

    for (const point of this.pixiDimredPoints.values()) {
      if (!point.visible) continue
      const dx = local.x - point.x
      const dy = local.y - point.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Match within a reasonable hover radius
      if (distance <= this.detectRadius) return point
    }
    return null
  }

  setSelection(selectedIds: string[]) {
    this.pixiUIStore.selectPoints(selectedIds)

    this.pixiDimredPoints.forEach((point) => {
      point.updateVisualState()
    })
  }

  getSelectedProjections(): Projection[] {
    const selected: Projection[] = []

    this.pixiDimredPoints.forEach((point) => {
      if (this.pixiUIStore.isPointSelected(point.dimredpoint.id)) {
        selected.push(point.dimredpoint)
      }
    })

    return selected
  }

  // highlight points that belong to the selected fingerprint
  highlightFingerprintPoints(pointColorMap: Record<string, number>): void {
    this.pixiUIStore.highlightPoints(pointColorMap)

    this.pixiDimredPoints.forEach((point) => {
      point.updateVisualState()
    })
  }

  clearHighlightedPoints(): void {
    this.pixiUIStore.clearHighlightedPoints()

    this.pixiDimredPoints.forEach((point) => {
      point.updateVisualState()
    })
  }

  //  update scale
  updateAllPointScales(inverseScale: number) {
    for (const point of this.pixiDimredPoints.values()) {
      point.updatePointScale(inverseScale)
    }
  }

  setDetectRadius(radius: number) {
    this.detectRadius = radius
  }

  hidePointsById(ids: string[]): void {
    const hideSet = new Set<string>(ids)

    this.pixiDimredPoints.forEach((point, id) => {
      if (hideSet.has(id)) {
        point.visible = false
      }
    })

    this.app.render()
  }

  showPointsById(ids: string[]): void {
    const showSet = new Set<string>(ids)

    this.pixiDimredPoints.forEach((point, id) => {
      if (showSet.has(id)) {
        point.visible = true
      }
    })

    this.app.render()
  }

  showAllPoints(): void {
    this.pixiDimredPoints.forEach((point) => {
      point.visible = true
    })

    this.app.render()
  }

  filterPoints(indices: number[]): void {
    this.pixiDimredPoints.forEach((point) => {
      point.visible = false
    })

    const points = Array.from(this.pixiDimredPoints.values())
    for (const index of indices) {
      if (index >= 0 && index < points.length) {
        points[index].visible = true
      }
    }

    this.app.render()
  }

  getVisiblePoints(): PixiDimredPoint[] {
    return Array.from(this.pixiDimredPoints.values()).filter((point) => point.visible)
  }
}
