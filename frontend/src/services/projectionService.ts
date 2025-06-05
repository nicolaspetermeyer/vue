import { useDatasetStore } from '@/stores/datasetStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { usePointFilterStore } from '@/stores/pointFilterStore'
import { useAttributeFilterStore } from '@/stores/attributeFilterStore'
import { useDrillDownStore } from '@/stores/drillDownStore'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import {
  fetchProjection,
  fetchAttributeSubset,
  fetchFeatureRanking,
  fetchSubsetProjection,
} from '@/services/api'
import { animationService } from '@/services/animationService'
import type { Projection, AttributeStats, FeatureRanking } from '@/models/data'

/**
 * Centralized service for handling all projection-related operations
 */
class ProjectionService {
  /**
   * Load initial projection with current dataset and method
   */
  async loadProjection(): Promise<boolean> {
    const datasetStore = useDatasetStore()
    const projectionStore = useProjectionStore()

    const dataset = datasetStore.selectedDatasetName
    if (!dataset) {
      console.error('No dataset selected')
      return false
    }

    // Prevent concurrent loads
    if (projectionStore.isLoading) {
      console.warn('Projection loading already in progress')
      return false
    }

    projectionStore.setLoading(true)

    try {
      const result = await fetchProjection(dataset, projectionStore.projectionMethod)

      // Update projection store with results
      projectionStore.setGlobalStats(result.globalStats)
      projectionStore.setProjection(result.projectionData)
      projectionStore.unfilteredProjection = result.projectionData

      // Initialize related stores
      const pointFilterStore = usePointFilterStore()
      pointFilterStore.initAvailablePointFilters(
        result.nonNumericAttributes,
        result.categoryValues || {},
      )

      const attributeFilterStore = useAttributeFilterStore()
      attributeFilterStore.initAttributeMetadata(result.numericAttributes, result.attributeMetadata)

      // Clear history and selections
      useDrillDownStore().clearHistory()
      useFingerprintStore().clearFingerprints()

      // await loadFeatureRanking()

      return true
    } catch (error) {
      console.error('Error loading projection:', error)
      return false
    } finally {
      projectionStore.setLoading(false)
    }
  }

  /**
   * Recalculate projection with filtered attributes
   */
  async recalculateWithAttributes(attributes: string[]): Promise<boolean> {
    const datasetStore = useDatasetStore()
    const projectionStore = useProjectionStore()
    const attributeFilterStore = useAttributeFilterStore()

    const dataset = datasetStore.selectedDatasetName
    if (!dataset || attributes.length === 0) {
      return false
    }

    attributeFilterStore.setRecalculating(true)

    try {
      // Preserve current positions for animation
      const currentPositions = new Map<string, { x: number; y: number }>()
      projectionStore.projection.forEach((point) => {
        currentPositions.set(point.id, { ...point.pos })
      })

      // Request recalculation with filtered attributes
      const result = await fetchAttributeSubset(
        dataset,
        projectionStore.projectionMethod,
        attributes,
      )

      if (!result || !result.projectionData) {
        throw new Error('Invalid response from attribute subset calculation')
      }

      // Prepare new projection with animation base positions
      const newProjection = result.projectionData.map((point: any) => {
        return {
          ...point,
          basePos: currentPositions.get(point.id) || point.pos,
        } as Projection
      })

      // Update stores
      projectionStore.setGlobalStats(result.globalStats)
      projectionStore.setProjection(newProjection)

      // Update visualization
      this.updateVisualization(newProjection, attributes)

      return true
    } catch (error) {
      console.error('Error recalculating projection with filtered attributes:', error)
      return false
    } finally {
      attributeFilterStore.setRecalculating(false)
    }
  }

  /**
   * Reset to base unfiltered projection
   */
  resetToBaseProjection(): void {
    const projectionStore = useProjectionStore()
    const attributeFilterStore = useAttributeFilterStore()

    projectionStore.resetToBaseProjection()

    // Update visualization
    if (projectionStore.projectionInstance) {
      const numericAttributes = attributeFilterStore.allNumericAttributes
      projectionStore.projectionInstance.updateAttributeRing(numericAttributes)

      if (projectionStore.projectionInstance.dimred) {
        projectionStore.projectionInstance.dimred.updatePoints(projectionStore.projection, true)
      }
    }
  }

