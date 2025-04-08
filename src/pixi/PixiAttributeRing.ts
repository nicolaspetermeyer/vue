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
    this.innerRadius = this.layoutProps.width / 2 - 25
    this.maxOuterRadius = this.layoutProps.width / 1.2

    // Add attribute segments
    for (const attributeName of Object.keys(globalStats)) {
      const stat = globalStats[attributeName]
      this.addAttributeSegment(attributeName, stat)
    }

    this.drawAttributeSegments()

    this.applyLayout()
  }

  addAttributeSegment(attributeName: string, stat: FeatureStats) {
    console.log('Adding attribute segment', attributeName)
    const normalized = stat.normMean ?? 0
    console.log('Adding normalized Mean', normalized)
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
    }
  }
}
