import { PixiContainer } from '@/pixi/PixiContainer'
import { PixiGraphic } from '@/pixi/PixiGraphic'
import type { Fingerprint, Point } from '@/models/data'

// TODO: use Sprite instead of Graphic for performance
export class PixiDimredPoint extends PixiGraphic {
  private point: Point
  private _isSelected: boolean = false

  constructor(point: Point) {
    super()

    this.point = point
    this.drawPoint(5)
    // this.position.set(point.pos.x, point.pos.y)

    this.eventMode = 'static'
    this.cursor = 'pointer'

    this.on('pointerover', () => {
      this.emit('hover', this.point)
    })
    this.on('pointerout', () => {
      this.emit('unhover', this.point)
    })
  }

  drawPoint(radius: number) {
    //console.log('Drawing point', this.point.item_id, radius)
    this.clear()
    this.circle(0, 0, radius)
    this.fill(this._isSelected ? 0x0077ff : 0xbb0000)
    this.setStrokeStyle({ width: 1, color: this._isSelected ? 0xffffff : 0x000000 })
    this.stroke()
  }

  updatePosition(size: number) {
    //console.log('Updating position', this.point)

    this.position.set(this.point.pos.x * size, this.point.pos.y * size)
  }

  setSelected(selected: boolean) {
    if (this._isSelected !== selected) {
      this._isSelected = selected
      this.drawPoint(5)
    }
  }

  isSelected(): boolean {
    return this._isSelected
  }

  get dimredpoint(): Point {
    if (!this.point) {
      throw new Error('DimredPoint accessed before initialization')
    }
    return this.point
  }
}
