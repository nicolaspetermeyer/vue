<script setup lang="ts">
import { defineEmits, ref } from 'vue'

const glyphImage = ref('/images/glyph.JPG')

const emit = defineEmits(['close'])

const closeModal = () => {
  emit('close')
}
</script>

<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Understanding Glyph Visualization</h3>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <div class="glyph-image-container">
          <img :src="glyphImage" alt="Glyph explanation diagram" class="glyph-explanation-image" />
        </div>

        <div class="glyph-explanation">
          <h4>What do these glyphs show?</h4>
          <ul>
            <li>
              <strong>Segments between axes: </strong> Each segment represents a different variable
              in your dataset
            </li>
            <li>
              <strong>Blue area: </strong> Represents the mean values for each variable in this
              fingerprint/cluster
            </li>
            <li>
              <strong>Gray areas: </strong> Shows the standard deviation around the mean for each
              variable
            </li>
            <li><strong>Black outline: </strong> Indicates the global mean value</li>
          </ul>

          <h4>What does the standard deviation tell you?</h4>
          <ul>
            <li>
              <strong>Narrow gray area:</strong> Low variability - the values for this variable are
              consistent within the cluster
            </li>
            <li>
              <strong>Wide gray area:</strong> High variability - this variable has a large spread
              of values, suggesting potential outliers or a heterogeneous cluster
            </li>
            <li>
              <strong>Different widths around the ring:</strong> Indicates which variables have more
              or less consistency within the cluster
            </li>
          </ul>

          <h4>How to use this visualization:</h4>
          <ul>
            <li>
              Compare the shapes between different fingerprints to identify distinctive patterns
            </li>
            <li>
              Look for segments with large standard deviations (wide gray areas) to identify
              variables with high internal variability
            </li>
            <li>
              Variables where the mean differs significantly from other fingerprints may be key
              distinguishing characteristics
            </li>
            <li>
              Consistently narrow standard deviation bands suggest a well-defined, homogeneous
              cluster
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eaeaea;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
}

.glyph-images {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 1.5rem;
}

.glyph-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 1.5rem;
  max-width: 100%;
  text-align: center;
}

.glyph-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-caption {
  margin-top: 8px;
  font-size: 0.9rem;
  color: #666;
  text-align: center;
}

.glyph-explanation {
  max-width: 750px;
  margin: 0 auto;
}

.glyph-explanation h4 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.glyph-explanation ul {
  padding-left: 1.5rem;
}

.glyph-explanation li {
  margin-bottom: 0.5rem;
}

.blue-dot,
.orange-dot,
.black-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}
</style>
