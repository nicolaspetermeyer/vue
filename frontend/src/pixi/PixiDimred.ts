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
    const { centroid, localStats, id } = fingerprint
    if (!centroid || !localStats) return

    this.removeMiniRing(id)

    const miniRing = new PixiAttributeRing(stats, {
      mini: true,
      width: 50,
      height: 50,
      localStats,
      color,
    })
    miniRing.position.set(centroid.x - miniRing.width / 2, centroid.y - miniRing.height / 2)

    this.pixiGlyph.set(id, miniRing)
    this.addChild(miniRing)
    this.app.render()
  }

  // Add method to explicitly remove a mini ring
  removeMiniRing(fingerprintId: string): void {
    const ring = this.pixiGlyph.get(fingerprintId)
    if (ring) {
      this.removeChild(ring)
      this.pixiGlyph.delete(fingerprintId)
    }
  }

  // Method to update mini rings when data changes
  updateMiniRing(
    fingerprintId: string,
    stats: Record<string, { normMean?: number }>,
    color: number,
  ): void {
    const ring = this.pixiGlyph.get(fingerprintId)
    if (ring) {
      ring.setLocalStats(fingerprintId, stats, color)
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

  /**
   * Get points that are inside a polygon
   *
   * @param polygon - Array of points defining the selection polygon
   * @returns Array of point IDs that are inside the polygon
   */
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
      const dx = local.x - point.x
      const dy = local.y - point.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Match within a reasonable hover radius (e.g. 5 px)

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
    for (const [id, point] of this.pixiDimredPoints) {
      point.updatePointScale(inverseScale)
    }
  }

  setDetectRadius(radius: number) {
    this.detectRadius = radius
  }

  /**
   * Hide specific points from the visualization
   * @param indices Array of point indices to hide
   */
  hidePoints(indices: number[]): void {
    // Create a Set for faster lookups
    const hideSet = new Set(indices)

    // Hide each point at the specified indices
    Array.from(this.pixiDimredPoints.entries()).forEach(([id, point], index) => {
      if (hideSet.has(index)) {
        point.visible = false
      }
    })

    this.app.render()
  }

  /**
   * Show all points in the visualization
   */
  showAllPoints(): void {
    this.pixiDimredPoints.forEach((point) => {
      point.visible = true
    })

    this.app.render()
  }

  /**
   * Show specific points in the visualization
   * @param indices Array of point indices to show
   */
  filterPoints(indices: number[]): void {
    const showSet = new Set(indices)

    this.pixiDimredPoints.forEach((point) => {
      point.visible = false
    })

    // Show only points in filter
    Array.from(this.pixiDimredPoints.entries()).forEach(([id, point], index) => {
      if (showSet.has(index)) {
        point.visible = true
      }
    })

    this.app.render()
  }
}
