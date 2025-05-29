import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Projection, FeatureRanking, AttributeStats, AttributeMetadata } from '@/models/data'
import { useDatasetStore } from '@/stores/datasetStore'
import { fetchProjection, fetchFeatureRanking } from '@/services/api'
import { PixiProjection } from '@/pixi/PixiProjection'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { usePointFilterStore } from '@/stores/pointFilterStore'
import { useAttributeFilterStore } from './attributeFilterStore'

export const useProjectionStore = defineStore('projection', () => {
  const datasetStore = useDatasetStore()

  // State
  const unfilteredProjection = ref<Projection[]>([])
  const projection = ref<Projection[]>([])
  const globalStats = ref<Record<string, AttributeStats>>({})

  const projectionInstance = ref<PixiProjection | null>(null) // Holds PixiProjection instance
  const projectionMethod = ref<'pca' | 'tsne'>('pca')
  const projectionHistory = ref<
    { projection: Projection[]; stats: Record<string, AttributeStats>; parentId?: string }[]
  >([])
  const currentParentId = ref<string | undefined>(undefined)
  const canGoBack = computed(() => projectionHistory.value.length > 0)

  const featureRanking = ref<FeatureRanking[]>([])
  const neighborhoodRadius = ref<number>(0.1)

  const isLoading = ref<boolean>(false)

  async function loadProjection() {
    const dataset = datasetStore.selectedDatasetName

    if (!dataset) {
      return null
    }

    // Prevent concurrent loads
    if (isLoading.value) {
      console.warn('Projection loading already in progress')
      return
    }

    isLoading.value = true

    try {
      const result = await fetchProjection(dataset, projectionMethod.value)

      globalStats.value = result.globalStats
      unfilteredProjection.value = result.projectionData
      projection.value = result.projectionData

      usePointFilterStore().initAvailablePointFilters(
        result.nonNumericAttributes,
        result.categoryValues || {},
      )

      useAttributeFilterStore().initAttributeMetadata(
        result.numericAttributes,
        result.attributeMetadata,
      )

      currentParentId.value = undefined
      projectionHistory.value = []

      useFingerprintStore().selectedFingerprints = []

      // await loadFeatureRanking()
    } catch {
      return null
    } finally {
      isLoading.value = false
    }
  }

  function setProjectionInstance(instance: PixiProjection) {
    projectionInstance.value = instance
  }

  function setProjection(newProjection: Projection[]) {
    projection.value = newProjection
  }

  function setGlobalStats(newGlobalStats: Record<string, AttributeStats>) {
    globalStats.value = newGlobalStats
  }

  function clearAllProjectionData() {
    console.log('Clearing all projection data')
    projection.value = []
    featureRanking.value = []
    currentParentId.value = undefined
    projectionHistory.value = []
    useAttributeFilterStore().clearAll()

    useFingerprintStore().clearFingerprints()
  }

  async function loadFeatureRanking() {
    const dataset = useDatasetStore().selectedDatasetName
    if (!dataset) {
      return null
    }

    try {
      featureRanking.value = await fetchFeatureRanking(
        dataset,
        projectionMethod.value,
        neighborhoodRadius.value,
      )
    } catch (error) {
      console.error('Failed to load feature ranking:', error)
    }
  }

  // Helper function to get feature ranking for a specific point
  function getFeatureRankingForPoint(pointId: string): FeatureRanking | undefined {
    return featureRanking.value.find((ranking) => ranking.id === pointId)
  }

  // Helper function to get top N features for a specific point
  // function getTopFeaturesForPoint(
  //   pointId: string,
  //   topN: number = 3,
  // ): { name: string; score: number }[] {
  //   const ranking = getFeatureRankingForPoint(pointId)
  //   if (!ranking) return []

  //   return ranking.features.slice(0, topN).map((feature, index) => ({
  //     name: feature,
  //     score: ranking.scores[index],
  //   }))
  // }

  // Update neighborhood radius and reload feature ranking
  async function updateNeighborhoodRadius(radius: number) {
    neighborhoodRadius.value = radius
    await loadFeatureRanking()
  }

  function clearProjectionInstance() {
    if (projectionInstance.value) {
      projectionInstance.value = null
    }
  }

  function drillDownToProjection(newProjection: Projection[], parentId?: string) {
    if (projection.value.length > 0) {
      projectionHistory.value.push({
        projection: [...projection.value],
        stats: { ...globalStats.value },
        parentId: currentParentId.value,
      })
    }

    currentParentId.value = parentId
    projection.value = newProjection
  }

  /**
   * Go back to previous projection
   */
  function goBackToPreviousProjection(): boolean {
    if (projectionHistory.value.length === 0) {
      return false
    }

    const previousProjection = projectionHistory.value.pop()
    if (previousProjection) {
      projection.value = previousProjection.projection
      globalStats.value = previousProjection.stats
      currentParentId.value = previousProjection.parentId

      const fingerprintStore = useFingerprintStore()
      fingerprintStore.selectedFingerprints = []

      return true
    }

    return false
  }

  function resetToBaseProjection() {
    projectionHistory.value = []
    currentParentId.value = undefined
    if (unfilteredProjection.value.length > 0) {
      projection.value = [...unfilteredProjection.value]
    }
    useFingerprintStore().selectedFingerprints = []
  }

  /**
   * Check if the current view is a drilled-down view
   */
  const isDrilledDownView = computed(() => {
    return currentParentId.value !== undefined
  })

  /**
   * Get the current view's level (0 for base, >0 for drilled down)
   */
  const currentViewLevel = computed(() => {
    return projectionHistory.value.length
  })

  return {
    projection,
    projectionInstance,
    projectionMethod,
    globalStats,

    featureRanking,
    neighborhoodRadius,
    projectionHistory,
    canGoBack,
    currentParentId,
    isDrilledDownView,
    currentViewLevel,

    resetToBaseProjection,
    loadProjection,
    loadFeatureRanking,

    getFeatureRankingForPoint,
    // getTopFeaturesForPoint,
    updateNeighborhoodRadius,
    setProjectionInstance,
    setProjection,
    setGlobalStats,

    clearProjectionInstance,
    clearAllProjectionData,
    drillDownToProjection,
    goBackToPreviousProjection,
  }
})
