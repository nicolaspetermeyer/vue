import { Rectangle, Container, PointData } from 'pixi.js'
import { CoordinateTransformer } from './CoordinateTransformer'

/**
 * Handles transformations related to selection operations
 */
export class SelectionTransformer {
  /**
   * Creates a brush selection rectangle from drag points
   *
   * @param start - The starting point of the drag
   * @param end - The ending point of the drag
   * @returns A rectangle representing the selection area
   */
  static createBrushRect(start: PointData, end: PointData): Rectangle {
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)

    return new Rectangle(x, y, width, height)
  }

  /**
   * Transforms a selection rectangle from local to global coordinates
   *
   * @param rect - The local space rectangle
   * @param container - The container the rectangle is local to
   * @returns A global space rectangle
   */
  static localToGlobalRect(rect: Rectangle, container: Container): Rectangle {
    // Transform top-left and bottom-right corners
    const topLeft = CoordinateTransformer.localToGlobal({ x: rect.x, y: rect.y }, container)

    const bottomRight = CoordinateTransformer.localToGlobal(
      { x: rect.x + rect.width, y: rect.y + rect.height },
      container,
    )

    // Create a new rectangle from the transformed points
    const x = Math.min(topLeft.x, bottomRight.x)
    const y = Math.min(topLeft.y, bottomRight.y)
    const width = Math.abs(bottomRight.x - topLeft.x)
    const height = Math.abs(bottomRight.y - topLeft.y)

    return new Rectangle(x, y, width, height)
  }

  /**
   * Transforms a selection rectangle from global to local coordinates
   *
   * @param rect - The global space rectangle
   * @param container - The container to transform to
   * @returns A local space rectangle
   */
  static globalToLocalRect(rect: Rectangle, container: Container): Rectangle {
    // Transform top-left and bottom-right corners
    const topLeft = CoordinateTransformer.globalToLocal({ x: rect.x, y: rect.y }, container)

    const bottomRight = CoordinateTransformer.globalToLocal(
      { x: rect.x + rect.width, y: rect.y + rect.height },
      container,
    )

    // Create a new rectangle from the transformed points
    const x = Math.min(topLeft.x, bottomRight.x)
    const y = Math.min(topLeft.y, bottomRight.y)
    const width = Math.abs(bottomRight.x - topLeft.x)
    const height = Math.abs(bottomRight.y - topLeft.y)

    return new Rectangle(x, y, width, height)
  }
}
