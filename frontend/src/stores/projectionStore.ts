import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Projection, FeatureRanking, FeatureStats } from '@/models/data'
import { useDatasetStore } from '@/stores/datasetStore'
import { fetchProjection, fetchFeatureRanking } from '@/services/api'
import { PixiProjection } from '@/pixi/PixiProjection'
import { useFingerprintStore } from '@/stores/fingerprintStore'

export const useProjectionStore = defineStore('projection', () => {
  const datasetStore = useDatasetStore()

  // State
  const unfilteredProjection = ref<Projection[]>([])
  const projection = ref<Projection[]>([])
  const globalStats = ref<Record<string, FeatureStats>>({})

  const projectionInstance = ref<PixiProjection | null>(null) // Holds PixiProjection instance
  const projectionMethod = ref<'pca' | 'tsne'>('pca')
  const featureRanking = ref<FeatureRanking[]>([])
  const neighborhoodRadius = ref<number>(0.1)

  const filterCategories = ref<string[] | null>(null)
  const categoryValues = ref<Record<string, string[]>>({})

  // Filtering
  const activeFilter = ref<{
    category: string | null
    values: string[]
  }>({
    category: null,
    values: [],
  })

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
      projection.value = [...unfilteredProjection.value]
      filterCategories.value = result.nonNumericAttributes
      categoryValues.value = result.categoryValues || {}

      // await loadFeatureRanking()
    } catch {
      return null
    } finally {
      isLoading.value = false
    }
  }

  function clearAllProjectionData() {
    console.log('Clearing all projection data')
    projection.value = []
    featureRanking.value = []
    activeFilter.value = {
      category: null,
      values: [],
    }

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

  function getCategoryValues(category: string): string[] {
    return categoryValues.value[category] || []
  }

  function applyFilter(category: string, values: string[]) {
    activeFilter.value = {
      category,
      values: [...values],
    }
    if (!projectionInstance.value) return

    if (values.length === 0) {
      projectionInstance.value.showAllPoints()
      return
    }

    const filteredPointIndices = projection.value
      .map((point, index) => {
        // Check if point has the category value in its original data
        if (point.original && point.original[category] !== undefined) {
          const pointValue = String(point.original[category])

          return values.includes(pointValue) ? index : -1
        }
        return -1
      })
      .filter((index) => index !== -1)

    // Apply the filter to the projection instance
    projectionInstance.value.filterPoints(filteredPointIndices)
  }

  function clearFilters() {
    activeFilter.value = {
      category: null,
      values: [],
    }

    if (projectionInstance.value) {
      projection.value = [...unfilteredProjection.value]
    }
  }

  // function drillDown() {
  //   const fingerprintStore = useFingerprintStore()
  //   const selectedFingerprints = fingerprintStore.selectedFingerprints

  //   if (selectedFingerprints.length === 0) {
  //     console.warn('No fingerprints selected for drill down')
  //     return
  //   }

  //   // Get the IDs of the selected fingerprints
  //   const selectedIds = selectedFingerprints.map((fingerprint) => fingerprint.id)

  //   // Filter the projection data based on the selected fingerprints
  //   projection.value = unfilteredProjection.value.filter((point) =>
  //     selectedIds.includes(point.id),
  //   )
  // }

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

  function setProjectionInstance(instance: PixiProjection) {
    projectionInstance.value = instance
  }

  function clearProjectionInstance() {
    if (projectionInstance.value) {
      projectionInstance.value = null
    }
  }

  return {
    projection,
    projectionInstance,
    projectionMethod,
    globalStats,
    filterCategories,
    activeFilter,
    featureRanking,
    neighborhoodRadius,
    loadProjection,
    loadFeatureRanking,
    getCategoryValues,
    applyFilter,
    getFeatureRankingForPoint,
    // getTopFeaturesForPoint,
    updateNeighborhoodRadius,
    setProjectionInstance,
    clearFilters,
    clearProjectionInstance,
    clearAllProjectionData,
  }
})
