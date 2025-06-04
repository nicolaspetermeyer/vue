import { PixiGraphic } from '@/pixi/Base/PixiGraphic'
import type { AttributeStats, Position } from '@/models/data'
import { Hoverable } from '@/pixi/interactions/controllers/HoverManager'
import { Colors, Styles } from '@/config/Themes'
import { PolarGeometry } from '@/utils/geometry/PolarGeometry'
import { PixiAttributeRing } from '@/pixi/PixiAttributeRing'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { useAttributeFilterStore } from '@/stores/attributeFilterStore'

export class PixiAttributeSegment extends PixiGraphic implements Hoverable {
  public attributeKey: string
  private globalNorm: number
  private localNorm: number | undefined
  public stats: AttributeStats
  private localOverlays: Map<string, { color: number; norm: number; fingerprintName: string }> =
    new Map()

  private static segmentRegistry: PixiAttributeSegment[] = []

  public startAngle: number = 0
  public endAngle: number = 0
  public innerRadius: number = 0
  public maxOuterRadius: number = 0
  public centerX: number = 0
  public centerY: number = 0
  public color: number = 0x000000
  private mini: boolean = false

  private isHovered: boolean = false
  private isSelected: boolean = false
  private inSegment: boolean = false
  private inInnerCircle: boolean = false

  private featureCount = useAttributeFilterStore().featureCount

