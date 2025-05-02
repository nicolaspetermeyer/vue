import { Container, FederatedPointerEvent, FederatedWheelEvent, PointData } from 'pixi.js'
import { InteractionConfig } from '@/config/InteractionConfigs'

/**
 * Configuration options for the ViewportController
 */
export interface ViewportControllerOptions {
  /** Initial scale of the viewport */
  initialScale?: number
  /** Minimum allowed zoom level */
  minZoom?: number
  /** Maximum allowed zoom level */
  maxZoom?: number
  /** Speed factor for zooming */
  zoomSpeed?: number
  /** Whether to center zoom on the pointer position */
  zoomToPointer?: boolean
  /** Whether panning is enabled */
  enablePan?: boolean
  /** Initial viewport position X */
  initialX?: number
  /** Initial viewport position Y */
  initialY?: number
}

/**
 * Manages viewport transformations including panning and zooming
 * for a PIXI Container.
 */
export class ViewportController {
  /** The container being controlled */
  private container: Container
  /** Current viewport scale */
  private viewportScale: number
  /** Current viewport X position */
  private viewportX: number
  /** Current viewport Y position */
  private viewportY: number
  /** Last pointer position for drag calculations */
  private lastPanPosition: PointData | null = null
  /** Whether panning is currently active */
  private isPanning: boolean = false
  /** Configuration options */
  private options: Required<ViewportControllerOptions>
  /** Optional callback for when viewport changes */
  private onViewportChange?: (scale: number) => void

  /**
   * Creates a new ViewportController instance
   *
   * @param container - The PIXI Container to control
   * @param options - Configuration options
   * @param onChange - Optional callback when viewport changes
   */
  constructor(
    container: Container,
    options: ViewportControllerOptions = {},
    onChange?: (scale: number) => void,
  ) {
    this.container = container
    this.onViewportChange = onChange

    // Set default options with provided overrides
    this.options = {
      initialScale: options.initialScale ?? InteractionConfig.INITIAL_SCALE,
      minZoom: options.minZoom ?? InteractionConfig.MIN_ZOOM,
      maxZoom: options.maxZoom ?? InteractionConfig.MAX_ZOOM,
      zoomSpeed: options.zoomSpeed ?? InteractionConfig.ZOOM_SPEED,
      zoomToPointer: options.zoomToPointer ?? InteractionConfig.ZOOM_TO_POINTER,
      enablePan: options.enablePan ?? InteractionConfig.ENABLE_PAN,
      initialX: options.initialX ?? 0,
      initialY: options.initialY ?? 0,
    }

    // Initialize with provided scale and position
    this.viewportScale = this.options.initialScale
    this.viewportX = this.options.initialX
    this.viewportY = this.options.initialY

    this.applyTransform()
  }

  /**
   * Handles mouse wheel events for zooming
   *
   * @param e - The wheel event
   */
  public handleWheel = (e: FederatedWheelEvent): void => {
    e.preventDefault?.()
    e.stopPropagation()

    // Get the mouse position relative to the container
    const mousePosition = e.getLocalPosition(this.container.parent)

    // Convert screen position to world position before zoom
    const mouseWorldPos = this.screenToWorld(mousePosition)

    // Calculate zoom factor based on wheel delta
    const delta = e.deltaY > 0 ? -1 : 1
    const zoomFactor = 1 + delta * this.options.zoomSpeed

    // Calculate new scale, constrained by min/max
    const newScale = Math.max(
      this.options.minZoom,
      Math.min(this.options.maxZoom, this.viewportScale * zoomFactor),
    )

    // If scale didn't change (due to constraints), exit early
    if (newScale === this.viewportScale) return

    // Save the old scale for calculations
    const oldScale = this.viewportScale
    this.viewportScale = newScale

    if (this.options.zoomToPointer) {
      // Adjust viewport position to keep mouse position fixed
      this.viewportX = mousePosition.x - mouseWorldPos.x * this.viewportScale
      this.viewportY = mousePosition.y - mouseWorldPos.y * this.viewportScale
    }

    this.applyTransform()

    // Notify about scale change
    if (this.onViewportChange) {
      this.onViewportChange(this.viewportScale)
    }
  }

  /**
   * Begins pan operation when pointer is down
   *
   * @param e - The pointer down event
   */
  public handlePointerDown = (e: FederatedPointerEvent): void => {
    // Only proceed if panning is enabled and using left button
    if (!this.options.enablePan || (e.button !== 0 && e.button !== undefined)) return

    // Store current position for drag calculation
    const pos = e.getLocalPosition(this.container.parent)
    this.lastPanPosition = { x: pos.x, y: pos.y }
    this.isPanning = true
  }

  /**
   * Handles pointer movement during pan
   *
   * @param e - The pointer move event
   */
  public handlePointerMove = (e: FederatedPointerEvent): void => {
    if (!this.isPanning || !this.lastPanPosition) return

    // Calculate the delta movement
    const pos = e.getLocalPosition(this.container.parent)
    const dx = pos.x - this.lastPanPosition.x
    const dy = pos.y - this.lastPanPosition.y

    // Update viewport position
    this.viewportX += dx
    this.viewportY += dy

    // Store new position for next move
    this.lastPanPosition = { x: pos.x, y: pos.y }

    this.applyTransform()
  }

  /**
   * Ends pan operation when pointer is up
   */
  public handlePointerUp = (): void => {
    this.isPanning = false
    this.lastPanPosition = null
  }

  /**
   * Transform a screen position to world position
   *
   * @param screenPos - Position in screen coordinates
   * @returns Position in world coordinates
   */
  public screenToWorld(screenPos: PointData): PointData {
    return {
      x: (screenPos.x - this.viewportX) / this.viewportScale,
      y: (screenPos.y - this.viewportY) / this.viewportScale,
    }
  }

  /**
   * Transform a world position to screen position
   *
   * @param worldPos - Position in world coordinates
   * @returns Position in screen coordinates
   */
  public worldToScreen(worldPos: PointData): PointData {
    return {
      x: worldPos.x * this.viewportScale + this.viewportX,
      y: worldPos.y * this.viewportScale + this.viewportY,
    }
  }

  /**
   * Applies the current transformation to the container
   */
  public applyTransform(): void {
    this.container.position.set(this.viewportX, this.viewportY)
    this.container.scale.set(this.viewportScale, this.viewportScale)
  }

  /**
   * Reset the viewport to initial values or specified position
   *
   * @param x - Optional X position to center on
   * @param y - Optional Y position to center on
   * @param scale - Optional scale to set
   */
  public resetView(x?: number, y?: number, scale?: number): void {
    this.viewportScale = scale ?? this.options.initialScale
    this.viewportX = x ?? this.options.initialX
    this.viewportY = y ?? this.options.initialY

    this.applyTransform()

    // Notify about scale change
    if (this.onViewportChange) {
      this.onViewportChange(this.viewportScale)
    }
  }

  /**
   * Get the current viewport scale
   *
   * @returns Current scale factor
   */
  public getScale(): number {
    return this.viewportScale
  }

  /**
   * Get the current viewport position
   *
   * @returns Current viewport position
   */
  public getPosition(): PointData {
    return {
      x: this.viewportX,
      y: this.viewportY,
    }
  }

  /**
   * Check if panning is currently active
   *
   * @returns True if panning, false otherwise
   */
  public isPanningActive(): boolean {
    return this.isPanning
  }
}
