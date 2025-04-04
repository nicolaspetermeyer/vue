import { PixiContainer } from '@/pixi/PixiContainer'
import { PixiGraphic } from '@/pixi/PixiGraphic'
import type { Fingerprint, Point } from '@/models/data'

// TODO: use Sprite instead of Graphic for performance
export class PixiDimredPoint extends PixiGraphic {
  private point: Point

  constructor(point: Point) {
    super()

    this.point = point
    this.drawPoint(5)
    // this.position.set(point.pos.x, point.pos.y)
  }

  drawPoint(radius: number) {
    console.log('Drawing point', this.point.item_id, radius)

    this.circle(0, 0, radius)
    this.fill(0xbb0000)
  }

  updatePosition(size: number) {
    console.log('Updating position', this.point)

    this.position.set(this.point.pos.x * size, this.point.pos.y * size)
  }
}
