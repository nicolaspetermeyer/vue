import { Container, Sprite, Texture, type ContainerChild } from 'pixi.js'

export interface PixiContainerLayoutProps {
  width: number
  height: number
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
  layout: 'none' | 'flexRow' | 'flexColumn'
  gap: number
  justifyContent: 'start' | 'center' | 'end'
  alignItems: 'start' | 'center' | 'end'
  background: number | null
  mask: boolean
  positionAbsolute: boolean // if true, the container will be positioned independend of sibling elements
}

export class PixiContainer extends Container {
  layoutProps: PixiContainerLayoutProps
  background: Sprite | null = null
  maskSprite: Sprite | null = null

  constructor(layoutProps: Partial<PixiContainerLayoutProps> = {}) {
    super()

    // Default layout properties
    const defaultProps: PixiContainerLayoutProps = {
      width: 100,
      height: 100,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      layout: 'none',
      gap: 0,
      justifyContent: 'start',
      alignItems: 'start',
      background: null,
      mask: false,
      positionAbsolute: false,
    }

    // Merge user-provided properties with defaults
    this.layoutProps = { ...defaultProps, ...layoutProps }

    this.updateBackground()
    this.updateMask()
  }

  updateLayoutProps(layoutProps: Partial<PixiContainerLayoutProps>) {
    this.layoutProps = { ...this.layoutProps, ...layoutProps }
    this.updateBackground()
    this.updateMask()
  }

  updateBackground() {
    // Remove background if set to null
    if (this.layoutProps.background === null) {
      if (this.background !== null) {
        this.removeChild(this.background)
        this.background = null
      }
      return
    }

    // Create background if there is none instantiated yet
    if (!this.background) {
      this.background = new Sprite(Texture.WHITE)
      this.addChild(this.background)
    }

    // Update background properties
    this.background.width = this.layoutProps.width
    this.background.height = this.layoutProps.height
    this.background.tint = this.layoutProps.background
  }

  updateMask() {
    if (!this.layoutProps.mask) {
      return
    }
    const mask = new Sprite(Texture.WHITE)
    this.addChild(mask)
    mask.x = 0
    mask.y = 0
    mask.width = this.layoutProps.width
    mask.height = this.layoutProps.height
    this.mask = mask
    this.maskSprite = mask
  }

  applyLayout() {
    const { width, height, padding, layout, alignItems, justifyContent, gap } = this.layoutProps

    // Calculate the available space (excluding padding)
    const availableWidth = width - padding.left - padding.right
    const availableHeight = height - padding.top - padding.bottom

    if (layout === 'none') return

    // Collect valid children (excluding background & mask)
    const children = this.children.filter(
      (child) => child !== this.background && child !== this.maskSprite,
    )

    // Differentiate between absolute and relative children
    const absoluteChildren = children.filter(
      (child) => child instanceof PixiContainer && child.layoutProps.positionAbsolute,
    )
    const relativeChildren = children.filter((child) => !absoluteChildren.includes(child))

    // Calculate total occupied size of relativeChildren (including gaps)
    const totalChildrenSize =
      relativeChildren.reduce(
        (sum, child) => sum + (layout === 'flexRow' ? this.getWidth(child) : this.getHeight(child)),
        0,
      ) +
      gap * Math.max(relativeChildren.length - 1, 0)

    // Get starting position based on justifyContent (accounting for left & top padding)
    let currentX =
      padding.left + this.getJustifyOffset(justifyContent, availableWidth, totalChildrenSize)
    let currentY =
      padding.top + this.getJustifyOffset(justifyContent, availableHeight, totalChildrenSize)

    relativeChildren.forEach((child) => {
      // Calculate alignment offset (accounts for padding)
      const alignOffset =
        layout === 'flexRow'
          ? this.getAlignOffset(
              alignItems,
              availableHeight,
              this.getHeight(child),
              padding.top,
              padding.bottom,
            )
          : this.getAlignOffset(
              alignItems,
              availableWidth,
              this.getWidth(child),
              padding.left,
              padding.right,
            )

      // Set position based on layout type
      const x = layout === 'flexRow' ? currentX : alignOffset
      const y = layout === 'flexRow' ? alignOffset : currentY

      child.position.set(x, y)

      // Update current position for next child
      if (layout === 'flexRow') currentX += this.getWidth(child) + gap
      else currentY += this.getHeight(child) + gap
    })

    // Apply layout to absolute children
    // essentially treated like they are the only child in the container; still adhering to padding and alignment
    absoluteChildren.forEach((child) => {
      const x =
        padding.left + this.getJustifyOffset(justifyContent, availableWidth, this.getWidth(child))
      const y =
        padding.top + this.getJustifyOffset(justifyContent, availableHeight, this.getHeight(child))
      child.position.set(x, y)
    })
  }

  // Helper: Calculate alignment offset (now includes top/bottom padding)
  private getAlignOffset(
    align: 'start' | 'center' | 'end',
    availableSize: number,
    childSize: number,
    paddingStart: number,
    paddingEnd: number,
  ): number {
    return align === 'center'
      ? paddingStart + (availableSize - childSize) / 2
      : align === 'end'
        ? availableSize + paddingStart - childSize - paddingEnd
        : paddingStart // 'start' case
  }

  // Helper: Calculate justify offset (now includes left/right padding)
  private getJustifyOffset(
    justify: 'start' | 'center' | 'end',
    availableSize: number,
    totalChildrenSize: number,
  ): number {
    return justify === 'center'
      ? (availableSize - totalChildrenSize) / 2
      : justify === 'end'
        ? availableSize - totalChildrenSize
        : 0 // 'start' case
  }

  // For Containers we do not want to rely on the width property of the Container itself, because it only reflects the content.
  // Instead we want to use the layout properties to determine the width of the Container.
  private getWidth(child: ContainerChild): number {
    if (child instanceof PixiContainer) {
      return child.layoutProps.width
    } else {
      return child.width
    }
  }

  // For Containers we do not want to rely on the height property of the Container itself, because it only reflects the content.
  // Instead we want to use the layout properties to determine the height of the Container.
  private getHeight(child: ContainerChild): number {
    if (child instanceof PixiContainer) {
      return child.layoutProps.height
    } else {
      return child.height
    }
  }
}
