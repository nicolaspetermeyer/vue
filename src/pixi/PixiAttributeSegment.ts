import { PixiGraphic } from '@/pixi/Base/PixiGraphic'
import type { FeatureStats, Position } from '@/models/data'
import { Hoverable } from '@/utils/HoverManager'

export class PixiAttributeSegment extends PixiGraphic implements Hoverable {
  public attributeKey: string
  private globalNorm: number
  private localNorm: number | undefined
  public stats: FeatureStats

  public startAngle: number = 0
  public endAngle: number = 0
  public innerRadius: number = 0
  public maxOuterRadius: number = 0
  public centerX: number = 0
  public centerY: number = 0

  private isHovered: boolean = false

  constructor(
    attributeKey: string,
    norm: { globalNorm: number; localNorm?: number },
    stats: FeatureStats,
  ) {
    const { globalNorm, localNorm } = norm
    super()

    this.attributeKey = attributeKey
    this.globalNorm = globalNorm
    this.localNorm = localNorm
    this.stats = stats

    this.eventMode = 'static'
    this.cursor = 'pointer'
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

    const globalColor = 0xffffff // white
    const overlayColorSmaller = 0xff4444 // red
    const overlayColorBigger = 0x44ff44 // green

    if (localOuter !== null && localOuter > globalOuter) {
      drawArc(localOuter, overlayColorBigger, 0.25)
      drawArc(globalOuter, globalColor, 0.2)
    } else {
      drawArc(globalOuter, globalColor, 0.2)
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

  containsGlobal(global: Position): boolean {
    const local = this.parent.toLocal(global)
    // Calculate distance from center
    const dx = local.x - this.centerX
    const dy = local.y - this.centerY
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Calculate angle and normalize to [0, 2π]
    let angle = Math.atan2(dy, dx)
    if (angle < 0) angle += Math.PI * 2

    // Check if point is within segment bounds
    const isInside =
      dist >= this.innerRadius &&
      dist <= this.maxOuterRadius &&
      angle >= this.startAngle &&
      angle <= this.endAngle

    return isInside
  }

  setHovered(hovered: boolean) {
    if (this.isHovered !== hovered) {
      this.isHovered = hovered
      // Redraw with highlight effect if hovered
      this.drawSegment(
        this.innerRadius,
        this.maxOuterRadius,
        this.startAngle,
        this.endAngle,
        this.centerX,
        this.centerY,
      )

      // Add visual feedback when hovered
      if (hovered) {
        this.alpha = 0.8 // Slightly dim when hovered
      } else {
        this.alpha = 1.0
      }
    }
  }

  getTooltipContent(): string {
    const tooltipLines = [
      `Feature: ${this.attributeKey}`,
      `Global Norm Mean: ${this.globalNorm.toFixed(2)}`,
      `Global Mean: ${this.stats.mean.toFixed(2)}`,
      `Global Std: ${this.stats.std.toFixed(2)}`,
      `Global Min: ${this.stats.min.toFixed(2)}`,
      `Global Max: ${this.stats.max.toFixed(2)}`,
    ]

    if (this.localNorm !== undefined) {
      tooltipLines.push(`Local Mean: ${this.localNorm.toFixed(2)}`)
    }

    const delta = this.localNorm !== undefined ? this.localNorm - this.globalNorm : null
    if (delta !== null && Math.abs(delta) > 0.01) {
      tooltipLines.push(`Δ: ${delta.toFixed(2)}`)
    }

    return tooltipLines.join('\n')
  }

  getId(): string {
    return this.attributeKey
  }
  get attrkey(): string {
    return this.attributeKey
  }
  get globValue(): number {
    return this.globalNorm
  }
  get locValue(): number | undefined {
    return this.localNorm
  }
}
