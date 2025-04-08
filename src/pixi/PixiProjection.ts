import { PixiContainer } from '@/pixi/PixiContainer'
import { PixiText } from '@/pixi/PixiText'
import { PixiDimred } from '@/pixi/PixiDimred'
import { PixiAttributeRing } from '@/pixi/PixiAttributeRing'
import type { FeatureStats, Point } from '@/models/data'
import { PixiInteractionOverlay } from '@/pixi/PixiInteractionOverlay'

export class PixiProjection extends PixiContainer {
  dimred: PixiDimred
  attributeRing: PixiAttributeRing
  interactionOverlay: PixiInteractionOverlay

  constructor(points: Point[], globalStats: Record<string, FeatureStats>) {
    super({
      width: 1000,
      height: 1000,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      layout: 'flexColumn',
      justifyContent: 'center',
      alignItems: 'center',
      background: 0x265738,
    })

    // The Dimred projection space for the items
    this.dimred = new PixiDimred(points)
    this.addChild(this.dimred)

    // The attribute ring
    this.attributeRing = new PixiAttributeRing(globalStats)
    this.addChild(this.attributeRing)

    // Interaction overlay (transparent, non-blocking)
    this.interactionOverlay = new PixiInteractionOverlay(this.width, this.height)
    this.addChild(this.interactionOverlay)

    // Tooltip setup
    this.dimred.bindTooltipEvents(this.interactionOverlay.getTooltip())

    this.applyLayout()
  }

  //setPoints(points: Point[]) {
  //this.dimred.updatePoints(points)
  //}
}
