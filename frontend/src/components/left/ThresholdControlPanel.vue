<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePointFilterStore } from '@/stores/pointFilterStore'

const pointFilterStore = usePointFilterStore()
const { thresholdPercentile, selectTopPercentile } = storeToRefs(pointFilterStore)

const sliderStyles = computed(() => {
  const percent = thresholdPercentile.value * 100

  if (selectTopPercentile.value) {
    return {
      background: `linear-gradient(to right, 
                  #e5e7eb 0%, 
                  #e5e7eb ${percent}%, 
                  #4b6bfb ${percent}%, 
                  #4b6bfb 100%)`,
    }
  } else {
    return {
      background: `linear-gradient(to right, 
                    #4b6bfb 0%, 
                    #4b6bfb ${percent}%, 
                    #e5e7eb ${percent}%, 
                    #e5e7eb 100%)`,
    }
  }
})
</script>

<template>
  <section class="section">
    <h3 class="section-title">Threshold Control</h3>

    <div class="mt-2">
      <div class="flex justify-between items-center mb-1">
        <span class="text-sm font-medium">Threshold: {{ thresholdPercentile.toFixed(2) }}</span>
      </div>
      <div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model.number="thresholdPercentile"
          class="range range-sm w-full"
          :style="sliderStyles"
        />
      </div>
      <div class="flex justify-between text-xs text-gray-500 px-1">
        <span>0</span>
        <span>0.5</span>
        <span>1</span>
      </div>
    </div>

    <div class="mt-4">
      <div class="form-control">
        <label class="label cursor-pointer justify-start gap-2">
          <input
            type="radio"
            name="percentile-type"
            class="radio radio-sm"
            :value="true"
            v-model="selectTopPercentile"
          />
          <span class="label-text">Top percentile</span>
        </label>
        <label class="label cursor-pointer justify-start gap-2">
          <input
            type="radio"
            name="percentile-type"
            class="radio radio-sm"
            :value="false"
            v-model="selectTopPercentile"
          />
          <span class="label-text">Bottom percentile</span>
        </label>
      </div>
    </div>
  </section>
</template>

<style scoped>
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4b6bfb;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4b6bfb;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

input[type='range']::-webkit-slider-runnable-track {
  background: transparent;
  border: none;
  height: 8px;
}
</style>
