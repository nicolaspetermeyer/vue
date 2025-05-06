import {
  Rectangle,
  FederatedPointerEvent,
  Graphics,
  PointData,
  Container,
  ContainerChild,
} from 'pixi.js'
import { EventEmitter } from 'eventemitter3'
import { HoverManager } from '@/utils/HoverManager'

/**
 * Configuration options for the SelectionController
 */
export interface SelectionControllerOptions {
  /** Fill color for brush selection */
  brushFillColor?: number
  /** Fill alpha for brush selection */
  brushFillAlpha?: number
  /** Stroke color for brush selection */
  brushStrokeColor?: number
  /** Stroke width for brush selection */
  brushStrokeWidth?: number
  /** Whether to emit selection events */
  emitEvents?: boolean
  /** Parent container for the brush graphics */
  container?: Container<ContainerChild> | null
}

/**
 * Selection events emitted by SelectionController
 */
export enum SelectionEvents {
  /** Fired when brush selection ends with selection area */
  BRUSH_END = 'brushend',
  /** Fired when an item is clicked/tapped */
  TAP_SELECT = 'tapselect',
  /** Fired when selection is cleared */
  SELECTION_CLEAR = 'selectionclear',
}

/**
 * Manages selection interactions including brush selection and tap selection
 */
export class SelectionController extends EventEmitter {
  private brushGraphics: Graphics
  private dragStart: PointData | null = null
  private dragEnd: PointData | null = null
  private isDragging: boolean = false
  private container: Container | null = null
  private hoverManager: HoverManager | null = null

  private options: Required<SelectionControllerOptions> = {
    brushFillColor: 0xff00ff,
    brushFillAlpha: 0.2,
    brushStrokeColor: 0xff00ff,
    brushStrokeWidth: 1,
    emitEvents: true,
    container: null,
  }

  /**
   * Creates a new SelectionController
   *
   * @param options - Configuration options
   * @param hoverManager - Optional hover manager to clear on drag
   */
  constructor(options: SelectionControllerOptions = {}, hoverManager?: HoverManager) {
    super()

    // Override default options with provided options
    this.options = { ...this.options, ...options }

    this.brushGraphics = new Graphics()
    this.brushGraphics.zIndex = 20

    if (options.container) {
      this.setContainer(options.container)
    }

    if (hoverManager) {
      this.hoverManager = hoverManager
    }
  }

  /**
   * Sets the container for the brush graphics
   *
   * @param container - The container to add brush graphics to
   */
  public setContainer(container: Container): void {
    // Remove from previous container if it exists
    if (this.container && this.brushGraphics.parent === this.container) {
      this.container.removeChild(this.brushGraphics)
    }

    this.container = container
    this.container.addChild(this.brushGraphics)
  }

  /**
   * Sets the hover manager instance
   *
   * @param hoverManager - The hover manager to use
   */
  public setHoverManager(hoverManager: HoverManager): void {
    this.hoverManager = hoverManager
  }

  /**
   * Handle pointer down event to start selection
   *
   * @param e - Pointer event or local coordinates
   * @param isGlobal - Whether the coordinates are global
   * @returns true if selection started, false otherwise
   */
  public handlePointerDown(e: FederatedPointerEvent | PointData, isGlobal = true): boolean {
    // If already dragging, ignore
    if (this.isDragging) return false

    // Get position in appropriate coordinates
    let pos: PointData
    if ('global' in e) {
      pos = isGlobal && this.container ? this.container.toLocal(e.global) : e
    } else {
      pos = e
    }

    // Start drag operation
    this.dragStart = { x: pos.x, y: pos.y }
    this.dragEnd = null
    this.isDragging = true

    // Clear hover state
    if (this.hoverManager) {
      this.hoverManager.clearHover()
    }

    // Clear any existing selection visualization
    this.brushGraphics.clear()

    return true
  }

  /**
   * Handle pointer move event during selection
   *
   * @param e - Pointer event or local coordinates
   * @param isGlobal - Whether the coordinates are global
   */
  public handlePointerMove(e: FederatedPointerEvent | PointData, isGlobal = true): void {
    // Not dragging, nothing to do
    if (!this.isDragging || !this.dragStart) return

    // Get position in appropriate coordinates
    let pos: PointData
    if ('global' in e) {
      pos = isGlobal && this.container ? this.container.toLocal(e.global) : e
    } else {
      pos = e
    }

    // Update drag end position and redraw selection brush
    this.dragEnd = { x: pos.x, y: pos.y }
    this.drawBrush()
  }

