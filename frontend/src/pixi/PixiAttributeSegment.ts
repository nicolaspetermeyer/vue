import { PixiGraphic } from '@/pixi/Base/PixiGraphic'
import type { AttributeStats, Position } from '@/models/data'
import { Hoverable } from '@/pixi/interactions/controllers/HoverManager'
import { Colors, Styles } from '@/config/Themes'
import { PolarGeometry } from '@/utils/geometry/PolarGeometry'
import { PixiAttributeRing } from '@/pixi/PixiAttributeRing'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { useAttributeFilterStore } from '@/stores/attributeFilterStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { Texture } from 'pixi.js'
import * as PIXI from 'pixi.js'
import { PixiApp } from '@/pixi/Base/PixiApp'
import { TooltipOptions } from '@/pixi/interactions/overlays/PixiTooltip'

export class PixiAttributeSegment extends PixiGraphic implements Hoverable {
  public attributeKey: string
  private globalNorm: number
  private localNorm: number | undefined
  private localMean: number | undefined
  public stats: AttributeStats
  private localOverlays: Map<
    string,
    { color: number; norm: number; localMean: number; fingerprintName: string }
  > = new Map()
  app: PixiApp

  private static segmentRegistry: PixiAttributeSegment[] = []

  public startAngle: number = 0
  public endAngle: number = 0
  public innerRadius: number = 0
  public maxOuterRadius: number = 0
  public centerX: number = 0
  public centerY: number = 0
  public color: number = 0x000000
  private mini: boolean = false

  private isHovered: boolean = false
  public isSelected: boolean = false
  private inSegment: boolean = false
  private inInnerCircle: boolean = false

  private featureCount = useAttributeFilterStore().featureCount

  constructor(options: {
    app: PixiApp
    attributeKey: string
    mini: boolean
    globalNorm: number
    localNorm?: number
    localMean?: number
    color?: number
    stats?: AttributeStats
    fingerprintId?: string
  }) {
    super()

    this.attributeKey = options.attributeKey
    this.globalNorm = options.globalNorm
    this.localNorm = options.localNorm
    this.localMean = options.localMean
    this.mini = options.mini
    this.stats = options.stats || {
      mean: 0,
      normMean: 0,
      normStd: 0,
      median: 0,
      q25: 0,
      q75: 0,
      iqr: 0,
      std: 0,
      min: 0,
      max: 0,
      isGlobal: true,
    }
    this.app = options.app

    if (this.mini) {
      if (options.color !== undefined) {
        this.color = options.color
      }
      this.localNorm = options.localNorm
    }
    // For global rings, handle fingerprint data as overlay
    else if (options.localNorm !== undefined && options.localMean && options.fingerprintId) {
      this.localOverlays.set(options.fingerprintId, {
        norm: options.localNorm,
        localMean: options.localMean,
        color: options.color ?? 0x000000,
        fingerprintName: options.attributeKey,
      })
    }

    this.eventMode = 'static'
    this.cursor = 'default'

    PixiAttributeSegment.segmentRegistry.push(this)
  }

  drawSegment(
    innerRadius: number,
    maxOuterRadius: number,
    startAngle: number,
    endAngle: number,
    centerX: number = 0,
    centerY: number = 0,
    mini: boolean,
  ) {
    // Store geometry for redraws
    this.startAngle = startAngle
    this.endAngle = endAngle
    this.innerRadius = innerRadius
    this.maxOuterRadius = maxOuterRadius
    this.centerX = centerX
    this.centerY = centerY
    this.mini = mini

    this.alpha = mini ? 0.9 : 0.5

    this.clear()

    if (mini) {
      this.drawMiniSegment()
    } else {
      this.drawMainSegment()
    }
  }

