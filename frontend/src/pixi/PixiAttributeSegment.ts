import { PixiGraphic } from '@/pixi/Base/PixiGraphic'
import type { FeatureStats, Position } from '@/models/data'
import { Hoverable } from '@/pixi/interactions/controllers/HoverManager'
import { Colors, Styles } from '@/config/Themes'
import { PolarGeometry } from '@/utils/geometry/PolarGeometry'
import { PixiAttributeRing } from '@/pixi/PixiAttributeRing'
import { usePixiUIStore } from '@/stores/pixiUIStore'

export class PixiAttributeSegment extends PixiGraphic implements Hoverable {
  public attributeKey: string
  private globalNorm: number
  private localNorm: number | undefined
  public stats: FeatureStats

  // Geometry properties
  public startAngle: number = 0
  public endAngle: number = 0
  public innerRadius: number = 0
  public maxOuterRadius: number = 0
  public centerX: number = 0
  public centerY: number = 0
  public color: number = 0x000000

  public mini: boolean = false
  private pixiUIStore = usePixiUIStore()

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

  /**
   * Draw the segment with current geometry and state
   */
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

    // Clear previous drawing
    this.clear()

    const isHovered = this.pixiUIStore.hoveredSegmentKey === this.attributeKey
    const lineWidth = isHovered ? Styles.LINEWIDTH_HOVER : Styles.LINEWIDTH

    if (mini) {
      // Draw mini segment (used in fingerprints)
      this.drawMiniSegment(isHovered, lineWidth)
    } else {
      // Draw main segment with global data
      this.drawMainSegment(isHovered, lineWidth)
    }
  }

  /**
   * Draw a mini segment for fingerprints
   */
  private drawMiniSegment(isHovered: boolean, lineWidth: number) {
    if (typeof this.localNorm !== 'number') return

    // Draw inner circle in the mini ring
    this.fill({ color: Colors.MINI_INNER_RING, alpha: 0.2 })
    this.circle(this.centerX, this.centerY, this.innerRadius)

    // Calculate the outer radius based on the value
    const arcWidth = this.maxOuterRadius - this.innerRadius
    const outerRadius = this.innerRadius + this.localNorm * arcWidth

    // Draw the segment arc
    this.drawArc(
      this.innerRadius,
      outerRadius,
      this.startAngle,
      this.endAngle,
      this.color, // Use segment color
      this.color, // Border color same as fill
      0.25, // Alpha
      lineWidth,
    )
  }

  /**
   * Draw main segment with global and overlay data
   */
  private drawMainSegment(isHovered: boolean, lineWidth: number) {
    // Only draw if we have a valid global norm
    if (typeof this.globalNorm !== 'number' || this.globalNorm <= 0) return

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
      0.25, // Alpha
      lineWidth,
    )

    // Draw overlays if present
    const overlays = this.pixiUIStore.segmentOverlays.get(this.attributeKey)
    const singleComparison = overlays?.size === 1

    if (overlays && overlays.size > 0) {
      overlays.forEach((overlay) => {
        // Calculate local outer radius
        const localOuterRadius = this.innerRadius + overlay.norm * arcWidth

        // Determine colors based on comparison mode
        let fillColor = overlay.color
        let borderColor = Colors.STANDARD_BORDER

        if (singleComparison) {
          // For single comparison, color based on whether local is bigger than global
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
          0.25, // Alpha
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
    // Define the arc path
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

    // Apply stroke
    this.stroke({ color: borderColor ?? fillColor, width: lineWidth })

    // Apply fill if enabled in theme
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

  clearLocalOverlay(): void {
    this.pixiUIStore.clearSegmentOverlays(this.attributeKey)
    this.localNorm = undefined
    this.color = 0x000000
    this.redraw()
  }

  /**
   * Clear a specific point overlay by its ID
   * @param id - The ID of the point to clear
   */
  clearPointOverlay(id: string): void {
    const overlays = this.pixiUIStore.segmentOverlays.get(this.attributeKey)
    if (!overlays || !overlays.has(id)) return

    overlays.delete(id)

    if (overlays.size === 0) {
      this.localNorm = undefined
      this.color = 0x000000
    } else {
      const lastOverlay = Array.from(overlays.values()).pop()
      this.localNorm = lastOverlay?.norm
      this.color = lastOverlay?.color ?? 0x000000
    }
    this.redraw()
  }

  setLocalOverlay(id: string, localNorm: number, color: number): void {
    this.pixiUIStore.setSegmentOverlay(this.attributeKey, id, localNorm, color)
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
    if (hovered) {
      this.pixiUIStore.setHoveredSegment(this.attributeKey)
    } else if (this.pixiUIStore.hoveredSegmentKey === this.attributeKey) {
      this.pixiUIStore.setHoveredSegment(null)
    }

    this.redraw()
    this.alpha = hovered ? 0.8 : 1.0
  }

  getTooltipContent(): string {
    let content = `Attribute: ${this.attributeKey}\n`

    if (this.mini) {
      const fingerprintId =
        this.parent instanceof PixiAttributeRing
          ? (this.parent as PixiAttributeRing).getFingerprint() || 'Unknown'
          : 'Unknown'

      content += `Fingerprint: ${fingerprintId}\n`

      // Add normalized value if available
      if (this.localNorm !== undefined) {
        const percentage = Math.round(this.localNorm * 100)
        content += `Value: ${percentage}%`
      }

      // Add stats if available
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

      const overlays = this.pixiUIStore.segmentOverlays.get(this.attributeKey)
      if (overlays && overlays.size > 0) {
        tooltipLines.push('', 'Comparisons:')

        overlays.forEach((overlay, id) => {
          const delta = overlay.norm - this.globalNorm
          const direction = delta > 0 ? 'higher' : 'lower'
          const pctDiff = Math.abs(delta * 100).toFixed(1)

          tooltipLines.push(`Fingerprint ${id}: ${pctDiff}% ${direction}`)
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
