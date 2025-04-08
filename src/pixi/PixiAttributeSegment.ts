import { PixiContainer } from '@/pixi/PixiContainer'
import { PixiGraphic } from '@/pixi/PixiGraphic'

export class PixiAttributeSegment extends PixiGraphic {
  private attributeKey: string
  private normMean: number

  constructor(attributeKey: string, normMean: number) {
    super()

    this.attributeKey = attributeKey
    this.normMean = normMean
  }

  drawSegment(
    innerRadius: number,
    maxOuterRadius: number,
    startAngle: number,
    endAngle: number,
    centerX: number = 0,
    centerY: number = 0,
  ) {
    // console.log(
    //   'Drawing segment',
    //   this.attributeKey,
    //   innerRadius,
    //   maxOuterRadius,
    //   startAngle,
    //   endAngle,
    // )
    this.clear()

    const outerRadius = innerRadius + this.normMean * (maxOuterRadius - innerRadius)

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
    this.fill(0xbbbb12)
  }
}
