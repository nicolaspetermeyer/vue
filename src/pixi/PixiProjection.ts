import { PixiContainer } from '@/pixi/PixiContainer'
import { PixiText } from '@/pixi/PixiText'
import { PixiDimred } from '@/pixi/PixiDimred'

import type { Point } from '@/models/data'

export class PixiProjection extends PixiContainer {
  dimred: PixiDimred
  constructor(points: Point[]) {
    super({
      width: 460,
      height: 460,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      layout: 'flexColumn',
      justifyContent: 'center',
      alignItems: 'center',
      background: 0xffffff,
    })
    //this.setPoints(points)

    this.dimred = new PixiDimred(points)
    this.addChild(this.dimred)
  }

  //setPoints(points: Point[]) {
  //this.dimred.updatePoints(points)
  //}
}
