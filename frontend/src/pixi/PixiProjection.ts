import { PixiContainer } from '@/pixi/Base/PixiContainer'
import { Rectangle, Graphics } from 'pixi.js'
import { PixiDimred } from '@/pixi/PixiDimred'
import { PixiAttributeRing } from '@/pixi/PixiAttributeRing'
import type { FeatureStats, Projection } from '@/models/data'
import { PixiInteractionOverlay } from '@/pixi/interactions/overlays/PixiInteractionOverlay'
import { Colors } from '@/config/Themes'

export class PixiProjection extends PixiContainer {
  dimred: PixiDimred
  attributeRing: PixiAttributeRing
  interactionOverlay: PixiInteractionOverlay
  maskGraphic: Graphics

  constructor(projectedPoints: Projection[], globalStats: Record<string, FeatureStats>) {
    super({
      width: 1000,
      height: 1000,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      layout: 'flexColumn',
      justifyContent: 'center',
      alignItems: 'center',
      background: Colors.CANVAS_BACKGROUND,
    })

    // The attribute ring
    this.attributeRing = new PixiAttributeRing(globalStats)
    this.addChild(this.attributeRing)

    this.maskGraphic = new Graphics()
    this.maskGraphic.fill({ color: 0xffffff })
    this.maskGraphic.circle(349, 349, 349) // Circle slightly smaller than inner radius of the attribute ring
    this.maskGraphic.fill({ color: 0xffffff })
    this.addChild(this.maskGraphic)

    // The Dimred projection space for the items
    this.dimred = new PixiDimred(projectedPoints)
    this.dimred.mask = this.maskGraphic
    this.addChild(this.dimred)

    // Interaction overlay (transparent, non-blocking)
    this.interactionOverlay = new PixiInteractionOverlay(this.width, this.height)
    this.interactionOverlay.setDimred(this.dimred)
    this.interactionOverlay.setAttributeRing(this.attributeRing)

    this.addChild(this.interactionOverlay)

    this.applyLayout()
  }

  /**
   * Toggle between rectangle and lasso selection modes
   */
  toggleSelectionMode() {
    this.interactionOverlay.toggleSelectionMode()
  }

  /**
   * Register keyboard event handlers
   */
  registerKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      this.interactionOverlay.handleKeyDown(e)
    })
  }

  /**
   * Remove keyboard event handlers
   */
  unregisterKeyboardEvents() {
    window.removeEventListener('keydown', this.interactionOverlay.handleKeyDown)
  }

  // method to reset the view (zoom and position)
  resetView() {
    this.interactionOverlay.resetView()
  }
}