  /**
   * Draw a mini segment for fingerprints
   */
  private drawMiniSegment() {
    if (typeof this.localNorm !== 'number') return

    let lineWidth = this.isHovered ? Styles.LINEWIDTH_HOVER_MINI : Styles.LINEWIDTH_MINI
    this.alpha = this.isHovered ? 1 : 0.9
    let color = this.color

    if (this.featureCount > 50) {
      lineWidth = this.isHovered ? Styles.LINEWIDTH_HOVER_MINI_THIN : Styles.LINEWIDTH_MINI_THIN
    }

    // Draw inner circle in the mini ring

    // this.circle(this.centerX, this.centerY, this.innerRadius)
    // this.fill({ color: this.color, alpha: this.alpha })

    // Calculate the outer radius based on the value
    const arcWidth = this.maxOuterRadius - this.innerRadius
    let outerRadius = this.innerRadius + (0.5 + (this.localNorm - this.globalNorm)) * arcWidth
    let innerScale = this.innerRadius

    if (this.isHovered) {
      const expansionFactor = 1
      outerRadius = Math.min(outerRadius * expansionFactor, this.maxOuterRadius * 1.05)
      innerScale = Math.min(this.innerRadius * expansionFactor, outerRadius * 0.95)
      this.alpha = 1
    }

    // Draw the segment arc
    this.drawArc(
      innerScale,
      outerRadius,
      this.startAngle,
      this.endAngle,
      this.color,
      this.color, // Border color
      this.alpha,
      lineWidth,
    )
    const fingerprintStore = useFingerprintStore()
    const fingerprintId =
      this.parent instanceof PixiAttributeRing
        ? (this.parent as PixiAttributeRing).getFingerprint() || 'Unknown'
        : 'Unknown'

    const fp = fingerprintStore.getFingerprintById(fingerprintId)
    if (fp) {
      const stats = fp?.localStats[this.attributeKey]

      if (stats && typeof stats.normStd === 'number') {
        // Calculate standard deviation band

        const normalizedStd = stats.normStd

        // Calculate std radius offsets based on normalized std
        const stdOffset = normalizedStd * arcWidth

        // Calculate upper and lower std bounds
        const stdUpperRadius = Math.min(outerRadius + stdOffset)
        const stdLowerRadius = Math.max(outerRadius - stdOffset)

        // Draw the standard deviation band
        const stdColor = 0x8a9493 // Gray color for std deviation
        this.fill({ color: stdColor, alpha: 0.5 }) // Semi-transparent
        this.stroke({ color: stdColor, width: 0.5, alpha: 1 })

        // Upper std band
        this.moveTo(
          this.centerX + stdLowerRadius * Math.cos(this.startAngle),
          this.centerY + stdLowerRadius * Math.sin(this.startAngle),
        )
          .lineTo(
            this.centerX + stdUpperRadius * Math.cos(this.startAngle),
            this.centerY + stdUpperRadius * Math.sin(this.startAngle),
          )
          .arc(this.centerX, this.centerY, stdUpperRadius, this.startAngle, this.endAngle)
          .lineTo(
            this.centerX + stdLowerRadius * Math.cos(this.endAngle),
            this.centerY + stdLowerRadius * Math.sin(this.endAngle),
          )
          .arc(this.centerX, this.centerY, stdLowerRadius, this.endAngle, this.startAngle, true)
        this.closePath()
        this.fill()
        this.stroke()
      }
    }
  }

