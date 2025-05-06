import type { Projection } from '@/models/data'
import { Rectangle } from 'pixi.js'

/**
 * Handles projection data transformations and normalization
 */
export class ProjectionTransformer {
  /**
   * Normalizes projection points to the unit space [0..1]
   *
   * @param points - The projection points to normalize
   * @returns Normalized projection points
   */
  static normalizeToUnitSpace(points: Projection[]): Projection[] {
    if (points.length === 0) return []

    const bounds = this.calculateBounds(points)

    return this.normalizePoints(points, bounds)
  }

  /**
   * Normalizes projection points to fit within specified dimensions
   *
   * @param points - The projection points to normalize
   * @param targetWidth - The target width to fit points within
   * @param targetHeight - The target height to fit points within
   * @param padding - Optional padding to add around the edges
   * @returns Projection points normalized to the target dimensions
   */
  static normalizeToSize(
    points: Projection[],
    targetWidth: number,
    targetHeight: number,
    padding: number = 0,
  ): Projection[] {
    if (points.length === 0) return []

    // Convert to unit space first
    const unitPoints = this.normalizeToUnitSpace(points)

    // Calculate effective dimensions accounting for padding
    const effectiveWidth = targetWidth - padding * 2
    const effectiveHeight = targetHeight - padding * 2

    // Scale to target size and apply padding offset
    return unitPoints.map((point) => {
      return {
        ...point,
        pos: {
          x: point.pos.x * effectiveWidth + padding,
          y: point.pos.y * effectiveHeight + padding,
        },
      }
    })
  }

  /**
   * Calculates the bounding box for a set of projection points
   *
   * @param points - The points to analyze
   * @returns The bounding rectangle with min/max values
   */
  static calculateBounds(points: Projection[]): {
    minX: number
    maxX: number
    minY: number
    maxY: number
  } {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const point of points) {
      minX = Math.min(minX, point.pos.x)
      maxX = Math.max(maxX, point.pos.x)
      minY = Math.min(minY, point.pos.y)
      maxY = Math.max(maxY, point.pos.y)
    }

    return { minX, maxX, minY, maxY }
  }

  /**
   * Normalizes points based on calculated bounds
   *
   * @param points - The points to normalize
   * @param bounds - The bounding rectangle
   * @returns Normalized points in the range [0..1]
   */
  static normalizePoints(
    points: Projection[],
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
  ): Projection[] {
    const { minX, maxX, minY, maxY } = bounds

    // Calculate ranges
    const rangeX = maxX - minX
    const rangeY = maxY - minY

    // Avoid division by zero
    const scaleX = rangeX !== 0 ? 1 / rangeX : 0
    const scaleY = rangeY !== 0 ? 1 / rangeY : 0

    return points.map((point) => {
      return {
        ...point,
        pos: {
          x: (point.pos.x - minX) * scaleX,
          y: (point.pos.y - minY) * scaleY,
        },
      }
    })
  }

  /**
   * Filter projections to only those contained within the given bounds
   *
   * @param points - The points to filter
   * @param bounds - The rectangle to filter by
   * @returns IDs of points within the bounds
   */
  static getPointsInBounds(points: Projection[], bounds: Rectangle): number[] {
    return points
      .filter((point) => bounds.contains(point.pos.x, point.pos.y))
      .map((point) => point.id)
  }

  /**
   * Finds the closest point to a given position
   *
   * @param points - The points to search
   * @param position - The position to search from
   * @param maxDistance - Maximum distance to consider
   * @returns The closest point or null if none found within maxDistance
   */
  static findClosestPoint(
    points: Projection[],
    position: { x: number; y: number },
    maxDistance: number,
  ): Projection | null {
    let closestPoint: Projection | null = null
    let minDistance = Infinity

    for (const point of points) {
      const dx = position.x - point.pos.x
      const dy = position.y - point.pos.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < minDistance && distance <= maxDistance) {
        minDistance = distance
        closestPoint = point
      }
    }

    return closestPoint
  }
}
