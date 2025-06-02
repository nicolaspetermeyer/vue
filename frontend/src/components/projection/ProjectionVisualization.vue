<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted } from 'vue'
import { animationService } from '@/services/animationService'

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
