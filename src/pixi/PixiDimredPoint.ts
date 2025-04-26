import { PixiGraphic } from '@/pixi/PixiGraphic'
import type { Projection } from '@/models/data'
import { Hoverable } from '@/utils/HoverManager'

// TODO: use Sprite instead of Graphic for performance
export class PixiDimredPoint extends PixiGraphic implements Hoverable {
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

  setHovered(state: boolean): void {
    this._isHovered = state
    this.drawPoint(5)
  }

  getTooltipContent(): string {
    const projection = this.dimredpoint
    const featureLines = Object.entries(projection.original).map(([key, value]) => {
      const valStr = typeof value === 'number' ? value.toFixed(2) : String(value)
      return `${key}: ${valStr}`
    })

    return [`ID: ${projection.id}`, '', 'Features:', ...featureLines].join('\n')
  }

  get dimredpoint(): Projection {
    if (!this.projectedPoint) {
      throw new Error('DimredPoint accessed before initialization')
    }
    return this.projectedPoint
  }
  getId(): number {
    return this.dimredpoint.id
  }
}
