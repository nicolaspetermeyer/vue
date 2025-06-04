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
    const localNorm = fingerprint?.stats?.[attrKey]?.localNormMean
    const globalNorm = globalStat.normMean

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
    const gapAngle = this.mini ? 0.0005 : this.visibleSegments.length > 30 ? 0.005 : 0.02
    const segmentCount = this.visibleSegments.length
    const anglePerSegment = (Math.PI * 2) / segmentCount

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

      if (!this.mini && segmentCount < 50) {
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
    localStats: Record<string, AttributeStats>,
    color: number,
    fingerprintName: string,
  ) {
    for (const segment of this.segments) {
      const attributeKey = segment.attributeKey
      const localStat = localStats[attributeKey]

      if (localStat && localStat.localNormMean !== undefined) {
        segment.setLocalOverlay(id, localStat.localNormMean, color, fingerprintName)
      }
    }
  }

  private drawLabelForSegment(segment: PixiAttributeSegment, startAngle: number, endAngle: number) {
    const midAngle = (startAngle + endAngle) / 2
    const arcWidth = this.maxOuterRadius - this.innerRadius
    const globalOuterRadius = this.innerRadius + 0.5 * arcWidth

    const middleRadius = (this.innerRadius + globalOuterRadius) / 2 // midpoint radius

    const labelX = this.layoutProps.width / 2 + middleRadius * Math.cos(midAngle)
    const labelY = this.layoutProps.height / 2 + middleRadius * Math.sin(midAngle)

    const angleDiff = endAngle - startAngle
    const arcLength = angleDiff * middleRadius
    const maxWidth = Math.min(arcLength * 0.7, 80)

    let displayText = segment.attrkey
    let fontSize = 14

    // Adjust font size and text based on available space
    if (arcLength < 40) {
      // For very small segments, just use first letter or first few letters
      displayText = displayText.substring(0, 2)
      fontSize = 10
    } else if (segment.attrkey.length > 16) {
      fontSize = 12
    }

    const label = new PixiText({
      text: displayText,
      x: labelX,
      y: labelY,
      anchor: 0.5,
      style: {
        fontSize: fontSize,
        fill: 0x000000,
        align: 'center',
        wordWrap: arcLength > 60,
        wordWrapWidth: maxWidth,
        breakWords: true,
      },
    })

    //label.rotation = midAngle
    // if (midAngle > Math.PI / 2 && midAngle < (3 * Math.PI) / 2) {
    //   label.rotation += Math.PI
    // }
    this.addChild(label)
  }

  updateVisibleAttributes(
    globalStats: Record<string, AttributeStats>,
    attributeNames: string[],
  ): void {
    // Clear existing segments
    this.segments.forEach((segment) => {
      if (this.children.includes(segment)) {
        this.removeChild(segment)
      }
    })

    this.children = this.children.filter((child) => !(child instanceof PixiText))

    this.segments = []
    this.attributeKeys.clear()

    const attributeSet = new Set(attributeNames)

    for (const [attrKey, stat] of Object.entries(globalStats)) {
      if (attributeSet.has(attrKey)) {
        this.addSegment(attrKey, stat, this.mini, this.fingerprint)
        this.attributeKeys.add(attrKey)
      }
    }
    this.visibleSegments = [...this.segments]
    this.drawAttributeSegments()
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
