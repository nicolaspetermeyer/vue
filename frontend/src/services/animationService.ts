import { ref } from 'vue'
import { drillDownService } from './drillDownService'
import type { Projection } from '@/models/data'
import { useProjectionStore } from '@/stores/projectionStore'
import { ProjectionTransformer } from '@/utils/transformers/ProjectionTransformer'

class AnimationService {
  private animationFrame: number | null = null
  private startTime: number = 0
  private duration: number = 800 // ms
  private pixiInstance: any = null
  private activePointSet: Projection[] = []

  // Reactive state
  public progress = ref(0)
  public isAnimating = ref(false)

  /**
   * Register the Pixi projection instance for updates
   */
  registerPixiInstance(instance: any) {
    this.pixiInstance = instance
  }

  /**
   * Start a transition animation
   */
  startTransition(duration: number = 800, normPoints: Projection[]): Promise<void> {
    this.stopAnimation() // Cancel any running animation
    this.duration = duration
    this.isAnimating.value = true
    this.progress.value = 0
    this.startTime = performance.now()

    this.activePointSet = normPoints || []

    return new Promise<void>((resolve) => {
      const animate = (timestamp: number) => {
        const elapsed = timestamp - this.startTime
        this.progress.value = Math.min(elapsed / this.duration, 1)

        // Update point positions with the new progress
        this.updatePointPositions(this.progress.value)

        if (this.progress.value < 1) {
          this.animationFrame = requestAnimationFrame(animate)
        } else {
          this.isAnimating.value = false
          this.animationFrame = null
          this.activePointSet = []
          resolve()
        }
      }

      this.animationFrame = requestAnimationFrame(animate)
    })
  }

  /**
   * Update point positions based on current animation progress
   */
  private updatePointPositions(progress: number) {
    if (!this.pixiInstance) return

    // Update each point's position
    this.activePointSet.forEach((point) => {
      if ('basePos' in point && point.basePos) {
        const basePos = point.basePos as { x: number; y: number }
        const targetPos = point.pos

        // Calculate interpolated position
        const interpolatedX = basePos.x + (targetPos.x - basePos.x) * progress
        const interpolatedY = basePos.y + (targetPos.y - basePos.y) * progress

        // Update the Pixi point's position if it exists
        const pixiPoint = this.pixiInstance.pixiDimredPoints.get(point.id)
        if (pixiPoint) {
          pixiPoint.position.set(interpolatedX, interpolatedY)
        }
      }
    })

    // Trigger a render update
    if (this.pixiInstance.app) {
      this.pixiInstance.app.render()
    }
  }

  /**
   * Stop any active animation
   */
  stopAnimation(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
    this.isAnimating.value = false
  }
}

export const animationService = new AnimationService()
