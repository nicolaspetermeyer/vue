import { Application, Container, Texture, Graphics, Rectangle } from 'pixi.js'
import { PixiContainer } from './PixiContainer'

export class PixiApp extends Application {
  public root: PixiContainer = new PixiContainer()

  constructor() {
    super()
  }
  // init app
  async setup(
    canvasElement: HTMLCanvasElement,
    width: number,
    height: number,
    backgroundColor: number,
  ) {
    await this.init({
      canvas: canvasElement, // binds the existing DOM element (instead of creating a new one)
      width: width,
      height: height,
      backgroundColor: backgroundColor,
      antialias: true, //enables smoothing
      resolution: 2, //high-DPI (retina) support
      autoDensity: true, //  adapts canvas size to device pixel ratio — useful if you want responsive sizing
    })

    // this.stage.eventMode = 'static'
    // this.stage.hitArea = new Rectangle(0, 0, width, height)
    // this.root.eventMode = 'static'

    this.root.updateLayoutProps({
      // This enables PixiContainer’s layout engine, behaving similarly to CSS flexbox:
      // Children are positioned automatically
      // Padding, gap, alignment handled internally
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
    this.stage.sortableChildren = true
  }

  resizeApp(width: number, height: number) {
    // Resize the Pixi renderer
    this.renderer.resize(width, height)
    // Update layout props of the root container
    this.root.updateLayoutProps({
      width,
      height,
    })
    // Trigger layout recalculation
    this.root.applyLayout()
  }

  addContainer(container: Container) {
    this.root.addChild(container)
    this.root.applyLayout()
  }

  clearRoot() {
    this.root.removeChildren()
    this.root.applyLayout()
  }

  // Utility to visualize the scene tree in the console:
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
