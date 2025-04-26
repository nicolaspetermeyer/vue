import { PixiGraphic } from '@/pixi/Base/PixiGraphic'
import type { Projection } from '@/models/data'
import { Hoverable } from '@/utils/HoverManager'

// TODO: use Sprite instead of Graphic for performance
export class PixiDimredPoint extends PixiGraphic implements Hoverable {
  private projectedPoint: Projection
  private Selected: boolean = false
  private Hovered: boolean = false
  private inFingerprint: boolean = false

  constructor(projectedPoint: Projection) {
    super()

    this.projectedPoint = projectedPoint
    this.drawPoint(5)
    // this.position.set(point.pos.x, point.pos.y)

    this.eventMode = 'static'
    this.cursor = 'pointer'
  }

  drawPoint(radius: number) {
    this.clear()
    this.circle(0, 0, radius)

    let fillColor: number

    if (this.Selected) {
      fillColor = 0x0077ff // Blue for selected
    } else if (this.inFingerprint) {
      fillColor = 0x00ff77 // Green for fingerprint
    } else if (this.Hovered) {
      fillColor = 0xffaa00 // Orange for hovered
    } else {
      fillColor = 0xaaaaaa // Grey for normal
    }

    this.fill(fillColor)
    // Add a highlight stroke for fingerprint points that are not selected
    if (this.inFingerprint && !this.Selected) {
      this.setStrokeStyle({ width: 1.5, color: 0x00ff77, alpha: 0.8 })
    } else {
      this.setStrokeStyle({ width: 1, color: this.Selected ? 0xffffff : 0x000000 })
    }
    this.stroke()
  }

  updatePosition(size: number) {
    this.position.set(this.projectedPoint.pos.x * size, this.projectedPoint.pos.y * size)
  }

  setSelected(selected: boolean) {
    if (this.Selected !== selected) {
      this.Selected = selected
      this.drawPoint(5)
    }
  }

  isSelected(): boolean {
    return this.Selected
  }

  // New method to mark a point as part of the selected fingerprint
  setInFingerprint(inFingerprint: boolean) {
    if (this.inFingerprint !== inFingerprint) {
      this.inFingerprint = inFingerprint
      this.drawPoint(5)
    }
  }

  isInFingerprint(): boolean {
    return this.inFingerprint
  }

  setHovered(state: boolean): void {
    this.Hovered = state
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
