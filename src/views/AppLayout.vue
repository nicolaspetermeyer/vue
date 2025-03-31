<script setup lang="ts">
import LeftSidebar from '@/components/LeftSidebar.vue'
import MainCanvasView from '@/components/MainCanvasView.vue'
import RightPanel from '@/components/RightPanel.vue'
</script>

<template>
  <div class="layout">
    <div class="left">
      <LeftSidebar />
    </div>
    <div class="center">
      <MainCanvasView />
    </div>
    <div class="right">
      <RightPanel />
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.left {
  width: 280px;
  flex-shrink: 0;
  background-color: #2e2d2d;
  border-right: 1px solid #ddd;
  overflow-y: auto;
}

.center {
  flex-grow: 1;
  background-color: #f9f9f9;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.right {
  width: 320px;
  flex-shrink: 0;
  background-color: #2e2d2d;
  border-left: 1px solid #ddd;
  overflow-y: auto;
}
</style>
