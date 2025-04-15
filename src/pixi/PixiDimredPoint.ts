import { PixiContainer } from '@/pixi/PixiContainer'
import { PixiGraphic } from '@/pixi/PixiGraphic'
import type { Fingerprint, Projection } from '@/models/data'

// TODO: use Sprite instead of Graphic for performance
export class PixiDimredPoint extends PixiGraphic {
  private projectedPoint: Projection
  private _isSelected: boolean = false
  private _isHovered: boolean = false

  constructor(projectedPoint: Projection) {
    super()

    this.projectedPoint = projectedPoint
    this.drawPoint(5)
    // this.position.set(point.pos.x, point.pos.y)

    this.eventMode = 'static'
    this.cursor = 'pointer'
  }

  drawPoint(radius: number) {
    //console.log('Drawing point', this.point.item_id, radius)
    this.clear()
    this.circle(0, 0, radius)

    const fillColor = this._isSelected
      ? 0x0077ff
      : this._isHovered
        ? 0xffaa00 // <-- hover highlight color
        : 0xbb0000

    this.fill(fillColor)
    this.setStrokeStyle({ width: 1, color: this._isSelected ? 0xffffff : 0x000000 })
    this.stroke()
  }

  updatePosition(size: number) {
    //console.log('Updating position', this.projectedPoint)

    this.position.set(this.projectedPoint.pos.x * size, this.projectedPoint.pos.y * size)
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

  setHovered(hovered: boolean) {
    if (this._isHovered !== hovered) {
      this._isHovered = hovered
      this.drawPoint(5)
    }
  }

  get dimredpoint(): Projection {
    if (!this.projectedPoint) {
      throw new Error('DimredPoint accessed before initialization')
    }
    return this.projectedPoint
  }
}
