import type { Projection } from '@/models/data'
import { fetchSubsetProjection } from './api'
import { useDatasetStore } from '@/stores/datasetStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { useDrillDownStore } from '@/stores/drillDownStore'
import { animationService } from './animationService'

export class DrillDownService {
  /**
   * Drill down to a subset defined by a fingerprint
   */
  async drillDownToFingerprint(fingerprintId: string): Promise<boolean | null> {
    const datasetStore = useDatasetStore()
    const fingerprintStore = useFingerprintStore()
    const drillDownStore = useDrillDownStore()
    const projectionStore = useProjectionStore()
    const dataset = datasetStore.selectedDatasetName
    if (!dataset) {
      return null
    }

    const fingerprint = fingerprintStore.getFingerprintById(fingerprintId)
    if (!fingerprint) return false

    drillDownStore.setLoading(true)

    try {
      // Save current positions for history and transitions
      const currentPositions = new Map<string, { x: number; y: number }>()
      projectionStore.projection.forEach((point) => {
        currentPositions.set(point.id, { ...point.pos })
      })

      const pointIds = fingerprint.projectedPoints.map((p) => p.id)

      // Fetch new positions from the backend
      const subsetResult = await fetchSubsetProjection(
        dataset,
        projectionStore.projectionMethod,
        pointIds,
      )

      if (!subsetResult || !subsetResult.positionMapping) {
        throw new Error('Failed to fetch subset projection')
      }

      // Save current state to history
      drillDownStore.saveProjectionState({
        projection: [...projectionStore.projection],
        stats: { ...projectionStore.globalStats },
        parentId: drillDownStore.currentParentId,
        originalPositions: currentPositions,
      })

      drillDownStore.setOriginalPositions(new Map(currentPositions))

      const updatedProjection = projectionStore.projection
        .filter((point) => pointIds.includes(point.id))
        .map((point) => {
          const currentPos = { ...point.pos }
          if (point.id in subsetResult.positionMapping) {
            return {
              ...point,
              basePos: currentPos,
              pos: { ...subsetResult.positionMapping[point.id] },
            }
          }
          return point
        })

      // Update current state
      drillDownStore.setParentId(fingerprintId)
      projectionStore.setProjection(updatedProjection)

      if (projectionStore.projectionInstance?.dimred) {
        projectionStore.projectionInstance.dimred.updatePoints(updatedProjection, true)
      }

      return true
    } catch (error) {
      console.error('Error drilling down to fingerprint:', error)
      return false
    } finally {
      drillDownStore.setLoading(false)
    }
  }

  /**
   * Go back to previous projection state
   */
  goBackToPreviousProjection(): boolean {
    const drillDownStore = useDrillDownStore()
    const projectionStore = useProjectionStore()
    const fingerprintStore = useFingerprintStore()

    if (!drillDownStore.canGoBack) {
      return false
    }

    const previousState = drillDownStore.popHistoryState()
    if (!previousState) return false

    const currentPositions = new Map<string, { x: number; y: number }>()
    projectionStore.projection.forEach((point) => {
      currentPositions.set(point.id, { ...point.pos })
    })
    // Restore projection with original positions
    const restoredProjection = previousState.projection.map((point) => {
      if (previousState.originalPositions && previousState.originalPositions.has(point.id)) {
        const originalPos = previousState.originalPositions.get(point.id)!
        return {
          ...point,
          basePos: currentPositions.has(point.id) ? currentPositions.get(point.id)! : point.pos,
          pos: { ...previousState.originalPositions.get(point.id)! },
        }
      }
      return point
    })

    // Update stores
    projectionStore.setProjection(restoredProjection)
    // Start animation
    animationService.startTransition()

    if (previousState.stats) {
      projectionStore.setGlobalStats({ ...previousState.stats })
    }

    drillDownStore.setParentId(previousState.parentId)

    if (previousState.originalPositions) {
      drillDownStore.setOriginalPositions(previousState.originalPositions)
    }

    fingerprintStore.selectedFingerprints = []

    return true
  }

  /**
   * Get transition projection for animation
   * @param progress Transition progress (0-1)
   */
  getTransitionProgress(progress: number): Projection[] {
    const projectionStore = useProjectionStore()

    if (projectionStore.projection.length === 0) return []

    return projectionStore.projection.map((point) => {
      if ('basePos' in point && point.basePos) {
        const basePos = point.basePos as { x: number; y: number }

        return {
          ...point,
          pos: {
            x: basePos.x + (point.pos.x - basePos.x) * progress,
            y: basePos.y + (point.pos.y - basePos.y) * progress,
          },
        }
      }
      return point
    })
  }
}

// Create a singleton instance
export const drillDownService = new DrillDownService()
