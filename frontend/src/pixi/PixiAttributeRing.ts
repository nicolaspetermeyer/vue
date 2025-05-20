import { PixiContainer } from '@/pixi/Base/PixiContainer'
import { PixiText } from '@/pixi/Base/PixiText'
import { PointData } from 'pixi.js'
import { HoverableProvider } from '@/pixi/interactions/controllers/HoverManager'
import { PixiAttributeSegment } from '@/pixi/PixiAttributeSegment'
import type { FeatureStats } from '@/models/data'
import { Colors } from '@/config/Themes'

export class PixiAttributeRing
  extends PixiContainer
  implements HoverableProvider<PixiAttributeSegment>
{
  segments: PixiAttributeSegment[] = []
  private innerRadius: number
  private maxOuterRadius: number
  private attributeKeys: Set<string> = new Set()
  private mini: boolean
  private color?: number
  private localStats?: Record<string, { normMean?: number }> = {}

  constructor(
    globalStats: Record<string, FeatureStats>,
    opts?: {
      width?: number
      height?: number
      mini?: boolean
      localStats?: Record<string, { normMean?: number }>
      color?: number
    },
  ) {
    super({
      width: opts?.width ?? (opts?.mini ? 60 : 1000),
      height: opts?.height ?? (opts?.mini ? 60 : 1000),
      background: null,
      positionAbsolute: true,
    })
    this.mini = opts?.mini ?? false
    this.color = opts?.color
    this.localStats = opts?.localStats

    this.eventMode = 'static'
    this.sortableChildren = true

    // calculate inner radius of the ring
    const base = Math.min(this.layoutProps.width, this.layoutProps.height)
    this.innerRadius = base * 0.35
    this.maxOuterRadius = base * (opts?.mini ? 0.9 : 0.6)

    // Add only numeric attribute segments
    for (const [attrKey, stat] of Object.entries(globalStats)) {
      if (this.mini) {
        const localNorm = this.localStats?.[attrKey]?.normMean
        this.addMiniSegment(attrKey, localNorm)
      } else {
        const localStat = this.localStats?.[attrKey]
        this.addAttributeSegment(attrKey, stat, localStat)
      }
      this.attributeKeys.add(attrKey)
    }
    this.drawAttributeSegments()

    this.applyLayout()
  }

  addMiniSegment(attributeName: string, localNorm?: number) {
    const segment = new PixiAttributeSegment(attributeName, { globalNorm: -1, localNorm })
    if (this.color !== undefined) {
      segment.color = this.color
    }
    this.segments.push(segment)
    this.addChild(segment)
  }

  addAttributeSegment(
    attributeName: string,
    globalStat: FeatureStats,
    localStat?: { normMean?: number },
  ) {
    const globalNorm = globalStat.normMean ?? 0
    const localNorm = localStat?.normMean
    const stats = globalStat
    const segment = new PixiAttributeSegment(attributeName, { globalNorm, localNorm }, stats)
    if (this.mini && this.color !== undefined) {
      segment.color = this.color
    }

    this.segments.push(segment)
    this.addChild(segment)
  }

  drawAttributeSegments() {
    let gapAngle = this.mini ? 0 : this.segments.length < 50 ? 0.02 : 0.005
    const segmentCount = this.segments.length
    const anglePerSegment = (Math.PI * 2) / segmentCount
    for (let i = 0; i < segmentCount; i++) {
      const segment = this.segments[i]
      const slotStart = i * anglePerSegment
      const startAngle = slotStart + gapAngle / 2
      const endAngle = slotStart + anglePerSegment - gapAngle / 2
      segment.drawSegment(
        this.innerRadius,
        this.maxOuterRadius,
        startAngle,
        endAngle,
        this.layoutProps.width / 2,
        this.layoutProps.height / 2,
        this.mini,
      )
      // In mini mode, skip labels for clarity
      if (!this.mini && segmentCount < 20) {
        this.drawLabelForSegment(segment, startAngle, endAngle)
      }
    }
  }
  public clearLocalStats() {
    for (const segment of this.segments) {
      segment.clearLocalOverlay()
    }
  }

  public clearPointStats(id: string) {
    for (const segment of this.segments) {
      segment.clearPointOverlay(id)
    }
  }

  public setLocalStats(
    id: string,
    localStats: Record<string, { normMean?: number }>,
    color: number,
  ) {
    for (const segment of this.segments) {
      const local = localStats[segment.attrkey]
      const newNorm = local?.normMean ?? undefined
      if (newNorm !== undefined) {
        segment.setLocalOverlay(id, newNorm, color)
      }
    }
  }

  private drawLabelForSegment(segment: PixiAttributeSegment, startAngle: number, endAngle: number) {
    const midAngle = (startAngle + endAngle) / 2
    const outerRadius =
      this.innerRadius + segment.globValue * (this.maxOuterRadius - this.innerRadius)
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

  findElementAtGlobal(global: PointData): PixiAttributeSegment | null {
    for (const seg of this.segments) {
      if (seg.containsGlobal(global)) {
        return seg
      }
    }
    return null
  }

  hasAttribute(attributeName: string): boolean {
    return this.attributeKeys.has(attributeName)
  }
}
