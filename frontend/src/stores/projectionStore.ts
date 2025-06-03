import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Projection, FeatureRanking, AttributeStats } from '@/models/data'
import { useDatasetStore } from '@/stores/datasetStore'
import { fetchFeatureRanking } from '@/services/api'
import { PixiProjection } from '@/pixi/PixiProjection'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { usePointFilterStore } from '@/stores/pointFilterStore'
import { useAttributeFilterStore } from './attributeFilterStore'
import { useDrillDownStore } from './drillDownStore'

export const useProjectionStore = defineStore('projection', () => {
  // State
  const unfilteredProjection = ref<Projection[]>([])
  const projection = ref<Projection[]>([])
  const globalStats = ref<Record<string, AttributeStats>>({})

  const projectionInstance = ref<PixiProjection | null>(null) // Holds PixiProjection instance
  const projectionMethod = ref<'pca' | 'tsne'>('pca')

  const featureRanking = ref<FeatureRanking[]>([])
  const neighborhoodRadius = ref<number>(0.1)

  const isLoading = ref<boolean>(false)

  function resetToBaseProjection() {
    projection.value = unfilteredProjection.value
  }
  function setLoading(loading: boolean) {
    isLoading.value = loading
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
    useDrillDownStore().clearHistory()
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

  return {
    projection,
    unfilteredProjection,
    projectionInstance,
    projectionMethod,
    globalStats,
    isLoading,
    featureRanking,
    neighborhoodRadius,

    resetToBaseProjection,
    setLoading,
    loadFeatureRanking,
    getFeatureRankingForPoint,
    // getTopFeaturesForPoint,
    updateNeighborhoodRadius,
    setProjectionInstance,
    setProjection,
    setGlobalStats,
    clearProjectionInstance,
    clearAllProjectionData,
  }
})
