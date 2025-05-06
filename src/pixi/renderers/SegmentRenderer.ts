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
  globalNorm: number
  localNorm?: number
  isHovered?: boolean
  color: number
  borderColor: number
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
      globalNorm,
      localNorm,
      isHovered = false,
      color,
      borderColor,
    } = params

    graphics.clear()

    const arcWidth = maxOuterRadius - innerRadius
    const globalOuter = innerRadius + globalNorm * arcWidth
    const localOuter = localNorm !== undefined ? innerRadius + localNorm * arcWidth : null

    // Helper function to draw an arc segment
    const drawArc = (
      outerR: number,
      fillColor: number,
      alpha: number,
      lineWidth: number = Styles.LINEWIDTH,
      borderColor: number = Colors.STANDARD_BORDER,
    ) => {
      graphics
        .moveTo(
          centerX + innerRadius * Math.cos(startAngle),
          centerY + innerRadius * Math.sin(startAngle),
        )
        .lineTo(centerX + outerR * Math.cos(startAngle), centerY + outerR * Math.sin(startAngle))
        .arc(centerX, centerY, outerR, startAngle, endAngle)
        .lineTo(
          centerX + innerRadius * Math.cos(endAngle),
          centerY + innerRadius * Math.sin(endAngle),
        )
        .arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
        .closePath()
        .stroke({ color: borderColor, width: lineWidth })
        .fill({ color: fillColor, alpha: alpha })
    }

    // Define colors
    const globalColor = Colors.GLOBAL_SEGMENT
    const overlayColorSmaller = Colors.OVERLAY_SEGMENT_SMALLER
    const overlayColorBigger = Colors.OVERLAY_SEGMENT_BIGGER
    const overlayColor = color ?? Colors.STANDARD_OVERLAY

    // Apply hover effect
    const alphaMultiplier = isHovered ? 1.2 : 1.0
    const lineWidth = isHovered ? Styles.LINEWIDTH_HOVER : Styles.LINEWIDTH
    if (localOuter !== null) {
      drawArc(localOuter, overlayColor, 0.25, lineWidth)
      drawArc(globalOuter, globalColor, 0.2, lineWidth)
    } else {
      drawArc(globalOuter, globalColor, 0.2, lineWidth)
    }

    // // Draw segments based on local vs global comparison
    // if (localOuter !== null && localOuter > globalOuter) {
    //   drawArc(localOuter, overlayColorBigger, 0.25, lineWidth)
    //   drawArc(globalOuter, globalColor, 0.2, lineWidth)
    // } else {
    //   drawArc(globalOuter, globalColor, 0.2, lineWidth)
    //   if (localOuter !== null) {
    //     drawArc(localOuter, overlayColorSmaller, 0.25, lineWidth)
    //   }
    // }
  }

  // Add a new method for rendering overlays

  /**
   * Render a local overlay on top of the segment
   */
  static renderOverlay(
    graphics: Graphics,
    params: {
      innerRadius: number
      maxOuterRadius: number
      startAngle: number
      endAngle: number
      centerX: number
      centerY: number
      localNorm: number
      isHovered?: boolean
      color: number
    },
  ): void {
    const {
      innerRadius,
      maxOuterRadius,
      startAngle,
      endAngle,
      centerX,
      centerY,
      localNorm,
      isHovered = false,
      color,
    } = params

    const arcWidth = maxOuterRadius - innerRadius
    const localOuter = innerRadius + localNorm * arcWidth

    // Helper function to draw an arc segment with transparency
    const drawArc = (
      outerR: number,
      fillColor: number,
      alpha: number,
      lineWidth: number = Styles.LINEWIDTH,
    ) => {
      graphics
        .moveTo(
          centerX + innerRadius * Math.cos(startAngle),
          centerY + innerRadius * Math.sin(startAngle),
        )
        .lineTo(centerX + outerR * Math.cos(startAngle), centerY + outerR * Math.sin(startAngle))
        .arc(centerX, centerY, outerR, startAngle, endAngle)
        .lineTo(
          centerX + innerRadius * Math.cos(endAngle),
          centerY + innerRadius * Math.sin(endAngle),
        )
        .arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
        .closePath()
        .stroke({ color: fillColor, width: lineWidth })
        .fill({ color: fillColor, alpha: alpha })
    }

    // Apply the overlay with a semi-transparent fill
    const lineWidth = isHovered ? Styles.LINEWIDTH_HOVER : Styles.LINEWIDTH
    drawArc(localOuter, color, 0.25, lineWidth)
  }
}