  /**
   * Apply point filter (visual filter only, no recalculation)
   */
  applyPointFilter(category: string | null, values: string[]): void {
    const projectionStore = useProjectionStore()
    const pointFilterStore = usePointFilterStore()

    pointFilterStore.setPointFilter(category, values)

    if (!projectionStore.projectionInstance) return

    const fullProjection = projectionStore.projection

    // If no filter or all points match filter, show all points
    if (!category || values.length === 0) {
      projectionStore.projectionInstance.showAllPoints()
      return
    }

    // Find indices of points that match the filter
    const filteredIndices = fullProjection
      .map((point, index) => {
        if (!point.original || !category) return -1
        const value = String(point.original[category])
        const stringValues = values.map((v) => String(v))
        console.log(
          `Checking point ${point.id} for category ${category}: value=${value}, filter=${values}`,
        )
        console.log(stringValues.includes(value))
        return stringValues.includes(value) ? index : -1
      })
      .filter((idx) => idx !== -1)

    // Apply filter to visualization
    projectionStore.projectionInstance.filterPoints(filteredIndices)
  }

  clearPointFilter(): void {
    const projectionStore = useProjectionStore()
    const pointFilterStore = usePointFilterStore()
    pointFilterStore.clearActivePointFilter()

    if (!projectionStore.projectionInstance) return

    // Show all points in the visualization
    projectionStore.projectionInstance.showAllPoints()
  }

  /**
   * Drill down to analyze a data subset
   */
  async drillDownToSubset(fingerprintId: string): Promise<boolean> {
    const datasetStore = useDatasetStore()
    const projectionStore = useProjectionStore()
    const drillDownStore = useDrillDownStore()

    const fingerprint = useFingerprintStore().getFingerprintById(fingerprintId)
    if (!fingerprint) {
      console.error(`Fingerprint with ID ${fingerprintId} not found`)
      return false
    }
    const pointIds = fingerprint.projectedPoints.map((p) => p.id)

    const dataset = datasetStore.selectedDatasetName
    if (!dataset || !pointIds.length) {
      return false
    }

    drillDownStore.setLoading(true)

    try {
      // Save current positions for transitions
      const currentPositions = new Map<string, { x: number; y: number }>()
      projectionStore.projection.forEach((point) => {
        currentPositions.set(point.id, { ...point.pos })
      })

      // Save current state to history
      drillDownStore.saveProjectionState({
        projection: [...projectionStore.projection],
        stats: { ...projectionStore.globalStats },
        parentId: drillDownStore.currentParentId,
        originalPositions: currentPositions,
      })
      console.log('Saved current projection state to history:', drillDownStore.projectionHistory)

      // Fetch subprojection from backend
      const result = await fetchSubsetProjection(
        dataset,
        projectionStore.projectionMethod,
        pointIds,
      )

      // Update projection with new positions
      const filteredProjection = projectionStore.projection
        .filter((point) => pointIds.includes(point.id))
        .map((point) => {
          const currentPos = { ...point.pos }
          if (point.id in result.positionMapping) {
            return {
              ...point,
              basePos: currentPos,
              pos: { ...result.positionMapping[point.id] },
            }
          }
          return point
        })

      const transformedGlobalStats: Record<string, AttributeStats> = {}

      for (const [key, stat] of Object.entries(fingerprint.localStats)) {
        transformedGlobalStats[key] = {
          // Convert local values to global values in the new context
          mean: stat.localMean || stat.mean,
          normMean: stat.localNormMean || stat.normMean,
          std: stat.std,
          min: stat.min,
          max: stat.max,

          // Set the same values for normMean for compatibility
          localMean: stat.localMean || stat.mean,
          localNormMean: stat.localNormMean || stat.normMean,

          // Mark as global since these are now the global stats for the drilled-down view
          isGlobal: true,
        }
      }

      // Update stores
      useProjectionStore().setGlobalStats(transformedGlobalStats)
      projectionStore.setProjection(filteredProjection)
      drillDownStore.setOriginalPositions(currentPositions)
      drillDownStore.setParentId(fingerprintId)

      // Update visualization with animation
      this.updateVisualizationWithAnimation(filteredProjection)

      return true
    } catch (error) {
      console.error('Error drilling down to subset:', error)
      return false
    } finally {
      drillDownStore.setLoading(false)
    }
  }

