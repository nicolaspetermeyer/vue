import { PixiGraphic } from '@/pixi/Base/PixiGraphic'
import type { FeatureStats, Position } from '@/models/data'
import { Hoverable } from '@/pixi/interactions/controllers/HoverManager'
import { Colors, Styles } from '@/config/Themes'
import { PolarGeometry } from '@/utils/geometry/PolarGeometry'
import { PixiAttributeRing } from '@/pixi/PixiAttributeRing'
import { line } from 'd3'

export class PixiAttributeSegment extends PixiGraphic implements Hoverable {
  public attributeKey: string
  private globalNorm: number
  private localNorm: number | undefined
  public stats: FeatureStats
  private localOverlays: Map<string, { color: number; norm: number }> = new Map()

  public startAngle: number = 0
  public endAngle: number = 0
  public innerRadius: number = 0
  public maxOuterRadius: number = 0
  public centerX: number = 0
  public centerY: number = 0
  public color: number = 0x000000

  public mini: boolean = false
  private isHovered: boolean = false
  private isSelected: boolean = false

  constructor(
    attributeKey: string,
    norm: { globalNorm: number; localNorm?: number },
    stats?: FeatureStats,
  ) {
    const { globalNorm, localNorm } = norm
    super()

    this.attributeKey = attributeKey
    this.globalNorm = globalNorm
    this.localNorm = localNorm
    this.stats = stats ?? { mean: 0, std: 0, normMean: 0, isGlobal: false }

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
    mini: boolean,
  ) {
    // Store geometry for redraws
    this.startAngle = startAngle
    this.endAngle = endAngle
    this.innerRadius = innerRadius
    this.maxOuterRadius = maxOuterRadius
    this.centerX = centerX
    this.centerY = centerY
    this.mini = mini

    this.clear()

    if (mini) {
      this.drawMiniSegment()
    } else {
      this.drawMainSegment()
    }
  }

  /**
   * Draw a mini segment for fingerprints
   */
  private drawMiniSegment() {
    if (typeof this.localNorm !== 'number') return

    const lineWidth = this.isHovered ? Styles.LINEWIDTH_HOVER_MINI : Styles.LINEWIDTH_MINI

    // Draw inner circle in the mini ring

    this.circle(this.centerX, this.centerY, this.innerRadius)
    this.fill({ color: this.color, alpha: 0.05 })

    // Calculate the outer radius based on the value
    const arcWidth = this.maxOuterRadius - this.innerRadius
    const outerRadius = this.innerRadius + this.localNorm * arcWidth

    // Draw the segment arc
    this.drawArc(
      this.innerRadius,
      outerRadius,
      this.startAngle,
      this.endAngle,
      this.color,
      this.color, // Border color
      0.25,
      lineWidth,
    )
  }

  /**
   * Draw main segment with global and overlay data
   */
  private drawMainSegment() {
    if (typeof this.globalNorm !== 'number' || this.globalNorm <= 0) return

    const lineWidth = this.isHovered ? Styles.LINEWIDTH_HOVER : Styles.LINEWIDTH

    const arcWidth = this.maxOuterRadius - this.innerRadius
    const globalOuterRadius = this.innerRadius + this.globalNorm * arcWidth

    // Draw global segment
    this.drawArc(
      this.innerRadius,
      globalOuterRadius,
      this.startAngle,
      this.endAngle,
      Colors.GLOBAL_SEGMENT,
      Colors.STANDARD_BORDER,
      0.25,
      lineWidth,
    )

    // Draw overlays if present
    const overlays = this.localOverlays
    const singleComparison = overlays?.size === 1

    if (overlays && overlays.size > 0) {
      overlays.forEach((overlay) => {
        const localOuterRadius = this.innerRadius + overlay.norm * arcWidth

        let fillColor = overlay.color
        let borderColor = Colors.STANDARD_BORDER

        if (singleComparison) {
          fillColor =
            localOuterRadius > globalOuterRadius
              ? Colors.OVERLAY_SEGMENT_BIGGER
              : Colors.OVERLAY_SEGMENT_SMALLER
          borderColor = fillColor
        }

        // Draw the overlay arc
        this.drawArc(
          this.innerRadius,
          localOuterRadius,
          this.startAngle,
          this.endAngle,
          fillColor,
          borderColor,
          0.25,
          lineWidth,
        )
      })
    }
  }

  /**
   * Draw an arc segment with given parameters
   */
  private drawArc(
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
    fillColor: number,
    borderColor: number,
    alpha: number,
    lineWidth: number,
  ) {
    this.moveTo(
      this.centerX + innerRadius * Math.cos(startAngle),
      this.centerY + innerRadius * Math.sin(startAngle),
    )
      .lineTo(
        this.centerX + outerRadius * Math.cos(startAngle),
        this.centerY + outerRadius * Math.sin(startAngle),
      )
      .arc(this.centerX, this.centerY, outerRadius, startAngle, endAngle)
      .lineTo(
        this.centerX + innerRadius * Math.cos(endAngle),
        this.centerY + innerRadius * Math.sin(endAngle),
      )
      .arc(this.centerX, this.centerY, innerRadius, endAngle, startAngle, true)
      .closePath()

    this.stroke({ color: borderColor ?? fillColor, width: lineWidth })

    if (Colors.FILL_STYLE) {
      this.fill({ color: fillColor, alpha: alpha })
    }
  }

