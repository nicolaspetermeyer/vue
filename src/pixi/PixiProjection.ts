import { PixiContainer } from '@/pixi/PixiContainer'
import { PixiText } from '@/pixi/PixiText'
import { PixiDimred } from '@/pixi/PixiDimred'

export class PixiProjection extends PixiContainer {
  dimred: PixiDimred
  constructor() {
    super({
      width: 460,
      height: 460,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      layout: 'flexColumn',
      justifyContent: 'center',
      alignItems: 'center',
      background: 0xffffff,
    })

    this.dimred = new PixiDimred([])
    this.addChild(this.dimred)
  }
}
