import { PixiContainer } from '@/pixi/PixiContainer'
import { PixiText } from '@/pixi/PixiText'
import { PixiGraphic } from '@/pixi/PixiGraphic'
import { PixiDimredPoint } from '@/pixi/PixiDimredPoint'
import type { Fingerprint, Point, Position } from '@/models/data'

export class PixiDimred extends PixiContainer {
  pixiDimredPoints: Map<number, PixiDimredPoint> = new Map()

  constructor(points: Point[]) {
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

    this.updatePoints(points)

    // this.applyLayout()
  }

  getOrCreatePoint(point: Point): PixiDimredPoint {
    const id = point.item_id
    if (!this.pixiDimredPoints.has(id)) {
      const newPoint = new PixiDimredPoint(point)
      //console.log('PixiDimred -- Adding new point', id, newPoint)
      this.pixiDimredPoints.set(id, newPoint)
      this.addChild(newPoint)
    }
    return this.pixiDimredPoints.get(id)!
  }

  updatePoints(points: Point[]) {
    //console.log('PixiDimred -- Updating points')
    if (points.length === 0) return

    // Compute DR space bounding box
    const xs = points.map((p) => p.pos.x)
    const ys = points.map((p) => p.pos.y)

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1

    // Normalize points to [0, 1] range, then scale to layout size
    const normPoints = points.map((p) => ({
      ...p,
      pos: {
        x: (p.pos.x - minX) / rangeX,
        y: (p.pos.y - minY) / rangeY,
      },
    }))

    normPoints.forEach((point: Point) => {
      const pixiDimredPoint = this.getOrCreatePoint(point)
      pixiDimredPoint.updatePosition(this.layoutProps.width)
    })
    // Force redraw by toggling tint (otherwise for strange reasons no rerendering happens)
    this.tint ^= 1
    this.tint ^= 1
  }
}
