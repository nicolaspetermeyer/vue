<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  show: boolean
  x: number
  y: number
  options: { label: string; action: () => void }[]
}>()

const emit = defineEmits<{
  close: []
}>()

const menuRef = ref<HTMLDivElement | null>(null)

const handleClick = (action: () => void, event: MouseEvent) => {
  event.stopPropagation()
  event.preventDefault()
  action()
  emit('close')
}

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div v-if="show" ref="menuRef" class="context-menu" :style="{ left: `${x}px`, top: `${y}px` }">
    <div
      v-for="(option, index) in options"
      :key="index"
      class="context-menu-item"
      @click="(event) => handleClick(option.action, event)"
    >
      {{ option.label }}
    </div>
  </div>
</template>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  min-width: 150px;
}

.context-menu-item {
  padding: 8px 12px;
  cursor: pointer;
}

.context-menu-item:hover {
  background-color: #f0f0f0;
}
</style>
