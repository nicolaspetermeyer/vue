<script setup lang="ts">
import FingerprintList from '@/components/right/FingerprintList.vue'
import FingerprintSection from '@/components/right/FingerprintSection.vue'
</script>

<template>
  <div class="sidebar">
    <h2 class="text-xl font-bold mb-2">Fingerprint Explorer</h2>

    <FingerprintSection />
    <FingerprintList />
  </div>
</template>

<style scoped>
.sidebar {
  padding: 1rem;
  background: #ffffff;
  height: 100%;
  overflow-y: auto;
}

.panel {
  padding: 0.75rem;
  background: #d1d1d1;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.fingerprint-list li.selected {
  background-color: #d1e3ff;
  font-weight: bold;
}

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
  margin-bottom: 0.5rem;
  color: #333;
}
</style>
