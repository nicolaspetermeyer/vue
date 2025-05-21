import { Graphics } from 'pixi.js'
import { Colors, Styles } from '@/config/Themes'

/**
 * Parameters for rendering a segment
 */
export interface SegmentRenderParams {
  innerRadius: number
  maxOuterRadius: number
  startAngle: number
  endAngle: number
  centerX: number
  centerY: number
  globalNorm?: number
  localNorm?: number
  isHovered?: boolean
  color: number
  borderColor?: number
  alpha?: number
  singleComparison?: boolean
  mini?: boolean
}

/**
 * Service for rendering attribute segments with consistent styling
 */
export class SegmentRenderer {
  /**
   * Render a segment with global and optional local overlays
   *
   * @param graphics - The graphics object to render on
   * @param params - Render parameters
   */
  static renderSegment(graphics: Graphics, params: SegmentRenderParams): void {
    graphics.clear()
    const {
      innerRadius,
      maxOuterRadius,
      startAngle,
      endAngle,
      centerX,
      centerY,
      globalNorm = 0,
      color,
      isHovered = false,
      borderColor = Colors.STANDARD_BORDER,
      alpha = 0.25,
      mini,
    } = params

    const arcWidth = maxOuterRadius - innerRadius

    const outerRadius = innerRadius + globalNorm * arcWidth

    // Apply hover effect
    const lineWidth = isHovered ? Styles.LINEWIDTH_HOVER : Styles.LINEWIDTH
    const fillColor = mini ? color : Colors.GLOBAL_SEGMENT
    let bc = mini ? color : borderColor

    // Draw global segment
    this.drawArcSegment(graphics, {
      centerX,
      centerY,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fillColor,
      borderColor: bc,
      alpha,
      lineWidth,
    })
  }

  /**
   * Render a local overlay on top of the segment
   */
  static renderOverlay(graphics: Graphics, params: SegmentRenderParams): void {
    const {
      innerRadius,
      maxOuterRadius,
      startAngle,
      endAngle,
      centerX,
      centerY,
      globalNorm = 0,
      localNorm = 0,
      isHovered = false,
      color,
      alpha = 0.25,
      singleComparison,
    } = params

    const arcWidth = maxOuterRadius - innerRadius
    const globalOuter = innerRadius + globalNorm * arcWidth
    const localOuter = innerRadius + localNorm * arcWidth

    const lineWidth = isHovered ? Styles.LINEWIDTH_HOVER : Styles.LINEWIDTH

    let fillColor = color
    let borderColor = fillColor

    if (singleComparison) {
      fillColor =
        localOuter > globalOuter ? Colors.OVERLAY_SEGMENT_BIGGER : Colors.OVERLAY_SEGMENT_SMALLER
      borderColor = fillColor
    }

    this.drawArcSegment(graphics, {
      centerX,
      centerY,
      innerRadius,
      outerRadius: localOuter,
      startAngle,
      endAngle,
      fillColor,
      borderColor,
      alpha,
      lineWidth,
    })
  }

  private static drawArcSegment(
    graphics: Graphics,
    params: {
      centerX: number
      centerY: number
      innerRadius: number
      outerRadius: number
      startAngle: number
      endAngle: number
      fillColor: number
      borderColor: number
      alpha: number
      lineWidth: number
    },
  ): void {
    const {
      centerX,
      centerY,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fillColor,
      borderColor,
      alpha,
      lineWidth,
    } = params

    graphics
      .moveTo(
        centerX + innerRadius * Math.cos(startAngle),
        centerY + innerRadius * Math.sin(startAngle),
      )
      .lineTo(
        centerX + outerRadius * Math.cos(startAngle),
        centerY + outerRadius * Math.sin(startAngle),
      )
      .arc(centerX, centerY, outerRadius, startAngle, endAngle)
      .lineTo(
        centerX + innerRadius * Math.cos(endAngle),
        centerY + innerRadius * Math.sin(endAngle),
      )
      .arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
      .closePath()
      .stroke({ color: borderColor ?? fillColor, width: lineWidth })
    if (Colors.FILL_STYLE) {
      graphics.fill({ color: fillColor, alpha: alpha })
    }
  }
}
