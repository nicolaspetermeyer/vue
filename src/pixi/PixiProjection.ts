import { PixiContainer } from '@/pixi/Base/PixiContainer'
import { Rectangle } from 'pixi.js'
import { PixiDimred } from '@/pixi/PixiDimred'
import { PixiAttributeRing } from '@/pixi/PixiAttributeRing'
import type { FeatureStats, Projection } from '@/models/data'
import { PixiInteractionOverlay } from '@/pixi/InteractionOverlays/PixiInteractionOverlay'
import { useFingerprintStore } from '@/stores/fingerprintStore'

export class PixiProjection extends PixiContainer {
  dimred: PixiDimred
  attributeRing: PixiAttributeRing
  interactionOverlay: PixiInteractionOverlay

  constructor(projectedPoints: Projection[], globalStats: Record<string, FeatureStats>) {
    super({
      width: 1000,
      height: 1000,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      layout: 'flexColumn',
      justifyContent: 'center',
      alignItems: 'center',
      background: 0x8a9493,
    })

    const fingerprintStore = useFingerprintStore()

    // The Dimred projection space for the items
    this.dimred = new PixiDimred(projectedPoints)
    this.addChild(this.dimred)

    // Set initial position (center the dimred)
    this.dimred.position.x = (this.width - this.dimred.width) / 2
    this.dimred.position.y = (this.height - this.dimred.height) / 2

    // The attribute ring
    this.attributeRing = new PixiAttributeRing(globalStats)
    this.addChild(this.attributeRing)

    // Interaction overlay (transparent, non-blocking)
    this.interactionOverlay = new PixiInteractionOverlay(this.width, this.height)
    this.interactionOverlay.setDimred(this.dimred)
    this.interactionOverlay.setAttributeRing(this.attributeRing)

    // Bind brush event
    this.interactionOverlay.on('brushend', (bounds: Rectangle) => {
      const selected = this.dimred.getPointsInBounds(bounds)
      this.dimred.setSelection(selected)

      fingerprintStore.setSelectedProjections(this.dimred.getSelectedProjections())
    })
    this.addChild(this.interactionOverlay)

    this.applyLayout()
  }
  // method to reset the view (zoom and position)
  resetView() {
    this.interactionOverlay.resetView()
  }
}