  /**
   * Draw main segment with global and overlay data
   */
  private drawMainSegment() {
    if (typeof this.globalNorm !== 'number' || this.globalNorm <= 0) return

    const lineWidth = this.isHovered ? Styles.LINEWIDTH_HOVER : Styles.LINEWIDTH

    const arcWidth = this.maxOuterRadius - this.innerRadius
    const globalOuterRadius = this.innerRadius + 0.5 * arcWidth

    // Draw global segment
    this.drawArc(
      this.innerRadius,
      globalOuterRadius,
      this.startAngle,
      this.endAngle,
      Colors.GLOBAL_SEGMENT,
      Colors.STANDARD_BORDER,
      this.alpha,
      lineWidth,
    )

    // Draw overlays if present
    const overlays = this.localOverlays
    // const singleComparison = overlays?.size === 1

    if (overlays && overlays.size > 0) {
      overlays.forEach((overlay) => {
        const normDifference = overlay.norm - this.globalNorm
        const localOuterRadius = this.innerRadius + (0.5 + normDifference) * arcWidth

        let fillColor = overlay.color
        let borderColor = overlay.color

        // if (singleComparison) {
        //   fillColor =
        //     localOuterRadius > globalOuterRadius
        //       ? Colors.OVERLAY_SEGMENT_BIGGER
        //       : Colors.OVERLAY_SEGMENT_SMALLER
        //   borderColor = fillColor
        // }

        // Draw the overlay arc
        this.drawArc(
          this.innerRadius,
          localOuterRadius,
          this.startAngle,
          this.endAngle,
          fillColor,
          borderColor,
          0.1,
          lineWidth,
        )
      })
    }
  }

  /**
   * Draw an arc segment with given parameters
   */
  private drawArc(
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
    fillColor: number,
    borderColor: number,
    alpha: number,
    lineWidth: number,
  ) {
    this.moveTo(
      this.centerX + innerRadius * Math.cos(startAngle),
      this.centerY + innerRadius * Math.sin(startAngle),
    )
      .lineTo(
        this.centerX + outerRadius * Math.cos(startAngle),
        this.centerY + outerRadius * Math.sin(startAngle),
      )
      .arc(this.centerX, this.centerY, outerRadius, startAngle, endAngle)
      .lineTo(
        this.centerX + innerRadius * Math.cos(endAngle),
        this.centerY + innerRadius * Math.sin(endAngle),
      )
      .arc(this.centerX, this.centerY, innerRadius, endAngle, startAngle, true)
      .closePath()

    this.stroke({ color: borderColor ?? fillColor, width: lineWidth })

    if (Colors.FILL_STYLE || this.mini) {
      this.fill({ color: fillColor, alpha: alpha })
    }
  }

  private redraw(): void {
    this.drawSegment(
      this.innerRadius,
      this.maxOuterRadius,
      this.startAngle,
      this.endAngle,
      this.centerX,
      this.centerY,
      this.mini,
    )
  }

  /**
   * Update the visual state of the point based on its selection and hover state.
   */
  updateVisualState() {
    if (this.isSelected) {
      this.tint = Colors.SELECTED_SEGMENT
    } else if (this.isHovered) {
      this.tint = Colors.HOVERED
    } else {
      this.tint = Colors.GLOBAL_SEGMENT
    }
  }

  clearLocalOverlay(): void {
    this.localOverlays.clear()
    this.localNorm = undefined
    this.color = 0x000000
    this.redraw()
  }

  /**
   * Clear a specific point overlay by its ID
   * @param id - The ID of the point to clear
   */

  clearPointOverlay(id: string): void {
    if (!this.localOverlays.has(id)) return

    this.localOverlays.delete(id)

    if (this.localOverlays.size === 0) {
      this.localNorm = undefined
      this.color = 0x000000
    } else {
      const lastOverlay = Array.from(this.localOverlays.values()).pop()
      this.localNorm = lastOverlay?.norm
      this.color = lastOverlay?.color ?? 0x000000
    }
    this.redraw()
  }

  setLocalOverlay(
    id: string,
    localNorm: number,
    localMean: number,
    color: number,
    fingerprintName: string,
  ): void {
    this.localOverlays.set(id, { norm: localNorm, localMean, color, fingerprintName })
    // this.localNorm = localNorm
    // this.color = color

    this.redraw()
  }

