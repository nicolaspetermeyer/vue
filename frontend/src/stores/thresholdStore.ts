import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThresholdStore = defineStore('threshold', () => {
  const thresholdPercentile = ref(0.75)
  const selectTopPercentile = ref(true)

  function setThresholdPercentile(value: number) {
    thresholdPercentile.value = Math.max(0, Math.min(1, value))
  }

  function setSelectTopPercentile(value: boolean) {
    selectTopPercentile.value = value
  }

  return {
    thresholdPercentile,
    selectTopPercentile,
    setThresholdPercentile,
    setSelectTopPercentile,
  }
})
