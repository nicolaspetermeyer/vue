import { Texture } from 'pixi.js'
import { PixiSprite } from './Base/PixiSprite'
import type { Projection } from '@/models/data'
import { Hoverable } from '@/pixi/interactions/controllers/HoverManager'
import { Colors } from '@/config/Themes'
import { useProjectionStore } from '@/stores/projectionStore'

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
  private Selected: boolean = false
  private Hovered: boolean = false
  private inFingerprint: boolean = false
  setHighlighted: any
  private highlightColor: number

  constructor(projectedPoint: Projection) {
    super(getOrCreateCircleTexture(5))

    this.projectedPoint = projectedPoint
    this.anchor.set(0.5) // Set origin to center of sprite
    this.updateVisualState()

    this.highlightColor = Colors.NORMAL

    this.eventMode = 'static'
    this.cursor = 'pointer'
  }

  /**
   * Update the visual state of the point based on its selection and hover state.
   */
  updateVisualState() {
    if (this.Selected) {
      this.tint = Colors.SELECTED
    } else if (this.inFingerprint) {
      this.tint = this.highlightColor
    } else if (this.Hovered) {
      this.tint = Colors.HOVERED
    } else {
      this.tint = Colors.NORMAL
    }

    if (this.inFingerprint && !this.Selected) {
      this.alpha = 0.9
    } else {
      this.alpha = 1
    }
  }

  /**
   * Set the selected state of the point.
   * @param selected - Whether the point is selected or not.
   */
  setSelected(selected: boolean) {
    if (this.Selected !== selected) {
      this.Selected = selected
      this.updateVisualState()
    }
  }

  /**
   * Get the selected state of the point.
   * @returns Whether the point is selected or not.
   */
  isSelected(): boolean {
    return this.Selected
  }

  /**
   * Set the point to be highlighted as part of a fingerprint.
   * @param highlighted - Whether the point is highlighted or not.
   * @param color - Optional color for the highlight.
   */
  setFingerprintColor(highlighted: boolean, color?: number): void {
    this.inFingerprint = highlighted
    if (highlighted && color !== undefined) {
      this.highlightColor = color
    } else {
      this.highlightColor = Colors.NORMAL
    }
    this.updateVisualState()
  }

  /**
   * Get the highlight color of the point.
   * @returns The highlight color.
   */
  isInFingerprint(): boolean {
    return this.inFingerprint
  }

  /**
   * Set the hovered state of the point.
   * @param state - Whether the point is hovered or not.
   */
  setHovered(state: boolean): void {
    if (this.Hovered !== state) {
      this.Hovered = state
      this.updateVisualState()
    }
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
