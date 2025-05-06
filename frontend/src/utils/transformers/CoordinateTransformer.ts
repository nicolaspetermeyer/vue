import { Container, PointData, Matrix, Rectangle } from 'pixi.js'

/**
 * Handles coordinate transformations between different spaces
 */
export class CoordinateTransformer {
  /**
   * Transforms a global coordinate to the local space of a container,
   * accounting for all transformations in the container's hierarchy
   *
   * @param globalPoint - The global coordinate
   * @param targetContainer - The container to transform to
   * @returns The point in the container's local space
   */
  static globalToLocal(globalPoint: PointData, targetContainer: Container): PointData {
    // Get the global-to-local transform matrix
    const globalToLocal = targetContainer.worldTransform.clone().invert()

    // Apply the transformation
    return globalToLocal.apply(globalPoint)
  }

  /**
   * Transforms a local coordinate to the global space
   *
   * @param localPoint - The local coordinate
   * @param sourceContainer - The container the point is local to
   * @returns The point in global space
   */
  static localToGlobal(localPoint: PointData, sourceContainer: Container): PointData {
    return sourceContainer.worldTransform.apply(localPoint)
  }

  /**
   * Transforms a point from one container's space to another's
   *
   * @param point - The point to transform
   * @param fromContainer - The source container
   * @param toContainer - The target container
   * @returns The transformed point
   */
  static transformBetweenContainers(
    point: PointData,
    fromContainer: Container,
    toContainer: Container,
  ): PointData {
    // First transform to global space
    const globalPoint = this.localToGlobal(point, fromContainer)

    // Then transform to target local space
    return this.globalToLocal(globalPoint, toContainer)
  }

  /**
   * Transforms a rectangle from global to local coordinates
   *
   * @param rect - The rectangle in global coordinates
   * @param targetContainer - The container to transform to
   * @returns The rectangle in local coordinates
   */
  static globalToLocalRect(rect: Rectangle, targetContainer: Container): Rectangle {
    // Transform the top-left corner
    const topLeft = this.globalToLocal({ x: rect.x, y: rect.y }, targetContainer)

    // Transform the bottom-right corner
    const bottomRight = this.globalToLocal(
      { x: rect.x + rect.width, y: rect.y + rect.height },
      targetContainer,
    )

    // Create a new rectangle from the transformed points
    const x = Math.min(topLeft.x, bottomRight.x)
    const y = Math.min(topLeft.y, bottomRight.y)
    const width = Math.abs(bottomRight.x - topLeft.x)
    const height = Math.abs(bottomRight.y - topLeft.y)

    return new Rectangle(x, y, width, height)
  }

  /**
   * Transforms a rectangle from local to global coordinates
   *
   * @param rect - The rectangle in local coordinates
   * @param sourceContainer - The container the rectangle is local to
   * @returns The rectangle in global coordinates
   */
  static localToGlobalRect(rect: Rectangle, sourceContainer: Container): Rectangle {
    // Transform the top-left corner
    const topLeft = this.localToGlobal({ x: rect.x, y: rect.y }, sourceContainer)

    // Transform the bottom-right corner
    const bottomRight = this.localToGlobal(
      { x: rect.x + rect.width, y: rect.y + rect.height },
      sourceContainer,
    )

    // Create a new rectangle from the transformed points
    const x = Math.min(topLeft.x, bottomRight.x)
    const y = Math.min(topLeft.y, bottomRight.y)
    const width = Math.abs(bottomRight.x - topLeft.x)
    const height = Math.abs(bottomRight.y - topLeft.y)

    return new Rectangle(x, y, width, height)
  }

  /**
   * Creates a transformation matrix for viewport transformations
   *
   * @param scale - The viewport scale
   * @param translateX - The viewport X translation
   * @param translateY - The viewport Y translation
   * @returns A transformation matrix
   */
  static createViewportMatrix(scale: number, translateX: number, translateY: number): Matrix {
    const matrix = new Matrix()
    matrix.scale(scale, scale)
    matrix.translate(translateX, translateY)
    return matrix
  }

  /**
   * Applies viewport transformations to a point
   *
   * @param point - The point to transform
   * @param scale - The viewport scale
   * @param translateX - The viewport X translation
   * @param translateY - The viewport Y translation
   * @param inverse - Whether to apply the inverse transformation
   * @returns The transformed point
   */
  static applyViewportTransform(
    point: PointData,
    scale: number,
    translateX: number,
    translateY: number,
    inverse: boolean = false,
  ): PointData {
    if (inverse) {
      // Inverse transformation (global to local)
      return {
        x: (point.x - translateX) / scale,
        y: (point.y - translateY) / scale,
      }
    } else {
      // Forward transformation (local to global)
      return {
        x: point.x * scale + translateX,
        y: point.y * scale + translateY,
      }
    }
  }
}