  containsGlobal(global: Position): boolean {
    const local = this.parent.toLocal(global)

    // Convert to polar coordinates
    const { radius, angle } = PolarGeometry.cartesianToPolar(local, this.centerX, this.centerY)

    //limit hit detection to drawn area
    const arcWidth = this.maxOuterRadius - this.innerRadius
    const actualOuterRadius = this.innerRadius + 0.5 * arcWidth

    const inSegment = PolarGeometry.isInSegment(
      radius,
      angle,
      this.innerRadius,
      this.maxOuterRadius,
      this.startAngle,
      this.endAngle,
      actualOuterRadius,
    )

    if (this.mini) {
      const inInnerCircle = radius <= this.innerRadius
      if (inSegment) {
        this.inSegment = true
        this.inInnerCircle = false
        return true
      }
      if (inInnerCircle) {
        this.inInnerCircle = true
        this.inSegment = false
        return true
      }
    }

    return inSegment
  }

  setHovered(hovered: boolean, propagate: boolean = true) {
    if (this.isHovered !== hovered) {
      this.isHovered = hovered
      this.redraw()
      this.alpha = hovered ? 1 : 0.5

      if (propagate) {
        PixiAttributeSegment.segmentRegistry.forEach((segment) => {
          if (segment !== this && segment.attributeKey === this.attributeKey) {
            segment.setHovered(hovered, false)
          }
        })
      }
    }
  }

  clickSegment(selected: boolean) {
    if (this.isSelected !== selected) {
      this.isSelected = selected
      this.updateVisualState()
    }
  }

  getTooltipOptions(x: number, y: number): TooltipOptions {
    // Create the density plot texture
    const texture = this.createDensityPlotTexture()

    // Prepare tooltip options
    const options: TooltipOptions = {
      title: `Feature: ${this.attributeKey}`,
      texture: texture,
      x: x,
      y: y,
    }

    // Add text content based on segment type
    if (this.mini) {
      const fingerprintStore = useFingerprintStore()
      const fingerprintId =
        this.parent instanceof PixiAttributeRing
          ? (this.parent as PixiAttributeRing).getFingerprint() || 'Unknown'
          : 'Unknown'

      const fp = fingerprintStore.getFingerprintById(fingerprintId)
      if (fp) {
        const stats = fp?.localStats[this.attributeKey]

        if (stats) {
          const _localNorm = stats.localNormMean ?? 0
          const delta = _localNorm - stats.normMean
          const direction = delta > 0 ? 'higher' : 'lower'
          const pctDiff = Math.abs(delta * 100).toFixed(1)

          options.text = [
            `${fp.name}`,
            `Global Normalized Mean: ${_localNorm.toFixed(2)}`,
            `Global Mean: ${stats.mean.toFixed(2)}`,
            `Global Std: ${this.stats.std.toFixed(2)}`,
            `Segment ${this.attributeKey}: ${pctDiff}% ${direction}`,
          ].join('\n')
        }
      }
    } else {
      const tooltipLines = [
        `Global Normalized Mean: ${this.globalNorm.toFixed(2)}`,
        `Global Mean: ${this.stats.mean.toFixed(2)}`,
        `Global Std: ${this.stats.std.toFixed(2)}`,
      ]

      if (this.localOverlays && this.localOverlays.size > 0) {
        tooltipLines.push('', 'Comparisons:')
        this.localOverlays.forEach((overlay, id) => {
          const norm = overlay.norm.toFixed(2)
          const localMean = overlay.localMean.toFixed(2)
          const delta = overlay.norm - this.globalNorm
          const direction = delta > 0 ? 'higher' : 'lower'
          const pctDiff = Math.abs(delta * 100).toFixed(2)

          tooltipLines.push(
            `${overlay.fingerprintName}: ${norm} ${localMean} ${pctDiff}% ${direction}`,
          )
        })
      }

      options.text = tooltipLines.join('\n')
    }

    return options
  }

