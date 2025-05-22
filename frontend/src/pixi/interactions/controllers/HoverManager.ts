import { FederatedPointerEvent, PointData } from 'pixi.js'
import { PixiTooltip } from '@/pixi/interactions/overlays/PixiTooltip'
import { PixiAttributeRing } from '@/pixi/PixiAttributeRing'

export interface Hoverable {
  setHovered(hovered: boolean): void
  getTooltipContent(): string
  getId(): string
}

export interface HoverableProvider<T extends Hoverable> {
  findElementAtGlobal(global: PointData): T | null
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
      const element = provider.findElementAtGlobal(e.global)
      if (element) {
        newHovered = element
        break
      }
    }

    if (!newHovered) {
      for (const provider of otherProviders) {
        const element = provider.findElementAtGlobal(e.global)
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
        this.tooltip.show(newHovered.getTooltipContent(), local.x + 8, local.y - 6)
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
