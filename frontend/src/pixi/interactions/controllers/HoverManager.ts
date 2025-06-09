import { FederatedPointerEvent, PointData } from 'pixi.js'
import { PixiTooltip, TooltipOptions } from '@/pixi/interactions/overlays/PixiTooltip'
import { PixiAttributeRing } from '@/pixi/PixiAttributeRing'

export interface Hoverable {
  setHovered(hovered: boolean): void
  getTooltipContent?(): string
  getTooltipOptions?(x: number, y: number): TooltipOptions
  getId(): string
}

export interface HoverableProvider<T extends Hoverable> {
  pointerInElement(global: PointData): T | null
}

export class HoverManager {
  public currentHovered: Hoverable | null = null
  private tooltip: PixiTooltip
  private providers: HoverableProvider<Hoverable>[] = []

  constructor(tooltip: PixiTooltip) {
    this.tooltip = tooltip
  }

  addProvider<T extends Hoverable>(provider: HoverableProvider<T>) {
    this.providers.push(provider as HoverableProvider<Hoverable>)
  }

  removeProvider<T extends Hoverable>(provider: HoverableProvider<T>) {
    const index = this.providers.indexOf(provider as HoverableProvider<Hoverable>)
    if (index !== -1) {
      this.providers.splice(index, 1)
    }
  }

  handlePointerEvent(e: FederatedPointerEvent) {
    // Skip hover logic if no providers

    if (this.providers.length === 0) {
      return false
    }

    // Try to find a hoverable element from any provider
    let newHovered: Hoverable | null = null

    const miniRingProviders = this.providers.filter(
      (p) => p instanceof PixiAttributeRing && (p as any).mini === true,
    )

    const otherProviders = this.providers.filter(
      (p) => !(p instanceof PixiAttributeRing && (p as any).mini === true),
    )

    for (const provider of miniRingProviders) {
      const element = provider.pointerInElement(e.global)
      if (element) {
        newHovered = element
        break
      }
    }

    if (!newHovered) {
      for (const provider of otherProviders) {
        const element = provider.pointerInElement(e.global)
        if (element) {
          newHovered = element
          break
        }
      }
    }

    // Update hover state if it changed
    if (newHovered !== this.currentHovered) {
      if (this.currentHovered) {
        this.currentHovered.setHovered(false)
        this.tooltip.hide()
      }

      if (newHovered) {
        newHovered.setHovered(true)
        const local = this.tooltip.parent.toLocal(e.global)
        if (
          'getTooltipOptions' in newHovered &&
          typeof newHovered.getTooltipOptions === 'function'
        ) {
          let newHeight = 0
          if (local.y > 800) {
            console.log('local.y', local.y)
            newHeight = local.y - 200
          } else if (local.y < 800) {
            console.log('local.y', local.y)
            newHeight = local.y - 6
          }
          console.log('x', local.x, 'y', local.y, 'newHeight', newHeight)
          const options = newHovered.getTooltipOptions(local.x + 8, newHeight)
          this.tooltip.showWithOptions(options)
        }
        // Fall back to text-only tooltip
        else if (
          'getTooltipContent' in newHovered &&
          typeof newHovered.getTooltipContent === 'function'
        ) {
          const content = newHovered.getTooltipContent()
          this.tooltip.show(content, local.x + 8, local.y - 6)
        }
      }

      this.currentHovered = newHovered

      return true
    }

    return false
  }

  clearHover() {
    if (this.currentHovered) {
      this.currentHovered.setHovered(false)
      this.currentHovered = null
      this.tooltip.hide()
    }
  }
}
