import { PixiContainer } from '@/pixi/PixiContainer'
import { PixiText } from '@/pixi/PixiText'
import { PixiGraphic } from '@/pixi/PixiGraphic'
import { PixiDimredPoint } from '@/pixi/PixiDimredPoint'
import type { Fingerprint, Point, Position } from '@/models/data'
import { PixiTooltip } from '@/pixi/InteractionOverlays/PixiTooltip'
import { Rectangle, PointData } from 'pixi.js'

export class PixiDimred extends PixiContainer {
  pixiDimredPoints: Map<number, PixiDimredPoint> = new Map()

  constructor(points: Point[]) {
    super({
      width: 460,
      height: 460,
      background: 0xe1f7e9,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      positionAbsolute: true,
      layout: 'flexColumn',
      justifyContent: 'center',
      alignItems: 'center',
    })

    this.updatePoints(points)

    // this.applyLayout()
  }

  getOrCreatePoint(point: Point): PixiDimredPoint {
    const id = point.item_id
    if (!this.pixiDimredPoints.has(id)) {
      const newPoint = new PixiDimredPoint(point)
      //console.log('PixiDimred -- Adding new point', id, newPoint)
      this.pixiDimredPoints.set(id, newPoint)

      this.addChild(newPoint)
    }
    return this.pixiDimredPoints.get(id)!
  }

  updatePoints(points: Point[]) {
    console.log('PixiDimred -- Updating points')
    if (points.length === 0) return

    // Compute DR space bounding box
    const xs = points.map((p) => p.pos.x)
    const ys = points.map((p) => p.pos.y)

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1

    // Normalize points to [0, 1] range, then scale to layout size
    const normPoints = points.map((p) => ({
      ...p,
      pos: {
        x: (p.pos.x - minX) / rangeX,
        y: (p.pos.y - minY) / rangeY,
      },
    }))

    normPoints.forEach((point: Point) => {
      const pixiDimredPoint = this.getOrCreatePoint(point)
      pixiDimredPoint.updatePosition(this.layoutProps.width)
    })
    // Force redraw by toggling tint (otherwise for strange reasons no rerendering happens)
    this.tint ^= 1
    this.tint ^= 1
  }

  getPointsInBounds(bounds: Rectangle): number[] {
    const selected: number[] = []
    this.pixiDimredPoints.forEach((point, id) => {
      const global = point.getGlobalPosition()
      if (bounds.contains(global.x, global.y)) {
        selected.push(id)
      }
    })
    return selected
  }

  findPointAtGlobal(global: PointData): PixiDimredPoint | null {
    for (const point of this.pixiDimredPoints.values()) {
      const local = this.toLocal(global)
      const dx = local.x - point.x
      const dy = local.y - point.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Match within a reasonable hover radius (e.g. 5 px)
      if (distance <= 5) return point
    }
    return null
  }

  setSelection(selectedIds: number[]) {
    const selectedSet = new Set(selectedIds)
    this.pixiDimredPoints.forEach((point, id) => {
      point.setSelected(selectedSet.has(id))
    })
  }

  bindTooltipEvents(tooltip: PixiTooltip) {
    this.pixiDimredPoints.forEach((pointComp) => {
      pointComp.on('hover', (point) => {
        const global = pointComp.getGlobalPosition()
        tooltip.show(`ID: ${point.item_id}`, global.x + 8, global.y - 6)
      })
      pointComp.on('unhover', () => {
        tooltip.hide()
      })
    })
  }
}
