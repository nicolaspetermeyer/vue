import { Texture } from 'pixi.js'
import { PixiSprite } from './Base/PixiSprite'
import type { Projection } from '@/models/data'
import { Hoverable } from '@/utils/HoverManager'
import { useProjectionStore } from '@/stores/projectionStore'

// Create a static texture cache
const textureCache = new Map<number, Texture>()

// Function to generate circular texture
function getOrCreateCircleTexture(radius: number): Texture {
  if (!textureCache.has(radius)) {
    // Create a circle texture at the requested radius
    const canvas = document.createElement('canvas')
    const size = radius * 2 + 2 // Add padding for antialiasing
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

  constructor(projectedPoint: Projection) {
    // Create with default texture
    super(getOrCreateCircleTexture(5))

    this.projectedPoint = projectedPoint
    this.anchor.set(0.5) // Set origin to center of sprite
    this.updateVisualState()

    this.eventMode = 'static'
    this.cursor = 'pointer'
  }

  updateVisualState() {
    if (this.Selected) {
      this.tint = 0x0077ff // Blue for selected
    } else if (this.inFingerprint) {
      this.tint = 0x00ff77 // Green for fingerprint
    } else if (this.Hovered) {
      this.tint = 0xffaa00 // Orange for hovered
    } else {
      this.tint = 0x000000 // Grey for normal
    }

    if (this.inFingerprint && !this.Selected) {
      this.alpha = 0.9
    } else {
      this.alpha = 1
    }
  }

  updatePosition(size: number) {
    this.position.set(this.projectedPoint.pos.x * size, this.projectedPoint.pos.y * size)
  }

  setSelected(selected: boolean) {
    if (this.Selected !== selected) {
      this.Selected = selected
      this.updateVisualState()
    }
  }

  isSelected(): boolean {
    return this.Selected
  }

  // New method to mark a point as part of the selected fingerprint
  setInFingerprint(inFingerprint: boolean) {
    if (this.inFingerprint !== inFingerprint) {
      this.inFingerprint = inFingerprint
      this.updateVisualState()
    }
  }

  isInFingerprint(): boolean {
    return this.inFingerprint
  }

  setHovered(state: boolean): void {
    if (this.Hovered !== state) {
      this.Hovered = state
      this.updateVisualState()
    }
  }

  updatePointScale(inverseScale: number) {
    // Update the scale of the point to maintain constant visual size
    this.scale.set(inverseScale)
  }

  getTooltipContent(): string {
    const projection = this.dimredpoint
    const pointId = String(projection.id)

    const featureLines = Object.entries(projection.original)
      .filter(([key]) => key.toLowerCase() !== 'id')
      .map(([key, value]) => {
        const valStr = typeof value === 'number' ? value.toFixed(2) : String(value)
        return `${key}: ${valStr}`
      })
    // Get feature ranking information
    const projectionStore = useProjectionStore()
    const topFeatures = projectionStore.getTopFeaturesForPoint(pointId, 3)

    let rankingSection = ''
    if (topFeatures.length > 0) {
      rankingSection =
        '\n\nTop Features by Importance:\n' +
        topFeatures
          .map((f, idx) => {
            // Format score as percentage with 1 decimal place
            const scorePercent = (f.score * 100).toFixed(1)
            return `${idx + 1}. ${f.name} (${scorePercent}%)`
          })
          .join('\n')
    }

    return [`ID: ${projection.id}`, '', 'Features:', ...featureLines, rankingSection].join('\n')
  }

  get dimredpoint(): Projection {
    if (!this.projectedPoint) {
      throw new Error('DimredPoint accessed before initialization')
    }
    return this.projectedPoint
  }
  getId(): number {
    return this.dimredpoint.id
  }
}
