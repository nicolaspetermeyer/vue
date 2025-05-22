import { PointData } from 'pixi.js'

/**
 * Utilities for polar coordinate geometry calculations
 */
export class PolarGeometry {
  /**
   * Convert cartesian coordinates to polar coordinates
   *
   * @param point - Cartesian coordinates (x,y) relative to center
   * @param centerX - X coordinate of the center point
   * @param centerY - Y coordinate of the center point
   * @returns Polar coordinates {radius, angle} in radians
   */
  static cartesianToPolar(
    point: PointData,
    centerX: number = 0,
    centerY: number = 0,
  ): { radius: number; angle: number } {
    const dx = point.x - centerX
    const dy = point.y - centerY
    const radius = Math.sqrt(dx * dx + dy * dy)

    // Calculate angle and normalize to [0, 2π]
    let angle = Math.atan2(dy, dx)
    if (angle < 0) angle += Math.PI * 2

    return { radius, angle }
  }

  /**
   * Convert polar coordinates to cartesian coordinates
   *
   * @param radius - Distance from center
   * @param angle - Angle in radians
   * @param centerX - X coordinate of the center point
   * @param centerY - Y coordinate of the center point
   * @returns Cartesian coordinates {x, y}
   */
  static polarToCartesian(
    radius: number,
    angle: number,
    centerX: number = 0,
    centerY: number = 0,
  ): PointData {
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  }

  /**
   * Check if a point in polar coordinates is within a circular segment
   *
   * @param radius - Distance from center
   * @param angle - Angle in radians (0 to 2π)
   * @param innerRadius - Inner radius of segment
   * @param outerRadius - Outer radius of segment
   * @param startAngle - Start angle of segment in radians
   * @param endAngle - End angle of segment in radians
   * @returns True if point is in segment
   */
  static isInSegment(
    radius: number,
    angle: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
    actualOuterRadius?: number,
  ): boolean {
    // Normalize angles to [0, 2π)
    let start = startAngle % (Math.PI * 2)
    if (start < 0) start += Math.PI * 2

    let end = endAngle % (Math.PI * 2)
    if (end < 0) end += Math.PI * 2

    let angleNorm = angle % (Math.PI * 2)
    if (angleNorm < 0) angleNorm += Math.PI * 2

    let inAngleRange

    // Handle wrap-around case (when start > end, the segment crosses the 0/2π boundary)
    if (start <= end) {
      inAngleRange = angleNorm >= start && angleNorm <= end
    } else {
      inAngleRange = angleNorm >= start || angleNorm <= end
    }

    const effectiveOuterRadius = actualOuterRadius !== undefined ? actualOuterRadius : outerRadius

    const margin = 2
    const inRadiusRange = radius >= innerRadius - margin && radius <= effectiveOuterRadius + margin

    // Both angle and radius must be in range
    return inAngleRange && inRadiusRange
  }
}