  private redraw(): void {
    this.drawSegment(
      this.innerRadius,
      this.maxOuterRadius,
      this.startAngle,
      this.endAngle,
      this.centerX,
      this.centerY,
      this.mini,
    )
  }

  /**
   * Update the visual state of the point based on its selection and hover state.
   */
  updateVisualState() {
    if (this.isSelected) {
      this.tint = Colors.SELECTED_SEGMENT
    } else if (this.isHovered) {
      this.tint = Colors.HOVERED
    } else {
      this.tint = Colors.GLOBAL_SEGMENT
    }
  }

  clearLocalOverlay(): void {
    this.localOverlays.clear()
    this.localNorm = undefined
    this.color = 0x000000
    this.redraw()
  }

  /**
   * Clear a specific point overlay by its ID
   * @param id - The ID of the point to clear
   */

  clearPointOverlay(id: string): void {
    if (!this.localOverlays.has(id)) return

    this.localOverlays.delete(id)

    if (this.localOverlays.size === 0) {
      this.localNorm = undefined
      this.color = 0x000000
    } else {
      const lastOverlay = Array.from(this.localOverlays.values()).pop()
      this.localNorm = lastOverlay?.norm
      this.color = lastOverlay?.color ?? 0x000000
    }
    this.redraw()
  }

  setLocalOverlay(id: string, localNorm: number, color: number): void {
    this.localOverlays.set(id, { norm: localNorm, color })
    this.localNorm = localNorm
    this.color = color
    this.redraw()
  }

  containsGlobal(global: Position): boolean {
    const local = this.parent.toLocal(global)

    // Convert to polar coordinates
    const { radius, angle } = PolarGeometry.cartesianToPolar(local, this.centerX, this.centerY)

    if (this.mini) {
      const inSegment = PolarGeometry.isInSegment(
        radius,
        angle,
        this.innerRadius,
        this.maxOuterRadius,
        this.startAngle,
        this.endAngle,
        this.maxOuterRadius,
      )

      const inInnerCircle = radius <= this.innerRadius

      return inSegment || inInnerCircle
    }

    //limit hit detection to drawn area
    const arcWidth = this.maxOuterRadius - this.innerRadius
    const actualOuterRadius = this.innerRadius + this.globalNorm * arcWidth

    return PolarGeometry.isInSegment(
      radius,
      angle,
      this.innerRadius,
      this.maxOuterRadius,
      this.startAngle,
      this.endAngle,
      actualOuterRadius,
    )
  }

  setHovered(hovered: boolean) {
    if (this.isHovered !== hovered) {
      this.isHovered = hovered
      this.redraw()
      this.alpha = hovered ? 0.5 : 1
    }
  }

  clickSegment(selected: boolean) {
    if (this.isSelected !== selected) {
      this.isSelected = selected

      this.updateVisualState()
    } else {
      this.isSelected = false
      this.updateVisualState()
    }
  }

  getTooltipContent(): string {
    let content = `Attribute: ${this.attributeKey}\n`

    if (this.mini) {
      const fingerprintId =
        this.parent instanceof PixiAttributeRing
          ? (this.parent as PixiAttributeRing).getFingerprint() || 'Unknown'
          : 'Unknown'

      content += `Fingerprint: ${fingerprintId}\n`

      if (this.localNorm !== undefined) {
        const percentage = Math.round(this.localNorm * 100)
        content += `Value: ${percentage}%`
      }

      if (this.stats) {
        if (this.stats.mean !== undefined) {
          content += `\nMean: ${this.stats.mean.toFixed(2)}`
        }
        if (this.stats.min !== undefined && this.stats.max !== undefined) {
          content += `\nRange: ${this.stats.min.toFixed(2)} - ${this.stats.max.toFixed(2)}`
        }
      }
      return content
    } else {
      const tooltipLines = [
        `Feature: ${this.attributeKey}`,
        `Global Norm Mean: ${this.globalNorm.toFixed(2)}`,
        `Global Mean: ${this.stats.mean.toFixed(2)}`,
        `Global Std: ${this.stats.std.toFixed(2)}`,
      ]

      if (this.stats.min !== undefined) {
        tooltipLines.push(`Global Min: ${this.stats.min.toFixed(2)}`)
      }
      if (this.stats.max !== undefined) {
        tooltipLines.push(`Global Max: ${this.stats.max.toFixed(2)}`)
      }

      if (this.localOverlays && this.localOverlays.size > 0) {
        tooltipLines.push('', 'Comparisons:')
        this.localOverlays.forEach((overlay, id) => {
          const norm = overlay.norm
          const delta = overlay.norm - this.globalNorm
          const direction = delta > 0 ? 'higher' : 'lower'
          const pctDiff = Math.abs(delta * 100).toFixed(1)

          tooltipLines.push(`Fingerprint ${id}: ${norm} ${pctDiff}% ${direction}`)
        })
      }

      return tooltipLines.join('\n')
    }
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
