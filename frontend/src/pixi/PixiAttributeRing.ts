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
  private fingerprintId?: string

  constructor(
    globalStats: Record<string, FeatureStats>,
    opts?: {
      width?: number
      height?: number
      mini?: boolean
      localStats?: Record<string, { normMean?: number }>
      color?: number
      fingerprintId?: string
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
    this.fingerprintId = opts?.fingerprintId

    this.eventMode = 'static'

    if (this.mini) {
      this.cursor = 'pointer'
    }

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
    const gapAngle = this.mini ? 0 : this.segments.length < 50 ? 0.02 : 0.005
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

      if (!this.mini && segmentCount < 20) {
        this.drawLabelForSegment(segment, startAngle, endAngle)
      }
    }
  }

  public highlightSegment(attributeKey: string): void {
    for (const segment of this.segments) {
      segment.setHovered(false)
    }

    const selectedSegment = this.segments.find((segment) => segment.attributeKey === attributeKey)
    if (selectedSegment) {
      selectedSegment.setHovered(true)
    }
  }
  public clearLocalRing() {
    for (const segment of this.segments) {
      segment.clearLocalOverlay()
    }
  }

  public clearPointRing(id: string) {
    for (const segment of this.segments) {
      segment.clearPointOverlay(id)
    }
  }

  public setLocalRing(
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
    const local = this.toLocal(global)
    if (this.mini) {
      if (!this.isInsideMiniRing(local)) return null
      // any segment containing the point?
      for (const segment of this.segments) {
        if (segment.containsGlobal(global)) return segment
      }

      // fallback
      return this.segments[0] || null
    }
    // For regular rings, check each segment
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

  containsPoint(global: PointData): boolean {
    const local = this.toLocal(global)

    // For mini rings, just check if the point is within the circle
    if (this.mini) {
      const dx = local.x - this.layoutProps.width / 2
      const dy = local.y - this.layoutProps.height / 2
      const distanceSquared = dx * dx + dy * dy

      // Check if the point is within the outer radius
      return distanceSquared <= this.maxOuterRadius * this.maxOuterRadius
    }

    // For regular rings, delegate to the segments
    return this.findElementAtGlobal(global) !== null
  }

  getFingerprint(): string | undefined {
    return this.fingerprintId
  }

  private isInsideMiniRing(local: PointData): boolean {
    const cx = this.layoutProps?.width ? this.layoutProps.width / 2 : this.width / 2
    const cy = this.layoutProps?.height ? this.layoutProps.height / 2 : this.height / 2
    const dx = local.x - cx
    const dy = local.y - cy
    return dx * dx + dy * dy <= this.maxOuterRadius * this.maxOuterRadius
  }
}