  constructor(options: {
    attributeKey: string
    mini: boolean
    globalNorm: number
    localNorm?: number
    color?: number
    stats?: AttributeStats
    fingerprintId?: string
  }) {
    super()

    this.attributeKey = options.attributeKey
    this.globalNorm = options.globalNorm
    this.localNorm = options.localNorm
    this.mini = options.mini
    this.stats = options.stats || {
      mean: 0,
      normMean: 0,
      std: 0,
      min: 0,
      max: 0,
      isGlobal: true,
    }

    if (this.mini) {
      if (options.color !== undefined) {
        this.color = options.color
      }
      this.localNorm = options.localNorm
    }
    // For global rings, handle fingerprint data as overlay
    else if (options.localNorm !== undefined && options.fingerprintId) {
      this.localOverlays.set(options.fingerprintId, {
        norm: options.localNorm,
        color: options.color ?? 0x000000,
        fingerprintName: options.attributeKey,
      })
    }

    this.eventMode = 'static'
    this.cursor = 'default'

    PixiAttributeSegment.segmentRegistry.push(this)
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

    this.alpha = mini ? 0.9 : 0.5

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

    let lineWidth = this.isHovered ? Styles.LINEWIDTH_HOVER_MINI : Styles.LINEWIDTH_MINI
    this.alpha = this.isHovered ? 1 : 0.9
    let color = this.color

    if (this.featureCount > 50) {
      lineWidth = this.isHovered ? Styles.LINEWIDTH_HOVER_MINI_THIN : Styles.LINEWIDTH_MINI_THIN
    }

    // Draw inner circle in the mini ring

    // this.circle(this.centerX, this.centerY, this.innerRadius)
    // this.fill({ color: this.color, alpha: this.alpha })

    // Calculate the outer radius based on the value
    const arcWidth = this.maxOuterRadius - this.innerRadius
    let outerRadius = this.innerRadius + (0.5 + (this.localNorm - this.globalNorm)) * arcWidth
    let innerScale = this.innerRadius

    if (this.isHovered) {
      const expansionFactor = 1.1
      outerRadius = Math.min(outerRadius * expansionFactor, this.maxOuterRadius * 1.05)
      innerScale = Math.min(this.innerRadius * expansionFactor, outerRadius * 0.95)
      this.alpha = 1
    }

    // Draw the segment arc
    this.drawArc(
      innerScale,
      outerRadius,
      this.startAngle,
      this.endAngle,
      this.color,
      this.color, // Border color
      this.alpha,
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
    const globalOuterRadius = this.innerRadius + 0.5 * arcWidth

    // Draw global segment
    this.drawArc(
      this.innerRadius,
      globalOuterRadius,
      this.startAngle,
      this.endAngle,
      Colors.GLOBAL_SEGMENT,
      Colors.STANDARD_BORDER,
      this.alpha,
      lineWidth,
    )

    // Draw overlays if present
    const overlays = this.localOverlays
    // const singleComparison = overlays?.size === 1

    if (overlays && overlays.size > 0) {
      overlays.forEach((overlay) => {
        const normDifference = overlay.norm - this.globalNorm
        const localOuterRadius = this.innerRadius + (0.5 + normDifference) * arcWidth

        let fillColor = overlay.color
        let borderColor = overlay.color

        // if (singleComparison) {
        //   fillColor =
        //     localOuterRadius > globalOuterRadius
        //       ? Colors.OVERLAY_SEGMENT_BIGGER
        //       : Colors.OVERLAY_SEGMENT_SMALLER
        //   borderColor = fillColor
        // }

        // Draw the overlay arc
        this.drawArc(
          this.innerRadius,
          localOuterRadius,
          this.startAngle,
          this.endAngle,
          fillColor,
          borderColor,
          this.alpha,
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

    if (Colors.FILL_STYLE || this.mini) {
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

  setLocalOverlay(id: string, localNorm: number, color: number, fingerprintName: string): void {
    this.localOverlays.set(id, { norm: localNorm, color, fingerprintName })
    this.localNorm = localNorm
    this.color = color

    this.redraw()
  }

  containsGlobal(global: Position): boolean {
    const local = this.parent.toLocal(global)

    // Convert to polar coordinates
    const { radius, angle } = PolarGeometry.cartesianToPolar(local, this.centerX, this.centerY)

    //limit hit detection to drawn area
    const arcWidth = this.maxOuterRadius - this.innerRadius
    const actualOuterRadius = this.innerRadius + 0.5 * arcWidth

    const inSegment = PolarGeometry.isInSegment(
      radius,
      angle,
      this.innerRadius,
      this.maxOuterRadius,
      this.startAngle,
      this.endAngle,
      actualOuterRadius,
    )

    if (this.mini) {
      const inInnerCircle = radius <= this.innerRadius
      if (inSegment) {
        this.inSegment = true
        this.inInnerCircle = false
        return true
      }
      if (inInnerCircle) {
        this.inInnerCircle = true
        this.inSegment = false
        return true
      }
    }

    return inSegment
  }

  setHovered(hovered: boolean, propagate: boolean = true) {
    if (this.isHovered !== hovered) {
      this.isHovered = hovered
      this.redraw()
      this.alpha = hovered ? 1 : 0.5

      if (propagate) {
        PixiAttributeSegment.segmentRegistry.forEach((segment) => {
          if (segment !== this && segment.attributeKey === this.attributeKey) {
            segment.setHovered(hovered, false)
          }
        })
      }
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
    if (this.mini && !this.inSegment) {
      return 'Right click to drill down'
    }
    let content = `Attribute: ${this.attributeKey}\n`
    const fingerprintStore = useFingerprintStore()
    const attributeFilterStore = useAttributeFilterStore()

    let metadataContent = ''
    if (
      attributeFilterStore.hasMetadata &&
      attributeFilterStore.attributeMetadata &&
      attributeFilterStore.attributeMetadata[this.attributeKey]
    ) {
      const metadata = attributeFilterStore.attributeMetadata[this.attributeKey]

      if (metadata.categories) {
        metadataContent += '\nMetadata:\n'

        // Add each category value pair from metadata
        Object.entries(metadata.categories).forEach(([category, value]) => {
          if (value) {
            metadataContent += `${category}: ${value}\n`
          }
        })
      }
    }

    if (this.mini) {
      const fingerprintId =
        this.parent instanceof PixiAttributeRing
          ? (this.parent as PixiAttributeRing).getFingerprint() || 'Unknown'
          : 'Unknown'

      const fp = fingerprintStore.getFingerprintById(fingerprintId)
      if (fp) {
        const stats = fp?.localStats[this.attributeKey]

        if (stats) {
          const _localNorm = stats.localNormMean ?? 0
          const delta = _localNorm - stats.normMean
          const direction = delta > 0 ? 'higher' : 'lower'
          const pctDiff = Math.abs(delta * 100).toFixed(1)

          content += `Fingerprint: ${fp.name}\n`
          content += `Normalized Mean: ${_localNorm.toFixed(2)}`
          content += `\nMean: ${stats.mean.toFixed(2)}`
          content += `\nSegment ${this.attributeKey}: ${pctDiff}% ${direction}`
          content += metadataContent
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
          const norm = overlay.norm.toFixed(2)
          const delta = overlay.norm - this.globalNorm
          const direction = delta > 0 ? 'higher' : 'lower'
          const pctDiff = Math.abs(delta * 100).toFixed(2)

          tooltipLines.push(
            `Fingerprint ${overlay.fingerprintName}: ${norm} ${pctDiff}% ${direction}`,
          )
        })
      }
      // Add metadata information if available
      if (metadataContent) {
        tooltipLines.push('', 'Metadata:')

        // Get individual metadata lines (skip the header)
        const metadataLines = metadataContent.split('\n').slice(2)
        tooltipLines.push(...metadataLines)
      }

      return tooltipLines.join('\n')
    }
  }

  destroy(options?: any): void {
    const index = PixiAttributeSegment.segmentRegistry.indexOf(this)
    if (index !== -1) {
      PixiAttributeSegment.segmentRegistry.splice(index, 1)
    }
    super.destroy(options)
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
