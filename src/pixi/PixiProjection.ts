import { PixiContainer } from '@/pixi/PixiContainer'
import { PixiText } from '@/pixi/PixiText'
import { PixiDimred } from '@/pixi/PixiDimred'
import { PixiAttributeRing } from '@/pixi/PixiAttributeRing'
import type { FeatureStats, Point } from '@/models/data'

export class PixiProjection extends PixiContainer {
  dimred: PixiDimred
  attributeRing: PixiAttributeRing
  constructor(points: Point[], globalStats: Record<string, FeatureStats>) {
    super({
      width: 690,
      height: 690,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      layout: 'flexColumn',
      justifyContent: 'center',
      alignItems: 'center',
      background: 0xffffff,
    })

    // The Dimred projection space for the items
    this.dimred = new PixiDimred(points)
    this.addChild(this.dimred)

    // The attribute ring
    this.attributeRing = new PixiAttributeRing(globalStats)
    this.addChild(this.attributeRing)
    this.applyLayout()
  }

  //setPoints(points: Point[]) {
  //this.dimred.updatePoints(points)
  //}
}
