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
      background: 0xdddddd,
      positionAbsolute: true,
    })

    this.updatePoints(points)

    // this.applyLayout()
  }

  getOrCreatePoint(point: Point): PixiDimredPoint {
    const id = point.item_id
    if (!this.pixiDimredPoints.has(id)) {
      const newPoint = new PixiDimredPoint(point)
      console.log('PixiDimred -- Adding new point', id, newPoint)
      this.pixiDimredPoints.set(id, newPoint)
      this.addChild(newPoint)
    }
    return this.pixiDimredPoints.get(id)!
  }

  updatePoints(points: Point[]) {
    console.log('PixiDimred -- Updating points')
    points.forEach((point: Point) => {
      const pixiDimredPoint = this.getOrCreatePoint(point)
      pixiDimredPoint.updatePosition(this.layoutProps.width)
    })
    // Force redraw by toggling tint (otherwise for strange reasons no rerendering happens)
    this.tint ^= 1
    this.tint ^= 1
  }
}
