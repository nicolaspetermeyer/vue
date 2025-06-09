import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Projection, FeatureRanking, AttributeStats } from '@/models/data'
import { useDatasetStore } from '@/stores/datasetStore'
import { fetchFeatureRanking } from '@/services/api'
import { PixiProjection } from '@/pixi/PixiProjection'
import { useFingerprintStore } from '@/stores/fingerprintStore'
import { useAttributeFilterStore } from './attributeFilterStore'
import { useDrillDownStore } from './drillDownStore'

export const useProjectionStore = defineStore('projection', () => {
  // State
  const unfilteredProjection = ref<Projection[]>([])
  const projection = ref<Projection[]>([])
  const globalStats = ref<Record<string, AttributeStats>>({})

  const projectionInstance = ref<PixiProjection | null>(null) // Holds PixiProjection instance
  const projectionMethod = ref<'pca' | 'tsne' | 'umap'>('pca')
  const perplexity = ref<number>(30)
  const umapNeighbors = ref<number>(15)
  const umapMinDist = ref<number>(0.1)

  const featureRanking = ref<FeatureRanking[]>([])
  const neighborhoodRadius = ref<number>(0.1)

  const isLoading = ref<boolean>(false)

  const removedPointIds = ref<Set<string>>(new Set())
  const hasRemovedPoints = computed(() => removedPointIds.value.size > 0)

  const showPerplexityControl = computed(() => projectionMethod.value === 'tsne')
  const showUmapControls = computed(() => projectionMethod.value === 'umap')

  function setPerplexity(value: number) {
    perplexity.value = value
  }

  function setUmapNeighbors(value: number) {
    umapNeighbors.value = value
  }

  function setUmapMinDist(value: number) {
    umapMinDist.value = value
  }

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
    projection.value = []
    featureRanking.value = []
    useDrillDownStore().clearHistory()
    useAttributeFilterStore().clearAll()
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
    removedPointIds,
    hasRemovedPoints,
    perplexity,
    umapNeighbors,
    umapMinDist,
    showPerplexityControl,
    showUmapControls,

    resetToBaseProjection,
    setLoading,
    loadFeatureRanking,
    getFeatureRankingForPoint,
    // getTopFeaturesForPoint,
    updateNeighborhoodRadius,
    setProjectionInstance,
    setProjection,
    setGlobalStats,
    setPerplexity,
    setUmapNeighbors,
    setUmapMinDist,
    clearProjectionInstance,
    clearAllProjectionData,
  }
})
