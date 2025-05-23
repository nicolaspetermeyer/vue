import { Texture } from 'pixi.js'
import { PixiSprite } from './Base/PixiSprite'
import type { Projection } from '@/models/data'
import { Hoverable } from '@/pixi/interactions/controllers/HoverManager'
import { Colors } from '@/config/Themes'
import { useProjectionStore } from '@/stores/projectionStore'
import { usePixiUIStore } from '@/stores/pixiUIStore'

// Create a static texture cache
const textureCache = new Map<number, Texture>()

// Function to generate circular texture
function getOrCreateCircleTexture(radius: number): Texture {
  if (!textureCache.has(radius)) {
    const canvas = document.createElement('canvas')
    const size = radius * 2 + 2 // padding for antialiasing
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2)
      ctx.fillStyle = 'white'
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    textureCache.set(radius, Texture.from(canvas))
  }

  return textureCache.get(radius)!
}

export class PixiDimredPoint extends PixiSprite implements Hoverable {
  private projectedPoint: Projection
  private pixiUIStore = usePixiUIStore()

  constructor(projectedPoint: Projection) {
    super(getOrCreateCircleTexture(5))

    this.projectedPoint = projectedPoint
    this.anchor.set(0.5) // Set origin to center of sprite
    this.updateVisualState()

    this.eventMode = 'static'
    this.cursor = 'default'
  }

  /**
   * Update the visual state of the point based on its selection and hover state.
   */
  updateVisualState() {
    const isSelected = this.pixiUIStore.isPointSelected(this.dimredpoint.id)
    const isHighlighted = this.pixiUIStore.isPointHighlighted(this.dimredpoint.id)
    const isHovered = this.pixiUIStore.hoveredPointId === this.dimredpoint.id

    if (isSelected) {
      this.tint = Colors.SELECTED
    } else if (isHighlighted) {
      this.tint = this.pixiUIStore.getPointHighlightColor(this.dimredpoint.id)
    } else if (isHovered) {
      this.tint = Colors.HOVERED
    } else {
      this.tint = Colors.NORMAL
    }

    if (isHighlighted && !isSelected) {
      this.alpha = 0.9
    } else {
      this.alpha = 1
    }
  }

  /**
   * Set the point to be highlighted as part of a fingerprint.
   * @param highlighted - Whether the point is highlighted or not.
   * @param color - Optional color for the highlight.
   */
  setFingerprintColor(highlighted: boolean, color?: number): void {
    const id = this.getId()
    if (highlighted && color !== undefined) {
      this.pixiUIStore.highlightedPointIds.set(id, color)
    } else if (!highlighted) {
      this.pixiUIStore.highlightedPointIds.delete(id)
    }
    this.updateVisualState()
  }

  /**
   * Set the hovered state of the point.
   * @param state - Whether the point is hovered or not.
   */
  setHovered(state: boolean): void {
    if (state) {
      this.pixiUIStore.setHoveredPoint(this.getId())
    } else if (this.pixiUIStore.hoveredPointId === this.getId()) {
      this.pixiUIStore.setHoveredPoint(null)
    }
    this.updateVisualState()
  }

  /**
   * This is used to adjust the size of the point based on the current zoom level.
   * @param inverseScale - The inverse scale factor of the zoom.
   */
  updatePointScale(inverseScale: number) {
    this.scale.set(inverseScale)
  }

  getTooltipContent(): string {
    const projection = this.dimredpoint
    const projectionStore = useProjectionStore()
    const nonNumericAttrs = projectionStore.filterCategories || []

    const idSection = `ID: ${projection.id}`
    const sections = []
    const nonNumericFeatures = Object.entries(projection.original)
      .filter(([key]) => nonNumericAttrs.includes(key))
      .map(([key, value]) => `${key}: ${String(value)}`)

    if (nonNumericFeatures.length > 0) {
      sections.push('', 'Metadata:', ...nonNumericFeatures)
    }

    const numericFeatures = Object.entries(projection.original)
      .filter(([key]) => !nonNumericAttrs.includes(key) && key.toLowerCase() !== 'id')
      .map(([key, value]) => {
        const val = typeof value === 'number' ? value.toFixed(2) : String(value)
        return `${key}: ${val}`
      })

    if (numericFeatures.length > 0) {
      sections.push('', 'Measurements:', ...numericFeatures)
    }

    // Get feature ranking information
    // const projectionStore = useProjectionStore()
    // const topFeatures = projectionStore.getTopFeaturesForPoint(pointId, 3)

    // let rankingSection = ''
    // if (topFeatures.length > 0) {
    //   rankingSection =
    //     '\n\nTop Features by Importance:\n' +
    //     topFeatures
    //       .map((f, idx) => {
    //         // Format score as percentage with 1 decimal place
    //         const scorePercent = (f.score * 100).toFixed(1)
    //         return `${idx + 1}. ${f.name} (${scorePercent}%)`
    //       })
    //       .join('\n')
    // }

    return [idSection, ...sections].join('\n')
  }

  get dimredpoint(): Projection {
    if (!this.projectedPoint) {
      throw new Error('DimredPoint accessed before initialization')
    }
    return this.projectedPoint
  }

  getId(): string {
    return this.dimredpoint.id
  }
}
