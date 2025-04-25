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
    // Store geometry for redraws
    this.startAngle = startAngle
    this.endAngle = endAngle
    this.innerRadius = innerRadius
    this.maxOuterRadius = maxOuterRadius
    this.centerX = centerX
    this.centerY = centerY

    this.clear()

    const arcWidth = maxOuterRadius - innerRadius

    const globalOuter = innerRadius + this.globalNorm * arcWidth
    const localOuter = this.localNorm !== undefined ? innerRadius + this.localNorm * arcWidth : null

    // Draw larger arc first to ensure visibility of smaller layer
    const drawArc = (outerR: number, fillColor: number, alpha: number) => {
      this.fill({ color: fillColor, alpha: alpha })
      this.moveTo(
        centerX + innerRadius * Math.cos(startAngle),
        centerY + innerRadius * Math.sin(startAngle),
      )
      this.lineTo(centerX + outerR * Math.cos(startAngle), centerY + outerR * Math.sin(startAngle))
      this.arc(centerX, centerY, outerR, startAngle, endAngle)
      this.lineTo(
        centerX + innerRadius * Math.cos(endAngle),
        centerY + innerRadius * Math.sin(endAngle),
      )
      this.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
      this.closePath()
      this.stroke(fillColor)
      this.fill({ color: fillColor, alpha: alpha })
    }

    const globalColor = 0xffffff // golden yellow
    const overlayColorSmaller = 0xff4444 // red
    const overlayColorBigger = 0x44ff44 // green

    if (localOuter !== null && localOuter > globalOuter) {
      drawArc(localOuter, overlayColorBigger, 0.25)
      drawArc(globalOuter, globalColor, 1.0)
    } else {
      drawArc(globalOuter, globalColor, 1.0)
      if (localOuter !== null) {
        drawArc(localOuter, overlayColorSmaller, 0.25)
      }
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
