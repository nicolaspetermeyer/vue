import { Graphics } from 'pixi.js'
import { Colors } from '@/Themes/Colors'

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
    } = params

    graphics.clear()

    const arcWidth = maxOuterRadius - innerRadius
    const globalOuter = innerRadius + globalNorm * arcWidth
    const localOuter = localNorm !== undefined ? innerRadius + localNorm * arcWidth : null

    // Helper function to draw an arc segment
    const drawArc = (outerR: number, fillColor: number, alpha: number, lineWidth: number = 1) => {
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

    // Define colors
    const globalColor = Colors.GLOBAL_SEGMENT
    const overlayColorSmaller = Colors.OVERLAY_SEGMENT_SMALLER
    const overlayColorBigger = Colors.OVERLAY_SEGMENT_BIGGER

    // Apply hover effect
    const alphaMultiplier = isHovered ? 1.2 : 1.0
    const lineWidth = isHovered ? 2 : 1

    // Draw segments based on local vs global comparison
    if (localOuter !== null && localOuter > globalOuter) {
      drawArc(localOuter, overlayColorBigger, 0.25 * alphaMultiplier, lineWidth)
      drawArc(globalOuter, globalColor, 0.2 * alphaMultiplier, lineWidth)
    } else {
      drawArc(globalOuter, globalColor, 0.2 * alphaMultiplier, lineWidth)
      if (localOuter !== null) {
        drawArc(localOuter, overlayColorSmaller, 0.25 * alphaMultiplier, lineWidth)
      }
    }
  }
}
