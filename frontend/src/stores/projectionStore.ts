import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Projection, FeatureRanking, AttributeStats, AttributeMetadata } from '@/models/data'
import { useDatasetStore } from '@/stores/datasetStore'
import { fetchProjection, fetchFeatureRanking } from '@/services/api'
import { PixiProjection } from '@/pixi/PixiProjection'
import { useFingerprintStore } from '@/stores/fingerprintStore'

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

  const filterCategories = ref<string[] | null>(null)
  const categoryValues = ref<Record<string, string[]>>({})
  const featureCount = ref<number>(0)

  // Attribute filter state
  const allNumericAttributes = ref<string[]>([])
  const filteredAttributes = ref<string[]>([])
  const attributeFilterActive = ref<boolean>(false)

  // metadata state
  const attributeMetadata = ref<Record<string, AttributeMetadata>>({})
  const metadataAttributes = ref<string[]>([])
  const metadataCategories = ref<string[]>([])
  const hasMetadata = computed(() => metadataAttributes.value.length > 0)

  // metadata filter state
  const attributeMetadataFilter = ref<{
    category: string | null
    value: string | null
  }>({
    category: null,
    value: null,
  })

  const activeAttributes = computed(() => {
    if (!attributeFilterActive.value) {
      return allNumericAttributes.value
    }
    return filteredAttributes.value
  })

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
      featureCount.value = result.numericAttributes.length

      if (result.attributeMetadata) {
        console.log('Received attribute metadata:', result.attributeMetadata)
        attributeMetadata.value = result.attributeMetadata.attributeMetadata || {}
        metadataAttributes.value = result.attributeMetadata.attributes || []
        metadataCategories.value = result.attributeMetadata.categoryList || []
      } else {
        attributeMetadata.value = {}
        metadataAttributes.value = []
        metadataCategories.value = []
      }

      allNumericAttributes.value = result.numericAttributes || []
      filteredAttributes.value = [...allNumericAttributes.value]

      attributeFilterActive.value = false
      attributeMetadataFilter.value = {
        category: null,
        value: null,
      }

      console.log('metadata attributes:', metadataAttributes.value)
      console.log('metadata categories:', metadataCategories.value)
      console.log('attribute metadata:', attributeMetadata.value)
      console.log('has metadata:', hasMetadata.value)

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

  function filterAttributesByMetadata(category: string, value: string) {
    if (!category || !value || !hasMetadata.value) {
      clearAttributeFilter()
      return
    }

    // Set filter criteria
    attributeMetadataFilter.value = { category, value }

    // Filter attributes that have this category-value pair in their metadata
    filteredAttributes.value = allNumericAttributes.value.filter((attribute) => {
      if (!attributeMetadata.value[attribute]) return false

      const categoryValue = attributeMetadata.value[attribute].categories[category]
      return categoryValue === value
    })

    attributeFilterActive.value = true

    // Signal that the attribute ring should update
    if (projectionInstance.value) {
      projectionInstance.value.updateAttributeRing(filteredAttributes.value)
    }
  }

  function clearAttributeFilter() {
    attributeMetadataFilter.value = {
      category: null,
      value: null,
    }

    filteredAttributes.value = [...allNumericAttributes.value]
    attributeFilterActive.value = false

    // Signal that the attribute ring should update to show all attributes
    if (projectionInstance.value) {
      projectionInstance.value.updateAttributeRing(allNumericAttributes.value)
    }
  }

  const filteredPointIds = computed(() => {
    if (!activeFilter.value.category || activeFilter.value.values.length === 0) {
      return projection.value.map((p) => p.id)
    }

    return projection.value
      .filter((point) => {
        const { category, values } = activeFilter.value
        if (!category || !point.original) return false
        const pointValue = point.original[category]
        return pointValue !== undefined && values.includes(String(pointValue))
      })
      .map((p) => p.id)
  })

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
    activeFilter.value = {
      category: null,
      values: [],
    }
    allNumericAttributes.value = []
    filteredAttributes.value = []
    attributeFilterActive.value = false

    attributeMetadataFilter.value = {
      category: null,
      value: null,
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
    filterCategories,
    featureCount,
    activeFilter,
    filteredPointIds,
    allNumericAttributes,
    activeAttributes,
    filteredAttributes,
    attributeFilterActive,
    attributeMetadataFilter,
    featureRanking,
    neighborhoodRadius,
    projectionHistory,
    canGoBack,
    currentParentId,
    isDrilledDownView,
    currentViewLevel,
    attributeMetadata,
    metadataAttributes,
    metadataCategories,
    hasMetadata,

    resetToBaseProjection,
    loadProjection,
    loadFeatureRanking,
    getCategoryValues,
    applyFilter,
    getFeatureRankingForPoint,
    // getTopFeaturesForPoint,
    updateNeighborhoodRadius,
    setProjectionInstance,
    setProjection,
    setGlobalStats,
    clearFilters,
    clearProjectionInstance,
    clearAllProjectionData,
    drillDownToProjection,
    goBackToPreviousProjection,
    filterAttributesByMetadata,
    clearAttributeFilter,
  }
})
