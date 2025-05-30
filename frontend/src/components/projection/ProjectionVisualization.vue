<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted } from 'vue'
import { useProjectionStore } from '@/stores/projectionStore'
import { useDrillDownStore } from '@/stores/drillDownStore'
import { animationService } from '@/services/animationService'
import { drillDownService } from '@/services/drillDownService'

const projectionStore = useProjectionStore()
const drillDownStore = useDrillDownStore()
const canvasContainer = ref<HTMLDivElement | null>(null)
const isTransitioning = ref(false)
const transitionProgress = ref(0)

onMounted(() => {
  watch(
    () => animationService.progress.value,
    (newProgress) => {
      transitionProgress.value = newProgress
    },
  )

  watch(
    () => animationService.isAnimating.value,
    (isAnimating) => {
      isTransitioning.value = isAnimating
    },
  )
})

onUnmounted(() => {
  animationService.stopAnimation()
})
</script>
