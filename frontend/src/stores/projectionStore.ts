import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ProjectionRow, Point, Projection, FeatureRanking } from '@/models/data'
import { matchProjection } from '@/utils/matchProjection'
import { useDataStore } from '@/stores/dataStore'
import { useDatasetStore } from '@/stores/datasetStore'
import { fetchProjection, fetchFeatureRanking } from '@/services/api'
import { PixiProjection } from '@/pixi/PixiProjection'
import { useFingerprintStore } from '@/stores/fingerprintStore'

export const useProjectionStore = defineStore('projection', () => {
  const datasetStore = useDatasetStore()
  const dataStore = useDataStore()

  // State
  const rawProjection = ref<ProjectionRow[]>([])
  const projectionMatch = ref<Projection[]>([])
  const matchedPoints = ref<Point[]>([])
  const projectionInstance = ref<PixiProjection | null>(null) // Holds PixiProjection instance
  const projectionMethod = ref<'pca' | 'tsne'>('pca')
  const featureRanking = ref<FeatureRanking[]>([])
  const neighborhoodRadius = ref<number>(0.1)

  // Keep track of the current dataset for validation
  const currentDatasetId = ref<string | null>(null)
  const isLoading = ref<boolean>(false)

  async function loadProjection(forceReload = false) {
    const dataset = datasetStore.selectedDatasetName

    if (!dataset) {
      clearAllProjectionData()
      return null
    }

    // Safety: Check if we need to reload raw data
    if (dataStore.rawData.length === 0 || currentDatasetId.value !== dataset || forceReload) {
      clearAllProjectionData()
      await dataStore.loadData()
      currentDatasetId.value = dataset
    }

    // Prevent concurrent loads
    if (isLoading.value) {
      console.warn('Projection loading already in progress')
      return
    }

    isLoading.value = true

    try {
      rawProjection.value = await fetchProjection(dataset, projectionMethod.value)

      const matchResult = await matchProjection(dataStore.rawData, rawProjection.value)

      projectionMatch.value = matchResult.map((point) => ({
        ...point,
        nonNumericAttributes: dataStore.nonNumericAttributes,
      }))

      mapToPoint(rawProjection.value)
      // await loadFeatureRanking()
    } catch {
      return null
    } finally {
      isLoading.value = false
    }
  }

  function clearAllProjectionData() {
    rawProjection.value = []
    projectionMatch.value = []
    matchedPoints.value = []
    featureRanking.value = []
    clearProjectionInstance()
    useFingerprintStore().fingerprints = []
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
  function getTopFeaturesForPoint(
    pointId: string,
    topN: number = 3,
  ): { name: string; score: number }[] {
    const ranking = getFeatureRankingForPoint(pointId)
    if (!ranking) return []

    return ranking.features.slice(0, topN).map((feature, index) => ({
      name: feature,
      score: ranking.scores[index],
    }))
  }

  // Update neighborhood radius and reload feature ranking
  async function updateNeighborhoodRadius(radius: number) {
    neighborhoodRadius.value = radius
    await loadFeatureRanking()
  }

  function mapToPoint(rows: ProjectionRow[]) {
    matchedPoints.value = rows.map((row) => ({
      item_id: row.id,
      pos: { x: row.x, y: row.y },
    }))
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
    rawProjection,
    projectionMatch,
    matchedPoints,
    projectionInstance,
    projectionMethod,
    featureRanking,
    neighborhoodRadius,
    loadProjection,
    loadFeatureRanking,
    getFeatureRankingForPoint,
    getTopFeaturesForPoint,
    updateNeighborhoodRadius,
    mapToPoint,
    setProjectionInstance,
    clearProjectionInstance,
    clearAllProjectionData,
  }
})
