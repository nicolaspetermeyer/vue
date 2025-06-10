<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps({
  show: Boolean,
})

const emit = defineEmits(['close'])

const activeTab = ref('pca')
const debugMessage = ref('Modal initialized')

onMounted(() => {
  debugMessage.value = 'Component mounted'
})

const setActiveTab = (tab: string) => {
  activeTab.value = tab
  debugMessage.value = `Tab changed to: ${tab}`
}

const closeModal = () => {
  emit('close')
}
</script>

<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h2>Dimensionality Reduction Methods</h2>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <!-- Tab navigation -->
      <div class="tabs">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'pca' }"
          @click="setActiveTab('pca')"
        >
          PCA
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'tsne' }"
          @click="setActiveTab('tsne')"
        >
          t-SNE
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'umap' }"
          @click="setActiveTab('umap')"
        >
          UMAP
        </button>
      </div>

      <!-- Tab content -->
      <div class="tab-content">
        <div v-show="activeTab === 'pca'" class="tab-pane">
          <p>
            PCA is a linear dimensionality reduction technique that identifies directions (principal
            components) along which the data varies the most. It works by transforming the data into
            a new coordinate system.
          </p>
          <h4>Key Characteristics:</h4>
          <ul>
            <li>
              <strong>Linear:</strong> Preserves global structure but may miss non-linear
              relationships
            </li>
            <li>
              <strong>Deterministic:</strong> Always produces the same result for the same data
            </li>
            <li><strong>Fast:</strong> Efficient for high-dimensional data</li>
          </ul>
          <h4>Best Used When:</h4>
          <ul>
            <li>You need a quick overview of the data structure</li>
            <li>Data has a linear structure</li>
            <li>You want to reduce noise</li>
          </ul>
        </div>

        <div v-show="activeTab === 'tsne'" class="tab-pane">
          <p>
            t-SNE is a non-linear dimensionality reduction algorithm that excels at uncovering local
            clusters within the data.
          </p>
          <h4>Key Characteristics:</h4>
          <ul>
            <li><strong>Non-linear:</strong> Captures complex relationships in the data</li>
            <li><strong>Stochastic:</strong> Results can vary between runs</li>
            <li>
              <strong>Preserves local structure:</strong> Similar objects are mapped close together
            </li>
            <li>
              <strong>Perplexity parameter:</strong> Controls the balance between preserving local
              and global structure
            </li>
          </ul>
          <h4>Best Used When:</h4>
          <ul>
            <li>You need to visualize clusters in high-dimensional data</li>
            <li>Local relationships between points are important</li>
            <li>Data has complex, non-linear structure</li>
            <li>You want to explore patterns in the data</li>
          </ul>
          <h4>Note:</h4>
          <p>
            Higher perplexity values consider more distant neighbors, revealing more global
            structure. Lower values focus on very local relationships.
          </p>
        </div>

        <div v-show="activeTab === 'umap'" class="tab-pane">
          <p>
            UMAP works similary to t-SNE, but preserves more global strucutres. UMAP is faster and
            often produces more visually appealing and meaningful visualizations than t-SNE.
          </p>
          <h4>Key Characteristics:</h4>
          <ul>
            <li><strong>Non-linear:</strong> Captures complex relationships in the data</li>
            <li>
              <strong>Preserves both local and global structure:</strong> Better than t-SNE at
              maintaining global relationships
            </li>
            <li>
              <strong>Faster:</strong> More efficient than t-SNE, especially for larger datasets
            </li>
            <li>
              <strong>Two key parameters:</strong> n_neighbors and min_dist control the embedding
            </li>
          </ul>
          <h4>Best Used When:</h4>
          <ul>
            <li>You need both local and global structure preservation</li>
            <li>Performance is important (large datasets)</li>
            <li>You want clear separation between clusters</li>
            <li>You need to work with very high-dimensional data</li>
          </ul>
          <h4>Parameters:</h4>
          <p>
            <strong>n_neighbors:</strong> Higher values (50-100) preserve more global structure,
            lower values (5-15) focus on local structure.<br />
            <strong>min_dist:</strong> Lower values create tighter clusters, higher values spread
            points out more.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 700px;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.debug-info {
  padding: 8px;
  background: #f0f0f0;
  font-size: 12px;
  font-family: monospace;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 500;
  cursor: pointer;
}

.tab-button.active {
  color: #422ad5;
  border-bottom: 3px solid #422ad5;
}

.tab-content {
  padding: 16px;
  display: block;
}

.error-message {
  color: #ff0000;
  font-style: italic;
}

h3 {
  margin-top: 0;
  margin-bottom: 16px;
}

h4 {
  margin-top: 16px;
  margin-bottom: 8px;
}

ul {
  padding-left: 24px;
}

li {
  margin-bottom: 4px;
}
</style>
