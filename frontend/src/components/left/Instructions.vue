<script setup lang="ts">
import { ref } from 'vue'

const isExpanded = ref(false)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <section class="section">
    <div class="flex justify-between items-center mb-2 cursor-pointer" @click="toggleExpanded">
      <div class="flex items-center">
        <h3 class="section-title">Instructions</h3>
        <span class="text-xs text-gray-500 ml-2 flex items-center" v-if="!isExpanded">
          <i class="fas fa-info-circle mr-1"></i> Click to expand
        </span>
      </div>
      <button class="btn btn-xs btn-ghost" @click.stop="toggleExpanded">
        <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
      </button>
    </div>
    <div class="instructions-container" v-if="isExpanded">
      <div class="instruction-group">
        <h4 class="instruction-title">Selection</h4>
        <ul class="instruction-list">
          <li><span class="key">Click</span> Select a single point</li>
          <li><span class="key">Drag</span> Select points with rectangle or lasso</li>
          <li><span class="key">ESC</span> Clear selection</li>
        </ul>
      </div>

      <div class="instruction-group">
        <h4 class="instruction-title">Navigation</h4>
        <ul class="instruction-list">
          <li><span class="key">Scroll</span> Zoom in/out</li>
          <li><span class="key">Ctrl+Drag</span> Pan view</li>
        </ul>
      </div>

      <div class="instruction-group">
        <h4 class="instruction-title">Attribute Ring</h4>
        <ul class="instruction-list">
          <li><span class="key">Right-Click Segment</span> Open Action Menu</li>
        </ul>
      </div>

      <div class="instruction-group">
        <h4 class="instruction-title">Subset</h4>
        <ul class="instruction-list">
          <li>
            <span class="key">Click "Create Subset"</span> Aggregate Selection or Current Filter
          </li>
          <li><span class="key">Click Glyph Symbol</span>Add Glyph of Subset to Projection</li>
          <li><span class="key">Click Glyph</span> Toggle Subset Ring Display</li>
          <li><span class="key">Right-Click Glyph</span> Recalculate DR for Subset</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding: 0.75rem;
  background: #d1d1d1;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0;
  color: #333;
}

.instructions-container {
  font-size: 0.85rem;
}

.instruction-group {
  margin-bottom: 0.75rem;
}

.instruction-title {
  font-weight: 600;
  color: #000000;
  margin-bottom: 0.25rem;
  border-bottom: 1px solid #000000;
  padding-bottom: 0.25rem;
}

.instruction-list {
  list-style-type: none;
  padding-left: 0;
}

.instruction-list li {
  padding: 0.25rem 0;
  display: flex;
  align-items: baseline;
}

.key {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  padding: 0.1rem 0.35rem;
  margin-right: 0.5rem;
  font-family: monospace;
  font-size: 0.8rem;
  color: #373a41;
  display: inline-block;
  min-width: 80px;
}
</style>
