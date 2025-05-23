import { Colors } from '@/config/Themes'
import type { Fingerprint, FeatureStats } from '@/models/data'
import type { PixiProjection } from '@/pixi/PixiProjection'

export class FingerprintVisualizationService {
  private availableColorIndices: number[] = []
  private fingerprintColorMap: Record<string, number> = {}

  constructor() {
    this.resetColors()
  }

  resetColors(): void {
    this.availableColorIndices = [...Array(Colors.FINGERPRINT_COLORS.length).keys()]
    this.fingerprintColorMap = {}
  }

  assignColor(fingerprintId: string): number {
    if (this.availableColorIndices.length > 0) {
      const colorIndex = this.availableColorIndices.shift()!
      const color = Colors.FINGERPRINT_COLORS[colorIndex]
      this.fingerprintColorMap[fingerprintId] = color
      return color
    }
    // Default to first color if none available
    return Colors.FINGERPRINT_COLORS[0]
  }

  releaseColor(fingerprintId: string): void {
    const color = this.fingerprintColorMap[fingerprintId]
    if (color !== undefined) {
      const colorIndex = Colors.FINGERPRINT_COLORS.indexOf(color)
      if (colorIndex !== -1 && !this.availableColorIndices.includes(colorIndex)) {
        this.availableColorIndices.push(colorIndex)
        this.availableColorIndices.sort((a, b) => a - b)
      }
      delete this.fingerprintColorMap[fingerprintId]
    }
  }

  getFingerprintColor(fingerprintId: string): number {
    return this.fingerprintColorMap[fingerprintId] || Colors.FINGERPRINT_COLORS[0]
  }

  getComparisonColors(fingerprints: Fingerprint[]): Record<string, number> {
    const colorMap: Record<string, number> = {}
    fingerprints.forEach((fp) => {
      colorMap[fp.id] = fp.color || this.fingerprintColorMap[fp.id] || Colors.FINGERPRINT_COLORS[0]
    })
    return colorMap
  }

  updateAttributeRingVisualization(
    projectionInstance: PixiProjection | null | undefined,
    selectedFingerprints: Fingerprint[],
  ): void {
    const ring = projectionInstance?.attributeRing
    if (ring) {
      if (selectedFingerprints.length > 0) {
        ring.clearLocalRing()
        const colorMap = this.getComparisonColors(selectedFingerprints)

        selectedFingerprints.forEach((fp) => {
          const color = colorMap[fp.id]
          ring.setLocalRing(fp.id, fp.localStats, color)
        })

        this.highlightFingerprintPoints(projectionInstance, selectedFingerprints, colorMap)
      } else {
        // Clear visualization when no fingerprints are selected
        ring.clearLocalRing()
        this.clearHighlighting(projectionInstance)
      }
    }
  }

  highlightFingerprintPoints(
    projectionInstance: PixiProjection | null | undefined,
    fingerprints: Fingerprint[],
    colorMap: Record<string, number>,
  ): void {
    if (projectionInstance?.dimred) {
      const pointColorMap: Record<string, number> = {}
      fingerprints.forEach((fp) => {
        const color = colorMap[fp.id]
        fp.projectedPoints.forEach((point) => {
          pointColorMap[point.id] = color
        })
      })
      projectionInstance.dimred.highlightFingerprintPoints(pointColorMap)
    }
  }

  clearHighlighting(projectionInstance: PixiProjection | null | undefined): void {
    projectionInstance?.dimred?.highlightFingerprintPoints({})
  }
}
