import { PixiContainer } from '@/pixi/PixiContainer'
import { HoverableProvider } from '@/utils/HoverManager'
import { PixiDimredPoint } from '@/pixi/PixiDimredPoint'
import type { Projection } from '@/models/data'
import { Rectangle, PointData } from 'pixi.js'

export class PixiDimred extends PixiContainer implements HoverableProvider<PixiDimredPoint> {
  pixiDimredPoints: Map<number, PixiDimredPoint> = new Map()

  constructor(projectedPoints: Projection[]) {
    super({
      width: 460,
      height: 460,
      background: 0xe1f7e9,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      positionAbsolute: true,
      layout: 'flexColumn',
      justifyContent: 'center',
      alignItems: 'center',
    })

    this.updatePoints(projectedPoints)

    // this.applyLayout()
  }

  getOrCreatePoint(projectedPoints: Projection): PixiDimredPoint {
    const id = projectedPoints.id
    if (!this.pixiDimredPoints.has(id)) {
      const newPoint = new PixiDimredPoint(projectedPoints)
      //console.log('PixiDimred -- Adding new point', id, newPoint)
      this.pixiDimredPoints.set(id, newPoint)

      this.addChild(newPoint)
    }
    return this.pixiDimredPoints.get(id)!
  }

  updatePoints(projectedPoints: Projection[]) {
    console.log('PixiDimred -- Updating projectedPoints')
    if (projectedPoints.length === 0) return

    // Compute DR space bounding box
    const xs = projectedPoints.map((p) => p.pos.x)
    const ys = projectedPoints.map((p) => p.pos.y)

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1

    // Normalize projectedPoints to [0, 1] range, then scale to layout size
    const normPoints = projectedPoints.map((p) => ({
      ...p,
      pos: {
        x: (p.pos.x - minX) / rangeX,
        y: (p.pos.y - minY) / rangeY,
      },
    }))

    normPoints.forEach((point: Projection) => {
      const pixiDimredPoint = this.getOrCreatePoint(point)
      pixiDimredPoint.updatePosition(this.layoutProps.width)
    })
    // Force redraw by toggling tint (otherwise for strange reasons no rerendering happens)
    this.tint ^= 1
    this.tint ^= 1
  }

  getPointsInBounds(bounds: Rectangle): number[] {
    const selected: number[] = []
    this.pixiDimredPoints.forEach((point, id) => {
      const global = point.getGlobalPosition()
      if (bounds.contains(global.x, global.y)) {
        selected.push(id)
      }
    })
    return selected
  }

  findElementAtGlobal(global: PointData): PixiDimredPoint | null {
    const local = this.toLocal(global)

    for (const point of this.pixiDimredPoints.values()) {
      const dx = local.x - point.x
      const dy = local.y - point.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Match within a reasonable hover radius (e.g. 5 px)
      if (distance <= 5) return point
    }
    return null
  }

  setSelection(selectedIds: number[]) {
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
}
