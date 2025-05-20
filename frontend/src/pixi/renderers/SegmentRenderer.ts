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
    const {
      innerRadius,
      maxOuterRadius,
      startAngle,
      endAngle,
      centerX,
      centerY,
      globalNorm = 0,
      isHovered = false,
      borderColor = Colors.STANDARD_BORDER,
    } = params

    graphics.clear()

    const arcWidth = maxOuterRadius - innerRadius

    const globalOuter = innerRadius + globalNorm * arcWidth

    // Apply hover effect
    const lineWidth = isHovered ? Styles.LINEWIDTH_HOVER : Styles.LINEWIDTH
    const alpha = 0.25
    // Draw global segment
    this.drawArcSegment(graphics, {
      centerX,
      centerY,
      innerRadius,
      outerRadius: globalOuter,
      startAngle,
      endAngle,
      fillColor: Colors.GLOBAL_SEGMENT,
      borderColor: borderColor,
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

    const overlayColorSmaller = Colors.OVERLAY_SEGMENT_SMALLER
    const overlayColorBigger = Colors.OVERLAY_SEGMENT_BIGGER

    if (singleComparison) {
      // if only one local overlay, compare it with the global overlay
      if (localOuter !== null && localOuter > globalOuter) {
        this.drawArcSegment(graphics, {
          centerX,
          centerY,
          innerRadius,
          outerRadius: localOuter,
          startAngle,
          endAngle,
          fillColor: overlayColorBigger,
          borderColor: overlayColorBigger,
          alpha,
          lineWidth,
        })
      } else {
        this.drawArcSegment(graphics, {
          centerX,
          centerY,
          innerRadius,
          outerRadius: localOuter,
          startAngle,
          endAngle,
          fillColor: overlayColorSmaller,
          borderColor: overlayColorSmaller,
          alpha,
          lineWidth,
        })
      }
    } else {
      // if more than one local overlay, draw all local overlays with their given color
      this.drawArcSegment(graphics, {
        centerX,
        centerY,
        innerRadius,
        outerRadius: localOuter,
        startAngle,
        endAngle,
        fillColor: color,
        borderColor: color,
        alpha,
        lineWidth,
      })
    }
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
