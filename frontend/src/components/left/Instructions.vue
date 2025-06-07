<template>
  <section class="section">
    <h3 class="section-title">Instructions</h3>
    <div class="instructions-container">
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
        <h4 class="instruction-title">Fingerprint</h4>
        <ul class="instruction-list">
          <li>
            <span class="key">Click "Create Fingerprint"</span> Create Fingerprint for current
            selection or filter
          </li>
          <li><span class="key">Click Glyph Symbol</span>Add FP to Projection</li>
          <li><span class="key">Click Glyph</span> Select Fingerprint</li>
          <li><span class="key">Right-Click Glyph</span> Recalculate DR for Fingerprint</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.instructions-container {
  font-size: 0.85rem;
}

.instruction-group {
  margin-bottom: 0.75rem;
}

.instruction-title {
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.25rem;
  border-bottom: 1px solid #edf2f7;
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
  background-color: #edf2f7;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  padding: 0.1rem 0.35rem;
  margin-right: 0.5rem;
  font-family: monospace;
  font-size: 0.8rem;
  color: #4a5568;
  display: inline-block;
  min-width: 80px;
}
</style>
