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

export class PixiDimred extends PixiContainer implements HoverableProvider<PixiDimredPoint> {
  pixiDimredPoints: Map<string, PixiDimredPoint> = new Map()
  private highlightedFingerprintPoints: Set<string> = new Set()
  public detectRadius: number = 5
  app: PixiApp

  pixiGlyph: Map<string, PixiAttributeRing> = new Map()

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

    this.hidePointsById(ids)
    if (!centroid || !localStats) return

    this.removeMiniRing(fingerprint)

    const miniRing = new PixiAttributeRing(stats, {
      mini: true,
      width: 50,
      height: 50,
      localStats,
      color,
      fingerprintId: id,
    })

    miniRing.position.set(centroid.x - miniRing.width / 2, centroid.y - miniRing.height / 2)

    this.pixiGlyph.set(id, miniRing)
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
    const ring = this.pixiGlyph.get(fingerprint.id)
    if (!ring) return
    const ids = fingerprint.projectedPoints.map((point) => point.id)

    this.removeChild(ring)
    this.pixiGlyph.delete(fingerprint.id)
    this.showPointsById(ids)
    this.app.render()
  }

  // Method to update mini rings when data changes
  updateMiniRing(
    fingerprintId: string,
    stats: Record<string, { normMean?: number }>,
    color: number,
  ): void {
    const ring = this.pixiGlyph.get(fingerprintId)
    if (ring) {
      ring.setLocalRing(fingerprintId, stats, color)
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

      if (this.highlightedFingerprintPoints.has(point.id)) {
        pixiDimredPoint.setFingerprintColor(true)
      }
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
    const selectedSet = new Set(selectedIds)
    this.pixiDimredPoints.forEach((point, id) => {
      point.setSelected(selectedSet.has(id))
    })
  }

  getSelectedProjections(): Projection[] {
    const selected: Projection[] = []
    this.pixiDimredPoints.forEach((point) => {
      if (point.isSelected()) {
        selected.push(point.dimredpoint)
      }
    })
    return selected
  }

  // highlight points that belong to the selected fingerprint
  highlightFingerprintPoints(pointColorMap: Record<string, number>): void {
    this.clearHighlightedPoints()

    const pointIds = new Set(Object.keys(pointColorMap))

    this.pixiDimredPoints.forEach((point, id) => {
      if (pointIds.has(id)) {
        const color = pointColorMap[id]
        point.setFingerprintColor(true, color)
      } else {
        // Dim other points
        point.setFingerprintColor(false)
      }
    })
    this.highlightedFingerprintPoints = pointIds
  }

  clearHighlightedPoints(): void {
    this.pixiDimredPoints.forEach((point) => {
      point.setFingerprintColor(false)
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

  showPointsById(pointIds: string[]): void {
    pointIds.forEach((id) => {
      const point = this.pixiDimredPoints.get(id)
      if (point) {
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
    const showSet = new Set(indices)

    this.pixiDimredPoints.forEach((point) => {
      point.visible = false
    })

    Array.from(this.pixiDimredPoints.entries()).forEach(([id, point], index) => {
      if (showSet.has(index)) {
        point.visible = true
      }
    })

    this.app.render()
  }

  getVisiblePoints(): PixiDimredPoint[] {
    return Array.from(this.pixiDimredPoints.values()).filter((point) => point.visible)
  }
}
