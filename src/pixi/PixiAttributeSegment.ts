import { PixiGraphic } from '@/pixi/PixiGraphic'

export class PixiAttributeSegment extends PixiGraphic {
  private attributeKey: string
  private globalNorm: number
  private localNorm: number | undefined

  private startAngle: number = 0
  private endAngle: number = 0
  private innerRadius: number = 0
  private maxOuterRadius: number = 0
  private centerX: number = 0
  private centerY: number = 0

  constructor(attributeKey: string, norm: { globalNorm: number; localNorm?: number }) {
    const { globalNorm, localNorm } = norm
    super()

    this.attributeKey = attributeKey
    this.globalNorm = globalNorm
    this.localNorm = localNorm
  }

  drawSegment(
    innerRadius: number,
    maxOuterRadius: number,
    startAngle: number,
    endAngle: number,
    centerX: number = 0,
    centerY: number = 0,
  ) {
    this.clear()
    // Store geometry for redraws
    this.startAngle = startAngle
    this.endAngle = endAngle
    this.innerRadius = innerRadius
    this.maxOuterRadius = maxOuterRadius
    this.centerX = centerX
    this.centerY = centerY

    const arcWidth = maxOuterRadius - innerRadius

    const outerRadius = innerRadius + this.globalNorm * arcWidth

    // === Global Layer ===
    this.fill({ color: 0xbbbb12, alpha: 1 })

    this.moveTo(
      centerX + innerRadius * Math.cos(startAngle),
      centerY + innerRadius * Math.sin(startAngle),
    )
    this.lineTo(
      centerX + outerRadius * Math.cos(startAngle),
      centerY + outerRadius * Math.sin(startAngle),
    )
    this.arc(centerX, centerY, outerRadius, startAngle, endAngle)

    this.lineTo(
      centerX + innerRadius * Math.cos(endAngle),
      centerY + innerRadius * Math.sin(endAngle),
    )
    this.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
    this.closePath()

    this.stroke(0x000000)
    this.fill({ color: 0xbbbb12, alpha: 1 })

    // === Local Layer ===
    if (this.localNorm !== undefined) {
      const localOuterRadius = innerRadius + this.localNorm * arcWidth
      this.fill({ color: 0xff4444, alpha: 0.75 })

      this.moveTo(
        centerX + innerRadius * Math.cos(startAngle),
        centerY + innerRadius * Math.sin(startAngle),
      )
      this.lineTo(
        centerX + localOuterRadius * Math.cos(startAngle),
        centerY + localOuterRadius * Math.sin(startAngle),
      )
      this.arc(centerX, centerY, localOuterRadius, startAngle, endAngle)

      this.lineTo(
        centerX + innerRadius * Math.cos(endAngle),
        centerY + innerRadius * Math.sin(endAngle),
      )
      this.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
      this.closePath()

      this.stroke(0x000000)
      this.fill({ color: 0xff4444, alpha: 0.25 })
    }
  }

  setLocalOverlay(localNorm?: number) {
    this.localNorm = localNorm
    this.drawSegment(
      this.innerRadius,
      this.maxOuterRadius,
      this.startAngle,
      this.endAngle,
      this.centerX,
      this.centerY,
    )
  }

  get attrkey(): string {
    return this.attributeKey
  }
  get normMeanValue(): number {
    return this.globalNorm
  }
}
