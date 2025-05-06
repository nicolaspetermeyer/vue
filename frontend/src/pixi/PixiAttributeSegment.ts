import { PixiGraphic } from '@/pixi/Base/PixiGraphic'
import type { FeatureStats, Position } from '@/models/data'
import { Hoverable } from '@/utils/HoverManager'
import { Colors } from '@/config/Themes'
import { PolarGeometry } from '@/utils/geometry/PolarGeometry'
import { SegmentRenderer } from '@/pixi/renderers/SegmentRenderer'

export class PixiAttributeSegment extends PixiGraphic implements Hoverable {
  public attributeKey: string
  private globalNorm: number
  private localNorm: number | undefined
  public stats: FeatureStats
  private localOverlays: Array<{ id: string; color: number; norm: number }> = []

  public startAngle: number = 0
  public endAngle: number = 0
  public innerRadius: number = 0
  public maxOuterRadius: number = 0
  public centerX: number = 0
  public centerY: number = 0
  public color: number = 0x000000

  private isHovered: boolean = false
  private singleComparison: boolean = false

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
    this.cursor = 'default'
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

    // draw the base global segment
    SegmentRenderer.renderSegment(this, {
      innerRadius,
      maxOuterRadius,
      startAngle,
      endAngle,
      centerX,
      centerY,
      globalNorm: this.globalNorm,
      isHovered: this.isHovered,
      color: this.color,
    })
    // draw each local overlay
    if (this.localOverlays.length === 1) {
      this.singleComparison = true
    } else {
      this.singleComparison = false
    }

    this.localOverlays.forEach((overlay) => {
      SegmentRenderer.renderOverlay(this, {
        innerRadius,
        maxOuterRadius,
        startAngle,
        endAngle,
        centerX,
        centerY,
        globalNorm: this.globalNorm,
        localNorm: overlay.norm,
        color: overlay.color,
        isHovered: this.isHovered,
        singleComparison: this.singleComparison,
      })
    })
  }

  private redraw(): void {
    this.drawSegment(
      this.innerRadius,
      this.maxOuterRadius,
      this.startAngle,
      this.endAngle,
      this.centerX,
      this.centerY,
    )
  }

  clearLocalOverlay(): void {
    this.localOverlays = []
    this.localNorm = undefined
    this.color = 0x000000
    this.redraw()
  }

  clearPointOverlay(id: string): void {
    const initialLength = this.localOverlays.length
    this.localOverlays = this.localOverlays.filter((overlay) => overlay.id !== id)

    if (this.localOverlays.length < initialLength) {
      if (this.localOverlays.length === 0) {
        this.localNorm = undefined
        this.color = 0x000000
      } else {
        const lastOverlay = this.localOverlays[this.localOverlays.length - 1]
        this.localNorm = lastOverlay.norm
        this.color = lastOverlay.color
      }
      this.redraw()
    }
  }

  setLocalOverlay(id: string, localNorm: number, color: number): void {
    this.localOverlays.push({ id, norm: localNorm, color })
    this.localNorm = localNorm
    this.color = color
    this.redraw()
  }

  containsGlobal(global: Position): boolean {
    const local = this.parent.toLocal(global)

    // Use PolarGeometry to convert to polar coordinates
    const { radius, angle } = PolarGeometry.cartesianToPolar(local, this.centerX, this.centerY)

    // Use PolarGeometry to check if point is in segment
    return PolarGeometry.isInSegment(
      radius,
      angle,
      this.innerRadius,
      this.maxOuterRadius,
      this.startAngle,
      this.endAngle,
    )
  }

  setHovered(hovered: boolean) {
    if (this.isHovered !== hovered) {
      this.isHovered = hovered
      this.redraw()
      if (hovered) {
        this.alpha = 0.8
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
