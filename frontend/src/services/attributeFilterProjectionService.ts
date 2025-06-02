import { useDatasetStore } from '@/stores/datasetStore'
import { useProjectionStore } from '@/stores/projectionStore'
import { useAttributeFilterStore } from '@/stores/attributeFilterStore'
import { fetchAttributeSubset } from '@/services/api'
import { animationService } from '@/services/animationService'
import type { Projection } from '@/models/data'

export class attributeFilterProjectionService {
  /**
   * Recalculate projection with filtered attributes
   */
  async recalculateWithAttributes(attributes: string[]): Promise<boolean> {
    console.log('Recalculating projection with attributes:', attributes)
    const datasetStore = useDatasetStore()
    const projectionStore = useProjectionStore()
    const attributeFilterStore = useAttributeFilterStore()

    const dataset = datasetStore.selectedDatasetName

    if (!dataset || attributes.length === 0) {
      return false
    }

    try {
      // Preserve current positions for animation
      const currentPositions = new Map<string, { x: number; y: number }>()
      projectionStore.projection.forEach((point) => {
        currentPositions.set(point.id, { ...point.pos })
      })

      // Request recalculation with filtered attributes
      console.log(`Fetching attribute subset for ${attributes.length} attributes`)
      const result = await fetchAttributeSubset(
        dataset,
        projectionStore.projectionMethod,
        attributes,
      )

      console.log(`Received new projection with ${attributes} points`)

      if (result && result.projectionData) {
        const newProjection = result.projectionData.map((point: any) => {
          return {
            ...point,
            basePos: currentPositions.get(point.id) || point.pos,
          } as Projection
        })

        // Update stores
        projectionStore.setGlobalStats(result.globalStats)
        projectionStore.setProjection(newProjection)

        // attributeFilterStore.updateAttributeFilter(result)

        // Update attribute ring with filtered attributes
        if (projectionStore.projectionInstance) {
          if (projectionStore.projectionInstance.attributeRing) {
            console.log('Rebuilding attribute ring with new stats')
            projectionStore.projectionInstance.attributeRing.updateVisibleAttributes(
              result.globalStats,
              result.numericAttributes,
            )
          }

          // Trigger animation
          if (projectionStore.projectionInstance.dimred) {
            projectionStore.projectionInstance.dimred.updatePoints(newProjection, true)
          }
        }

        return true
      }
      return false
    } catch (error) {
      console.error('Error recalculating projection with filtered attributes:', error)
      return false
    }
  }
}

// Create a singleton instance
export const attributeProjectionService = new attributeFilterProjectionService()