  /**
   * Handle pointer up event to complete selection
   *
   * @param e - Optional pointer event
   * @returns The selection bounds if selection completed, null otherwise
   */
  public handlePointerUp(e?: FederatedPointerEvent): Rectangle | null {
    if (!this.isDragging || !this.dragStart || !this.dragEnd) {
      // Reset selection state
      this.isDragging = false
      this.dragStart = null
      this.dragEnd = null
      this.brushGraphics.clear()
      return null
    }

    // Get the final selection bounds
    const bounds = this.getBrushBounds()

    // Reset selection state
    this.isDragging = false
    this.dragStart = null
    this.dragEnd = null
    this.brushGraphics.clear()

    // Emit selection event if needed
    if (this.options.emitEvents) {
      this.emit(SelectionEvents.BRUSH_END, bounds)
    }

    return bounds
  }

  /**
   * Handle a pointer tap for item selection
   *
   * @param e - Pointer event
   * @param isGlobal - Whether the coordinates are global
   */
  public handleTap(e: FederatedPointerEvent | PointData, isGlobal = true): void {
    if (this.options.emitEvents) {
      let pos: PointData
      if ('global' in e) {
        pos = e.global
      } else {
        pos = e
      }

      this.emit(SelectionEvents.TAP_SELECT, pos)
    }
  }

  /**
   * Draw the selection brush rectangle
   */
  private drawBrush(): void {
    if (!this.dragStart || !this.dragEnd) return

    const x = Math.min(this.dragStart.x, this.dragEnd.x)
    const y = Math.min(this.dragStart.y, this.dragEnd.y)
    const w = Math.abs(this.dragEnd.x - this.dragStart.x)
    const h = Math.abs(this.dragEnd.y - this.dragStart.y)

    this.brushGraphics
      .clear()
      .rect(x, y, w, h)
      .fill({
        color: this.options.brushFillColor,
        alpha: this.options.brushFillAlpha,
      })
      .stroke({
        width: this.options.brushStrokeWidth,
        color: this.options.brushStrokeColor,
      })
  }

  /**
   * Calculate the brush selection bounds in global coordinates
   *
   * @returns Rectangle representing the selection area
   */
  private getBrushBounds(): Rectangle {
    if (!this.dragStart || !this.dragEnd) return new Rectangle(0, 0, 0, 0)

    const x = Math.min(this.dragStart.x, this.dragEnd.x)
    const y = Math.min(this.dragStart.y, this.dragEnd.y)
    const w = Math.abs(this.dragEnd.x - this.dragStart.x)
    const h = Math.abs(this.dragEnd.y - this.dragStart.y)

    // If we have a container, transform to global coordinates
    if (this.container) {
      const topLeft = this.container.toGlobal({ x, y })
      const bottomRight = this.container.toGlobal({ x: x + w, y: y + h })

      const globalX = Math.min(topLeft.x, bottomRight.x)
      const globalY = Math.min(topLeft.y, bottomRight.y)
      const globalW = Math.abs(bottomRight.x - topLeft.x)
      const globalH = Math.abs(bottomRight.y - topLeft.y)

      return new Rectangle(globalX, globalY, globalW, globalH)
    } else {
      // No container to transform, use local coordinates
      return new Rectangle(x, y, w, h)
    }
  }

  /**
   * Cancel the current selection operation
   */
  public cancelSelection(): void {
    this.isDragging = false
    this.dragStart = null
    this.dragEnd = null
    this.brushGraphics.clear()
  }

  /**
   * Clear any existing selection
   */
  public clearSelection(): void {
    this.cancelSelection()

    if (this.options.emitEvents) {
      this.emit(SelectionEvents.SELECTION_CLEAR)
    }
  }

  /**
   * Check if selection is currently active
   *
   * @returns True if selection is in progress
   */
  public isSelecting(): boolean {
    return this.isDragging
  }

  /**
   * Clean up resources when no longer needed
   */
  public destroy(): void {
    this.cancelSelection()

    if (this.container && this.brushGraphics.parent === this.container) {
      this.container.removeChild(this.brushGraphics)
    }

    this.removeAllListeners()
    this.brushGraphics.destroy()
    this.container = null
    this.hoverManager = null
  }
}
