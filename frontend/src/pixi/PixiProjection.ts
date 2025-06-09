import { PixiContainer } from '@/pixi/Base/PixiContainer'
import { Graphics } from 'pixi.js'
import { PixiDimred } from '@/pixi/PixiDimred'
import { PixiAttributeRing } from '@/pixi/PixiAttributeRing'
import type { AttributeStats, Projection } from '@/models/data'
import { PixiInteractionOverlay } from '@/pixi/interactions/overlays/PixiInteractionOverlay'
import { Colors } from '@/config/Themes'
import { PixiApp } from '@/pixi/Base/PixiApp'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { useProjectionStore } from '@/stores/projectionStore'

export class PixiProjection extends PixiContainer {
  dimred: PixiDimred
  attributeRing: PixiAttributeRing
  interactionOverlay: PixiInteractionOverlay
  maskGraphic: Graphics
  app: PixiApp

  constructor(
    projectedPoints: Projection[],
    globalStats: Record<string, AttributeStats>,
    app: PixiApp,
  ) {
    super({
      width: 1000,
      height: 1000,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      layout: 'flexColumn',
      justifyContent: 'center',
      alignItems: 'center',
      background: Colors.CANVAS_BACKGROUND,
    })

    this.app = app

    // The attribute ring
    this.attributeRing = new PixiAttributeRing(globalStats, false, this.app)
    this.addChild(this.attributeRing)

    this.maskGraphic = new Graphics()
    this.maskGraphic.fill({ color: 0xffffff })
    this.maskGraphic.circle(349, 349, 349)
    this.maskGraphic.fill({ color: 0xffffff })
    this.addChild(this.maskGraphic)

    // The Dimred projection space for the items
    this.dimred = new PixiDimred(projectedPoints, this.app)
    this.dimred.mask = this.maskGraphic
    this.addChild(this.dimred)

    // Interaction overlay (transparent, non-blocking)
    this.interactionOverlay = new PixiInteractionOverlay(this.width, this.height)
    this.interactionOverlay.setDimred(this.dimred)
    this.interactionOverlay.setAttributeRing(this.attributeRing)
    this.interactionOverlay.on('showContextMenu', (data) => {
      this.emit('showContextMenu', data)
    })

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
   * Show all points in the visualization
   */
  showAllPoints(): void {
    this.dimred.showAllPoints()
  }

  /**
   * Show specific points in the visualization
   * @param indices Array of point indices to show
   */
  filterPoints(indices: number[]): void {
    this.dimred.filterPoints(indices)
  }

  /**
   * Update which attributes are shown in the attribute ring
   * @param attributes Array of attribute names to display
   */
  updateAttributeRing(attributes: string[]): void {
    const globalStats = useProjectionStore().globalStats
    if (this.attributeRing) {
      this.attributeRing.updateVisibleAttributes(globalStats, attributes)
    }
    if (this.dimred?.pixiGlyph) {
      this.dimred.pixiGlyph.forEach((ring, fingerprintId) => {
        const fingerprint = useFingerprintStore().getFingerprintById(fingerprintId)
        if (fingerprint) {
          // Filter fingerprint stats to only include the filtered attributes
          const filteredStats = {} as Record<string, AttributeStats>
          for (const attr of attributes) {
            if (attr in fingerprint.localStats) {
              filteredStats[attr] = fingerprint.localStats[attr]
            }
          }

          // Rebuild the mini ring
          ring.updateVisibleAttributes(filteredStats, attributes)
        }
      })
    }
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

  /**
   * method to reset the view (zoom and position)
   */
  resetView() {
    this.interactionOverlay.resetView()
  }
}
