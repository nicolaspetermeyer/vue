import { PixiContainer } from '@/pixi/PixiContainer'
import { PixiText } from '@/pixi/PixiText'
import { PixiAttributeSegment } from '@/pixi/PixiAttributeSegment'
import type { FeatureStats } from '@/models/data'

export class PixiAttributeRing extends PixiContainer {
  segments: PixiAttributeSegment[] = []
  private innerRadius: number
  private maxOuterRadius: number

  constructor(globalStats: Record<string, FeatureStats>) {
    super({
      width: 700,
      height: 700,
      background: null,
      positionAbsolute: true,
    })

    // calculate inner radius of the ring
    const base = Math.min(this.layoutProps.width, this.layoutProps.height)
    this.innerRadius = base / 2 - 25
    this.maxOuterRadius = base / 1.2

    // Add attribute segments
    for (const attributeName of Object.keys(globalStats)) {
      const stat = globalStats[attributeName]
      this.addAttributeSegment(attributeName, stat)
    }

    this.drawAttributeSegments()

    this.applyLayout()
  }

  addAttributeSegment(attributeName: string, stat: FeatureStats) {
    // console.log('Adding attribute segment', attributeName)
    const normalized = stat.normMean ?? 0
    // console.log('Adding normalized Mean', normalized)
    const segment = new PixiAttributeSegment(attributeName, normalized)
    this.segments.push(segment)
    this.addChild(segment)
  }

  drawAttributeSegments() {
    const totalAngle = Math.PI * 2
    const gapAngle = 0.02 // radians per gap
    const segmentCount = this.segments.length

    const slotAngle = totalAngle / segmentCount

    for (let i = 0; i < segmentCount; i++) {
      const segment = this.segments[i]
      const slotStart = i * slotAngle
      const startAngle = slotStart + gapAngle / 2
      const endAngle = slotStart + slotAngle - gapAngle / 2

      segment.drawSegment(
        this.innerRadius,
        this.maxOuterRadius,
        startAngle,
        endAngle,
        this.layoutProps.width / 2,
        this.layoutProps.height / 2,
      )
      const midAngle = (startAngle + endAngle) / 2
      const outerRadius =
        this.innerRadius + segment.normMeanValue * (this.maxOuterRadius - this.innerRadius)
      const radius = (this.innerRadius + outerRadius) / 2 // midpoint radius

      const labelX = this.layoutProps.width / 2 + radius * Math.cos(midAngle)
      const labelY = this.layoutProps.height / 2 + radius * Math.sin(midAngle)

      const label = new PixiText({
        text: segment.attrkey,
        x: labelX,
        y: labelY,
        anchor: 0.5,
        style: {
          fontSize: 16,
          fill: 0x000000,
          align: 'center',
        },
      })

      //label.rotation = midAngle
      // if (midAngle > Math.PI / 2 && midAngle < (3 * Math.PI) / 2) {
      //   label.rotation += Math.PI
      // }
      this.addChild(label)
    }
  }
}
