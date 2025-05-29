import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AttributeMetadata } from '@/models/data'

export const useAttributeFilterStore = defineStore('attributeFilter', () => {
  // Attribute filter state
  const featureCount = ref<number>(0)
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

  function initAttributeMetadata(
    numericAttributes: string[],
    metadata?: {
      attributeMetadata?: Record<string, AttributeMetadata>
      attributes?: string[]
      categoryList?: string[]
    },
  ) {
    featureCount.value = numericAttributes.length
    allNumericAttributes.value = numericAttributes || []
    filteredAttributes.value = [...allNumericAttributes.value]

    if (metadata) {
      attributeMetadata.value = metadata.attributeMetadata || {}
      metadataAttributes.value = metadata.attributes || []
      metadataCategories.value = metadata.categoryList || []
    } else {
      attributeMetadata.value = {}
      metadataAttributes.value = []
      metadataCategories.value = []
    }

    attributeFilterActive.value = false
    attributeMetadataFilter.value = {
      category: null,
      value: null,
    }
  }

  function filterAttributesByMetadata(
    category: string,
    value: string,
    updateCallback?: (attributes: string[]) => void,
  ) {
    if (!category || !value || !hasMetadata.value) {
      clearAttributeFilter(updateCallback)
      return
    }

    attributeMetadataFilter.value = { category, value }

    // Filter attributes that have this category-value pair in their metadata
    filteredAttributes.value = allNumericAttributes.value.filter((attribute) => {
      if (!attributeMetadata.value[attribute]) return false

      const categoryValue = attributeMetadata.value[attribute].categories[category]
      return categoryValue === value
    })

    attributeFilterActive.value = true

    // Signal that the attribute ring should update
    if (updateCallback) {
      updateCallback(filteredAttributes.value)
    }
  }

  function clearAttributeFilter(updateCallback?: (attributes: string[]) => void) {
    attributeMetadataFilter.value = {
      category: null,
      value: null,
    }

    filteredAttributes.value = [...allNumericAttributes.value]
    attributeFilterActive.value = false

    // Signal that the attribute ring should update to show all attributes
    if (updateCallback) {
      updateCallback(allNumericAttributes.value)
    }
  }

  function clearAll() {
    featureCount.value = 0
    allNumericAttributes.value = []
    filteredAttributes.value = []
    attributeFilterActive.value = false
    attributeMetadata.value = {}
    metadataAttributes.value = []
    metadataCategories.value = []
    attributeMetadataFilter.value = {
      category: null,
      value: null,
    }
  }

  return {
    featureCount,
    allNumericAttributes,
    activeAttributes,
    filteredAttributes,
    attributeFilterActive,
    attributeMetadataFilter,
    attributeMetadata,
    metadataAttributes,
    metadataCategories,
    hasMetadata,

    initAttributeMetadata,
    filterAttributesByMetadata,
    clearAttributeFilter,
    clearAll,
  }
})
