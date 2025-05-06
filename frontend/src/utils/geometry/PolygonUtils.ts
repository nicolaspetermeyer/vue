import { PointData } from 'pixi.js'

/**
 * Utility class for polygon-related operations
 */
export class PolygonUtils {
  /**
   * Check if a point is inside a polygon using ray casting algorithm
   *
   * @param point - The point to check
   * @param polygon - Array of points defining the polygon
   * @returns true if the point is inside the polygon
   */
  static isPointInPolygon(point: PointData, polygon: PointData[]): boolean {
    if (polygon.length < 3) return false

    let inside = false
    const x = point.x
    const y = point.y

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x
      const yi = polygon[i].y
      const xj = polygon[j].x
      const yj = polygon[j].y

      // Check if point is on the edge
      const onEdge =
        (yi === y && xi === x) ||
        (yj === y && xj === x) ||
        (yi !== yj &&
          y === yi + ((yj - yi) * (x - xi)) / (xj - xi) &&
          x >= Math.min(xi, xj) &&
          x <= Math.max(xi, xj))

      if (onEdge) return true

      // Ray casting algorithm
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

      if (intersect) {
        inside = !inside
      }
    }

    return inside
  }

  /**
   * Get the bounding rectangle of a polygon
   *
   * @param polygon - Array of points defining the polygon
   * @returns Object with x, y, width, height representing the bounding box
   */
  static getBoundingBox(polygon: PointData[]): {
    x: number
    y: number
    width: number
    height: number
  } {
    if (polygon.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    let minX = polygon[0].x
    let minY = polygon[0].y
    let maxX = polygon[0].x
    let maxY = polygon[0].y

    for (let i = 1; i < polygon.length; i++) {
      const point = polygon[i]
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }
}
