import { PixiContainer } from '@/pixi/Base/PixiContainer'
import { Colors } from '@/config/Themes'
import { HoverableProvider } from '@/utils/HoverManager'
import { PixiDimredPoint } from '@/pixi/PixiDimredPoint'
import type { Projection } from '@/models/data'
import { Rectangle, PointData } from 'pixi.js'
import { ProjectionTransformer } from '@/utils/transformers/ProjectionTransformer'
import { CoordinateTransformer } from '@/utils/transformers/CoordinateTransformer'
import { PolygonUtils } from '@/utils/geometry/PolygonUtils'

export class PixiDimred extends PixiContainer implements HoverableProvider<PixiDimredPoint> {
  pixiDimredPoints: Map<string, PixiDimredPoint> = new Map()
  private highlightedFingerprintPoints: Set<string> = new Set()
  public detectRadius: number = 5

  constructor(projectedPoints: Projection[]) {
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
        pixiDimredPoint.setInFingerprint(true)
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
    // const numericIds = pointIds.map((id) => parseInt(id))
    // const numericIdSet = new Set(numericIds)

    this.pixiDimredPoints.forEach((point, id) => {
      if (pointIds.has(id)) {
        const color = pointColorMap[id.toString()]
        point.setInFingerprint(true, color)
      } else {
        // Dim other points
        point.setInFingerprint(false)
      }
    })
    this.highlightedFingerprintPoints = pointIds
  }

  clearHighlightedPoints(): void {
    this.pixiDimredPoints.forEach((point) => {
      point.setInFingerprint(false)
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
}