  /**
   * Navigate back from drill-down view
   */
  navigateBack(): boolean {
    const projectionStore = useProjectionStore()
    const drillDownStore = useDrillDownStore()

    if (!drillDownStore.canGoBack) {
      return false
    }

    const previousState = drillDownStore.popHistoryState()
    if (!previousState) {
      return false
    }

    // Calculate current positions for transition animation
    const currentPositions = new Map<string, { x: number; y: number }>()
    projectionStore.projection.forEach((point) => {
      currentPositions.set(point.id, { ...point.pos })
    })

    // Restore projection with base positions for animation
    const restoredProjection = previousState.projection.map((point) => {
      if (previousState.originalPositions && previousState.originalPositions.has(point.id)) {
        const originalPos = previousState.originalPositions.get(point.id)!
        return {
          ...point,
          basePos: currentPositions.has(point.id) ? currentPositions.get(point.id)! : point.pos,
          pos: { ...originalPos },
        }
      }
      return point
    })

    // Update stores
    projectionStore.setProjection(restoredProjection)
    projectionStore.setGlobalStats({ ...previousState.stats })
    drillDownStore.setParentId(previousState.parentId)

    // Update visualization with animation
    requestAnimationFrame(() => {
      this.updateVisualizationWithAnimation(restoredProjection)
    })

    return true
  }

  /**
   * Load feature ranking data
   */
  async loadFeatureRanking(radius: number | null = null): Promise<FeatureRanking[] | null> {
    const datasetStore = useDatasetStore()
    const projectionStore = useProjectionStore()

    const dataset = datasetStore.selectedDatasetName
    if (!dataset) {
      return null
    }

    const neighborhoodRadius = radius ?? projectionStore.neighborhoodRadius

    try {
      const rankings = await fetchFeatureRanking(
        dataset,
        projectionStore.projectionMethod,
        neighborhoodRadius,
      )

      if (rankings) {
        // Update store
        projectionStore.featureRanking = rankings

        if (radius !== null) {
          projectionStore.neighborhoodRadius = radius
        }
      }

      return rankings
    } catch (error) {
      console.error('Failed to load feature ranking:', error)
      return null
    }
  }

  /**
   * Update visualization components
   */
  private updateVisualization(projectionData: Projection[], attributes?: string[]): void {
    const projectionStore = useProjectionStore()
    const instance = projectionStore.projectionInstance

    if (!instance) return

    // Update projection visualization

    if (instance.dimred) {
      this.updateVisualizationWithAnimation(projectionData, 800)
    }

    // Update attribute ring if attributes are provided
    if (attributes && instance.attributeRing) {
      instance.updateAttributeRing(attributes)
    }
  }

  /**
   * Update visualization with animation transition
   */
  private updateVisualizationWithAnimation(
    projectionData: Projection[],
    duration: number = 800,
  ): void {
    const projectionStore = useProjectionStore()
    const instance = projectionStore.projectionInstance

    if (!instance) return

    // Start animation
    animationService.startTransition(duration, projectionData)

    // Update visualization
    if (instance.dimred) {
      instance.dimred.updatePoints(projectionData, true)
    }
  }

  /**
   * Clear all projection data
   */
  clearAllProjectionData(): void {
    const projectionStore = useProjectionStore()
    const drillDownStore = useDrillDownStore()
    const attributeFilterStore = useAttributeFilterStore()
    const fingerprintStore = useFingerprintStore()

    projectionStore.clearAllProjectionData()
    drillDownStore.clearHistory()
    attributeFilterStore.clearAll()
    fingerprintStore.clearFingerprints()
  }
}

// Create singleton instance
export const projectionService = new ProjectionService()
