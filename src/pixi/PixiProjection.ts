import { PixiContainer } from '@/pixi/PixiContainer'
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
      background: 0x265738,
    })

    const fingerprintStore = useFingerprintStore()

    // The Dimred projection space for the items
    this.dimred = new PixiDimred(projectedPoints)
    this.addChild(this.dimred)

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
}
