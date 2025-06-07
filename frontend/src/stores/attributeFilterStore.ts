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
  const uniqueValues = ref<Record<string, string[]>>({})
  const hasMetadata = computed(() => metadataAttributes.value.length > 0)
  const removedAttributes = ref<string[]>([])

  const isRecalculating = ref<boolean>(false)

  // metadata filter state
  const attributeMetadataFilter = ref<{
    category: string | null
    value: string | null
  }>({
    category: null,
    value: null,
  })

  const activeAttributes = computed(() => {
    let result = []

    if (attributeFilterActive.value) {
      result = [...filteredAttributes.value]
    } else {
      result = [...allNumericAttributes.value]
    }

    return result.filter((attr) => !removedAttributes.value.includes(attr))
  })

  function setRecalculating(value: boolean) {
    isRecalculating.value = value
  }

  function initAttributeMetadata(
    attributes: string[],
    metadata?: {
      attributeMetadata?: Record<string, AttributeMetadata>
      attributes?: string[]
      categoryList?: string[]
      categoryUniqueValues?: Record<string, string[]>
    },
  ) {
    allNumericAttributes.value = [...attributes]
    filteredAttributes.value = [...attributes]
    featureCount.value = attributes.length
    attributeFilterActive.value = false

    if (metadata) {
      attributeMetadata.value = metadata.attributeMetadata || {}
      metadataAttributes.value = metadata.attributes || []
      metadataCategories.value = metadata.categoryList || []
      uniqueValues.value = metadata.categoryUniqueValues || {}
    } else {
      attributeMetadata.value = {}
      metadataAttributes.value = []
      metadataCategories.value = []
      uniqueValues.value = {}
    }
  }

  function updateAttributeFilter(category: string, value: string) {
    if (!category || !value || !hasMetadata.value) {
      clearAttributeFilter()
      return
    }

    attributeMetadataFilter.value = { category, value }

    // Filter attributes with the selected metadata
    filteredAttributes.value = allNumericAttributes.value.filter((attribute) => {
      if (!attributeMetadata.value[attribute]) return false

      const categoryValue = attributeMetadata.value[attribute].categories[category]
      return categoryValue === value
    })

    attributeFilterActive.value = true
  }

  function clearAttributeFilter() {
    attributeMetadataFilter.value = {
      category: null,
      value: null,
    }

    filteredAttributes.value = [...allNumericAttributes.value]
    attributeFilterActive.value = false
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

  function removeAttribute(attributeKey: string) {
    if (!allNumericAttributes.value.includes(attributeKey)) {
      return false
    }

    if (!removedAttributes.value.includes(attributeKey)) {
      removedAttributes.value.push(attributeKey)
    }

    return true
  }

  function restoreAttribute(attributeKey: string) {
    if (!removedAttributes.value.includes(attributeKey)) {
      return false
    }
    removedAttributes.value = removedAttributes.value.filter((attr) => attr !== attributeKey)
    return true
  }

  function restoreAllAttributes() {
    removedAttributes.value = []
    return true
  }

  function setActiveAttributes(attributes: string[]) {
    const newRemovedAttributes = allNumericAttributes.value.filter(
      (attr) => !attributes.includes(attr),
    )
    removedAttributes.value = newRemovedAttributes

    if (attributeFilterActive.value) {
      filteredAttributes.value = attributes
    }

    return true
  }

  return {
    featureCount,
    allNumericAttributes,
    uniqueValues,
    activeAttributes,
    filteredAttributes,
    attributeFilterActive,
    attributeMetadataFilter,
    isRecalculating,
    attributeMetadata,
    metadataAttributes,
    metadataCategories,
    hasMetadata,
    removedAttributes,
    setRecalculating,
    initAttributeMetadata,
    updateAttributeFilter,
    clearAttributeFilter,
    clearAll,
    removeAttribute,
    restoreAttribute,
    restoreAllAttributes,
    setActiveAttributes,
  }
})
