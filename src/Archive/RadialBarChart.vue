<template>
  <div ref="chartContainer" class="radial-chart-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import * as d3 from 'd3'

interface FeatureStats {
  mean: number
  std: number
  min: number
  max: number
}

const props = defineProps<{
  stats: Record<string, FeatureStats>
}>()

const chartContainer = ref<HTMLElement | null>(null)

// Transform stats object into array of { name, value }
const chartData = computed(() =>
  Object.entries(props.stats).map(([name, stat]) => ({
    name,
    value: stat.mean,
  })),
)

function drawChart(data: { name: string; value: number }[]) {
  if (!chartContainer.value) return
  const container = chartContainer.value

  // Clear previous SVG
  d3.select(container).selectAll('*').remove()

  const width = container.clientWidth
  const height = container.clientHeight
  const innerRadius = Math.min(width, height) / 4
  const outerRadius = Math.min(width, height) / 2.5

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`)

  const x = d3
    .scaleBand()
    .range([0, 2 * Math.PI])
    .align(0)
    .domain(data.map((d) => d.name))

  const maxValue = d3.max(data, (d) => d.value) ?? 1

  const y = d3.scaleRadial().range([innerRadius, outerRadius]).domain([0, maxValue])

  const arc = d3
    .arc<{ name: string; value: number }>()
    .innerRadius(innerRadius)
    .outerRadius((d) => y(d.value))
    .startAngle((d) => x(d.name)!)
    .endAngle((d) => x(d.name)! + x.bandwidth())
    .padAngle(0.01)
    .padRadius(innerRadius)

  svg
    .append('g')
    .selectAll('path')
    .data(data)
    .enter()
    .append('path')
    .attr('fill', '#69b3a2')
    .attr('d', arc)
}

onMounted(() => {
  drawChart(chartData.value)
})

watch(chartData, (newData) => {
  drawChart(newData)
})
</script>

<style scoped>
.bar {
  fill: steelblue;
}
</style>
