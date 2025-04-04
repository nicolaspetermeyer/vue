import { Application, Container, Texture, Graphics, Rectangle } from 'pixi.js'
import { PixiContainer } from '@/pixi/PixiContainer'

export class PixiApp extends Application {
  public root: PixiContainer = new PixiContainer()

  constructor(
    canvasElement: HTMLCanvasElement,
    width: number,
    height: number,
    backgroundColor: number,
  ) {
    super()

    // init app
    this.init({
      canvas: canvasElement,
      width: width,
      height: height,
      backgroundColor: backgroundColor,
      antialias: true,
      resolution: 2,
      // autoDensity: true, // not sure what this does
    })

    this.root.updateLayoutProps({
      width: width,
      height: height,
      // padding: { top: 10, right: 10, bottom: 10, left: 10 },
      layout: 'flexRow',
      gap: 50,
      justifyContent: 'center',
      alignItems: 'center',
      background: null,
      mask: false,
    })

    this.stage.addChild(this.root)
  }

  addContainer(container: Container) {
    this.root.addChild(container)
    this.root.applyLayout()
  }

  debugSceneGraphRecursive(container: Container, depth: number) {
    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i]
      const padding = '   '.repeat(depth)
      console.log(
        `${padding}%c${child.constructor.name}%c x: %c${child.x.toFixed(2)}%c y: %c${child.y.toFixed(2)}%c w: %c${child.width.toFixed(2)}%c h: %c${child.height.toFixed(2)}`,
        'color: #4CAF50; font-weight: bold', // class name
        'color: #666', // x label
        'color: #2196F3', // x value
        'color: #666', // y label
        'color: #2196F3', // y value
        'color: #666', // width label
        'color: #2196F3', // width value
        'color: #666', // height label
        'color: #2196F3', // height value
      )
      if (child instanceof Container) {
        this.debugSceneGraphRecursive(child, depth + 1)
      }
    }
  }
}
