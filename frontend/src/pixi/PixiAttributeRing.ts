import { PixiContainer } from '@/pixi/Base/PixiContainer'
import { PixiText } from '@/pixi/Base/PixiText'
import { PointData } from 'pixi.js'
import { HoverableProvider } from '@/pixi/interactions/controllers/HoverManager'
import { PixiAttributeSegment } from '@/pixi/PixiAttributeSegment'
import type { AttributeStats } from '@/models/data'

export class PixiAttributeRing
  extends PixiContainer
  implements HoverableProvider<PixiAttributeSegment>
{
  segments: PixiAttributeSegment[] = []
  private innerRadius: number
  private maxOuterRadius: number
  private attributeKeys: Set<string> = new Set()
  private mini: boolean
  private fingerprint:
    | { id: string; stats: Record<string, AttributeStats>; color?: number }
    | undefined
  private visibleSegments: PixiAttributeSegment[] = []

  constructor(
    globalStats: Record<string, AttributeStats>,
    mini: boolean,
    fingerprint?: {
      id: string
      stats: Record<string, AttributeStats>
      color?: number
    },
  ) {
    super({
      width: mini ? 75 : 1000,
      height: mini ? 75 : 1000,
      background: null,
      positionAbsolute: true,
    })
    this.mini = mini ?? false
    this.fingerprint = fingerprint

    this.eventMode = 'static'

    if (this.mini) {
      this.cursor = 'pointer'
    }

    this.sortableChildren = true

    // calculate inner radius of the ring
    const base = Math.min(this.layoutProps.width, this.layoutProps.height)
    this.innerRadius = base * 0.35
    this.maxOuterRadius = base * (mini ? 0.9 : 0.6)

    // Add only numeric attribute segments
    for (const [attrKey, stat] of Object.entries(globalStats)) {
      this.addSegment(attrKey, stat, mini, fingerprint)
      this.attributeKeys.add(attrKey)
    }

    this.visibleSegments = [...this.segments]

    this.drawAttributeSegments()
    this.applyLayout()
  }

  addSegment(
    attrKey: string,
    globalStat: AttributeStats,
    mini: boolean,
    fingerprint?: { id: string; stats: Record<string, AttributeStats>; color?: number },
  ) {
    const localNorm = fingerprint?.stats?.[attrKey]?.normMean
    const globalNorm = globalStat.normMean ?? 0

    const segment = new PixiAttributeSegment({
      attributeKey: attrKey,
      mini,
      globalNorm,
      localNorm,
      color: fingerprint?.color,
      stats: globalStat,
      fingerprintId: fingerprint?.id,
    })

    this.segments.push(segment)
    this.addChild(segment)
  }

  drawAttributeSegments() {
    const gapAngle = this.mini ? 0.0005 : this.segments.length > 30 ? 0.005 : 0.02
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

  public clickSegment(attributeKey: string): void {
    for (const segment of this.segments) {
      segment.clickSegment(false)
    }

    const selectedSegment = this.segments.find((segment) => segment.attributeKey === attributeKey)
    if (selectedSegment) {
      selectedSegment.clickSegment(true)
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
    fingerprintName: string,
  ) {
    for (const segment of this.segments) {
      const localNorm = localStats[segment.attrkey].normMean ?? undefined
      if (localNorm !== undefined) {
        segment.setLocalOverlay(id, localNorm, color, fingerprintName)
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

  updateVisibleAttributes(attributeNames: string[]): void {
    const attributeSet = new Set(attributeNames)

    // Reset visibility for all segments
    for (const segment of this.segments) {
      // Remove all segments from parent first
      if (this.children.includes(segment)) {
        this.removeChild(segment)
      }
    }

    // Filter segments based on the attribute names
    this.visibleSegments = this.segments.filter((segment) => attributeSet.has(segment.attributeKey))

    // Add filtered segments back to the container
    for (const segment of this.visibleSegments) {
      this.addChild(segment)
    }
    this.redrawSegments()
  }

  redrawSegments(): void {
    // Remove text labels
    this.children.forEach((child) => {
      if (child instanceof PixiText) {
        this.removeChild(child)
      }
    })

    // Calculate new angles based on visible segments
    const gapAngle = this.mini ? 0.0005 : this.visibleSegments.length > 30 ? 0.005 : 0.02
    const segmentCount = this.visibleSegments.length

    if (segmentCount === 0) return // Nothing to draw

    const anglePerSegment = (Math.PI * 2) / segmentCount

    // Redraw each segment with new angles
    for (let i = 0; i < segmentCount; i++) {
      const segment = this.visibleSegments[i]
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

      // Add labels if needed
      if (!this.mini && segmentCount < 20) {
        this.drawLabelForSegment(segment, startAngle, endAngle)
      }
    }
  }

  // Reset to show all attributes
  showAllAttributes(): void {
    this.visibleSegments = [...this.segments]

    // Remove all segments first
    for (const segment of this.segments) {
      if (this.children.includes(segment)) {
        this.removeChild(segment)
      }
    }

    // Add all segments back
    for (const segment of this.segments) {
      this.addChild(segment)
    }
    this.redrawSegments()
  }

  pointerInElement(global: PointData): PixiAttributeSegment | null {
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

  getFingerprint(): string | undefined {
    return this.fingerprint?.id
  }
}