  createDensityPlotTexture(): Texture {
    const { min, max, mean, std } = this.stats
    const width = 200
    const height = 80

    const container = new PIXI.Container()

    // Create a graphics object to draw the plot
    const graphics = new PIXI.Graphics()
    container.addChild(graphics)

    // Draw background
    graphics.fill({ color: 0xffffff })
    graphics.rect(0, 0, width, height)
    graphics.stroke()

    // Set up coordinate mapping functions
    const mapX = (x: number) => 10 + ((x - min) / (max - min)) * (width - 20)
    const mapY = (y: number, maxDensity: number) => height - 20 - (y / maxDensity) * (height - 30)

    const projectionStore = useProjectionStore()
    const fingerprintStore = useFingerprintStore()

    const globalValues = projectionStore.projection
      .map((d) => d.original[this.attributeKey])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v))

    let currentFingerprintValues: number[] = []
    let currentFingerprintColor = this.color
    let currentFingerprintMean = mean

    if (this.mini) {
      const fingerprintId =
        this.parent instanceof PixiAttributeRing
          ? (this.parent as PixiAttributeRing).getFingerprint() || 'Unknown'
          : 'Unknown'

      const fp = fingerprintStore.getFingerprintById(fingerprintId)
      if (fp) {
        currentFingerprintValues = fp.projectedPoints
          .map((point) => (point ? point.original[this.attributeKey] : null))
          .filter((v): v is number => typeof v === 'number' && !isNaN(v))

        const stats = fp.localStats[this.attributeKey]
        if (stats) {
          currentFingerprintMean = stats.mean
        }
      }
    }

    const fingerprintData: Map<
      string,
      { values: number[]; color: number; mean: number; bins?: number[] }
    > = new Map()

    if (this.mini && currentFingerprintValues.length > 0) {
      fingerprintData.set('current', {
        values: currentFingerprintValues,
        color: currentFingerprintColor,
        mean: currentFingerprintMean,
      })
    }

    if (this.localOverlays && this.localOverlays.size > 0) {
      this.localOverlays.forEach((overlay, id) => {
        const fp = fingerprintStore.getFingerprintById(id)
        if (fp) {
          const values = fp.projectedPoints
            .map((point) => {
              return point ? point.original[this.attributeKey] : null
            })
            .filter((v): v is number => typeof v === 'number' && !isNaN(v))

          fingerprintData.set(id, {
            values,
            color: overlay.color,
            mean: overlay.localMean,
          })
        }
      })
    }

    // Generate kernel density estimation for normal distribution
    const binCount = 50
    const binSize = (max - min) / binCount
    // Function to estimate kernel density from values
    const estimateKDE = (values: number[], bandwidth = 0.2 * std) => {
      const bins = new Array(binCount).fill(0)

      // For each data point, add its contribution to all bins
      values.forEach((val) => {
        if (val >= min && val <= max) {
          for (let i = 0; i < binCount; i++) {
            const binCenter = min + (i + 0.5) * binSize
            // Gaussian kernel
            const kernelValue = Math.exp(-0.5 * Math.pow((val - binCenter) / bandwidth, 2))
            bins[i] += kernelValue
          }
        }
      })

      // Normalize by number of values
      if (values.length > 0) {
        for (let i = 0; i < binCount; i++) {
          bins[i] /= values.length * bandwidth * Math.sqrt(2 * Math.PI)
        }
      }

      return bins
    }
    const globalBins = estimateKDE(globalValues)

    let maxDensity = Math.max(...globalBins, 0.00001)

    fingerprintData.forEach((data, id) => {
      const bins = estimateKDE(data.values, 0.15 * std)
      data.bins = bins

      const fpMaxDensity = Math.max(...bins)
      if (fpMaxDensity > maxDensity) {
        maxDensity = fpMaxDensity
      }
    })

    graphics.clear()
    graphics.fill({ color: 0xffffff })
    graphics.rect(0, 0, width, height)
    graphics.stroke({ width: 1, color: 0x666666, alpha: 0.3 })

    // Draw global density curve
    graphics.stroke({ width: 1, color: 0x666666 })
    graphics.fill({ color: 0x666666, alpha: 0.2 })

    // Start path at the bottom left
    graphics.moveTo(mapX(min), height - 20)

    // Draw the curve
    for (let i = 0; i < binCount; i++) {
      const x = min + (i + 0.5) * binSize
      const y = globalBins[i]
      graphics.lineTo(mapX(x), mapY(y, maxDensity))
    }

    // Close the path to the bottom right
    graphics.lineTo(mapX(max), height - 20)
    graphics.closePath()
    graphics.fill()
    graphics.stroke()

    // Draw mean marker for global
    graphics.stroke({ width: 1.5, color: 0x666666 })
    graphics.moveTo(mapX(mean), height - 20)
    graphics.lineTo(mapX(mean), height - 17)

    // Draw all fingerprint density curves
    fingerprintData.forEach((data, id) => {
      if (!data.bins || data.bins.length === 0) return

      graphics.stroke({ width: 1.5, color: data.color })
      graphics.fill({ color: data.color, alpha: 0.3 })

      // Start path
      graphics.moveTo(mapX(min), height - 20)

      // Draw the curve
      for (let i = 0; i < binCount; i++) {
        const x = min + (i + 0.5) * binSize
        const y = data.bins[i]
        graphics.lineTo(mapX(x), mapY(y, maxDensity))
      }

      // Close the path
      graphics.lineTo(mapX(max), height - 20)
      graphics.closePath()
      graphics.fill()
      graphics.stroke()

      // Draw mean marker
      graphics.stroke({ width: 1.5, color: data.color })
      graphics.moveTo(mapX(data.mean), height - 20)
      graphics.lineTo(mapX(data.mean), height - 25)
    })

    const selectedPoints = projectionStore.projectionInstance?.dimred.getSelectedProjections() || []

    let selectedPointValue = null
    if (selectedPoints.length === 1) {
      const selectedPoint = selectedPoints[0]
      if (selectedPoint.original[this.attributeKey] !== undefined) {
        selectedPointValue = selectedPoint.original[this.attributeKey]

        if (typeof selectedPointValue === 'number' && !isNaN(selectedPointValue)) {
          graphics.moveTo(mapX(selectedPointValue), height - 20)
          graphics.lineTo(mapX(selectedPointValue), 5)
          graphics.stroke({ width: 2, color: 0xff0000 })

          graphics.fill({ color: 0xff0000 })
          graphics.poly([
            mapX(selectedPointValue),
            height - 20,
            mapX(selectedPointValue) - 5,
            height - 15,
            mapX(selectedPointValue) + 5,
            height - 15,
          ])
        }
      }
    }

    // Draw axis
    graphics.stroke({ width: 1, color: 0x000000 })
    graphics.moveTo(10, height - 20)
    graphics.lineTo(width - 10, height - 20)

    const textStyle = new PIXI.TextStyle({
      fontSize: 10,
      fill: 0x000000,
      align: 'center' as const,
    })

    const minText = new PIXI.Text({ text: min.toFixed(1), style: textStyle })
    minText.position.set(10, height - 15)
    container.addChild(minText)

    const maxText = new PIXI.Text({ text: max.toFixed(1), style: textStyle })
    maxText.position.set(width - 25, height - 15)
    container.addChild(maxText)

    const meanText = new PIXI.Text({ text: mean.toFixed(1), style: textStyle })
    meanText.anchor.set(0.5, 0)
    meanText.position.set(mapX(mean), height - 15)
    container.addChild(meanText)

    // Create a texture from the graphics
    const texture = this.app.renderer.generateTexture(container)
    return texture
  }

  destroy(options?: any): void {
    const index = PixiAttributeSegment.segmentRegistry.findIndex((segment) => segment === this)
    if (index !== -1) {
      PixiAttributeSegment.segmentRegistry.splice(index, 1)
    }
    super.destroy(options)
  }

  getId(): string {
    return this.attributeKey
  }
  get attrkey(): string {
    return this.attributeKey
  }
  get globValue(): number {
    return this.globalNorm
  }
  get locValue(): number | undefined {
    return this.localNorm
  }
}
