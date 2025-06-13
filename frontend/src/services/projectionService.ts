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
  fetchKMeansClustering,
} from '@/services/api'
import { animationService } from '@/services/animationService'
import type { Projection, AttributeStats, FeatureRanking } from '@/models/data'
import { calcFingerprintStats } from '@/utils/calculations/calcFingerprintStats'

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

    projectionStore.setLoading(true)

    const dataset = datasetStore.selectedDatasetName
    const previousDataset = datasetStore.currentDatasetName

    if (!dataset) {
      console.error('No dataset selected')
      return false
    }

    projectionStore.setLoading(true)

    try {
      let projectionParams

      switch (projectionStore.projectionMethod) {
        case 'tsne':
          projectionParams = { perplexity: projectionStore.perplexity }
          break
        case 'umap':
          projectionParams = {
            n_neighbors: projectionStore.umapNeighbors,
            min_dist: projectionStore.umapMinDist,
          }
          break
        default:
          projectionParams = undefined
      }
      const result = await fetchProjection(
        dataset,
        projectionStore.projectionMethod,
        projectionParams,
      )

      console.log('Projection result:', result)

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

      if (previousDataset !== dataset) {
        useFingerprintStore().clearFingerprints()
      }

      // await loadFeatureRanking()
      datasetStore.setCurrentDatasetName(dataset)
      projectionStore.setLoading(false)

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

      let projectionParams

      switch (projectionStore.projectionMethod) {
        case 'tsne':
          projectionParams = { perplexity: projectionStore.perplexity }
          break
        case 'umap':
          projectionParams = {
            n_neighbors: projectionStore.umapNeighbors,
            min_dist: projectionStore.umapMinDist,
          }
          break
        default:
          projectionParams = undefined
      }

      // Request recalculation with filtered attributes
      const result = await fetchAttributeSubset(
        dataset,
        projectionStore.projectionMethod,
        attributes,
        projectionParams,
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

  removePoint(pointId: string): void {
    const projectionStore = useProjectionStore()

    projectionStore.removedPointIds.add(pointId)

    if (projectionStore.projectionInstance?.dimred) {
      projectionStore.projectionInstance.dimred.hidePointsById([pointId])
    }

    this.updateDrillDownHistoryForRemovedPoints([pointId])
  }

  removePoints(pointIds: string[]): void {
    const projectionStore = useProjectionStore()

    pointIds.forEach((id) => {
      projectionStore.removedPointIds.add(id)
    })

    if (projectionStore.projectionInstance?.dimred) {
      projectionStore.projectionInstance.dimred.hidePointsById(pointIds)
    }

    this.updateDrillDownHistoryForRemovedPoints(pointIds)
  }

  cancelRemovedPoints(): void {
    const projectionStore = useProjectionStore()

    projectionStore.removedPointIds.clear()

    if (projectionStore.projectionInstance?.dimred) {
      projectionStore.projectionInstance.dimred.showAllPoints()
    }
  }

  /**
   * Recalculate projection without removed points
   */
  async recalculateWithoutRemovedPoints(): Promise<boolean> {
    const datasetStore = useDatasetStore()
    const projectionStore = useProjectionStore()
    const attributeFilterStore = useAttributeFilterStore()

    const dataset = datasetStore.selectedDatasetName
    if (!dataset) {
      console.error('No dataset selected')
      return false
    }

    projectionStore.setLoading(true)

    try {
      // Get all point IDs except the removed ones
      const removedIds = Array.from(projectionStore.removedPointIds)
      const validPointIds = projectionStore.projection
        .map((p) => p.id)
        .filter((id) => !removedIds.includes(id))

      // Preserve current positions for animation
      const currentPositions = new Map<string, { x: number; y: number }>()
      projectionStore.projection
        .filter((point) => !removedIds.includes(point.id))
        .forEach((point) => {
          currentPositions.set(point.id, { ...point.pos })
        })

      let projectionParams

      switch (projectionStore.projectionMethod) {
        case 'tsne':
          projectionParams = { perplexity: projectionStore.perplexity }
          break
        case 'umap':
          projectionParams = {
            n_neighbors: projectionStore.umapNeighbors,
            min_dist: projectionStore.umapMinDist,
          }
          break
        default:
          projectionParams = undefined
      }

      // Request recalculation with subset of points
      const result = await fetchSubsetProjection(
        dataset,
        projectionStore.projectionMethod,
        validPointIds,
        projectionParams,
      )

      if (!result || !result.positionMapping) {
        throw new Error('Invalid response from recalculation')
      }

      // Prepare new projection with animation base positions
      const newProjection = projectionStore.projection
        .filter((point) => !removedIds.includes(point.id))
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

      const match = newProjection.map((point) => point.original)
      const newGlobalStats = calcFingerprintStats(match)

      // Update stores
      projectionStore.setGlobalStats(newGlobalStats)
      projectionStore.setProjection(newProjection)
      projectionStore.unfilteredProjection = newProjection
      projectionStore.removedPointIds.clear()

      // Update visualization with animation
      this.updateVisualizationWithAnimation(newProjection)

      if (projectionStore.projectionInstance) {
        const numericAttributes = attributeFilterStore.allNumericAttributes
        projectionStore.projectionInstance.updateAttributeRing(numericAttributes)
      }

      return true
    } catch (error) {
      return false
    } finally {
    }
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
          normStd: stat.normStd,
          median: stat.median,
          q25: stat.q25,
          q75: stat.q75,
          iqr: stat.iqr,
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
    const fingerprintStore = useFingerprintStore()

    if (!drillDownStore.canGoBack) {
      return false
    }

    const previousState = drillDownStore.popHistoryState()
    if (!previousState) {
      return false
    }
    fingerprintStore.deselectAllFingerprints

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

  private updateDrillDownHistoryForRemovedPoints(pointIds: string[]): void {
    const drillDownStore = useDrillDownStore()

    if (!drillDownStore.isDrilledDownView) return

    const removedPointsSet = new Set(pointIds)

    drillDownStore.projectionHistory = drillDownStore.projectionHistory.map((state) => {
      const filteredProjection = state.projection.filter((point) => !removedPointsSet.has(point.id))

      if (state.originalPositions) {
        const newPositions = new Map(state.originalPositions)
        pointIds.forEach((id) => {
          newPositions.delete(id)
        })
        state.originalPositions = newPositions
      }

      return {
        ...state,
        projection: filteredProjection,
      }
    })
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

  /**
   * Perform K-means clustering and create fingerprints for each cluster
   *
   * @param numClusters Number of clusters to generate
   * @returns Promise resolving to true if successful, false otherwise
   */
  async createClusterFingerprints(numClusters: number = 3): Promise<boolean> {
    const datasetStore = useDatasetStore()
    const fingerprintStore = useFingerprintStore()
    const projectionStore = useProjectionStore()

    const dataset = datasetStore.selectedDatasetName
    if (!dataset) {
      console.error('No dataset selected')
      return false
    }

    try {
      const result = await fetchKMeansClustering(dataset, numClusters)

      const clusterResults = result.clusters
      const projection = projectionStore.projection

      const dimredInstance = projectionStore.projectionInstance?.dimred
      const screenPositions = new Map<string, { x: number; y: number }>()

      if (dimredInstance) {
        dimredInstance.pixiDimredPoints.forEach((point, id) => {
          screenPositions.set(id, { x: point.x, y: point.y })
        })
      }

      for (const [clusterId, pointIds] of Object.entries(clusterResults)) {
        const clusterPoints = projection
          .filter((point) => pointIds.includes(point.id))
          .map((point) => {
            const screenPos = screenPositions.get(point.id)
            if (screenPos) {
              return {
                ...point,
                pos: screenPos, // Use the current screen position
              }
            }
            return point
          })
        if (clusterPoints.length === 0) continue

        fingerprintStore.setSelection(clusterPoints)

        const clusterName = `Cluster ${Number(clusterId) + 1}`

        fingerprintStore.addFingerprint(clusterName)
      }

      fingerprintStore.setSelection([])

      return true
    } catch (error) {
      console.error('Error performing K-means clustering:', error)
      return false
    }
  }
}

// Create singleton instance
export const projectionService = new ProjectionService()
