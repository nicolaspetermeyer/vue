<template>
  <div ref="chart"></div>
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

const chart = ref<HTMLElement | null>(null)

// Transform stats object into array of { name, value }
const chartData = computed(() =>
  Object.entries(props.stats).map(([name, stat]) => ({
    name,
    value: stat.mean,
  })),
)

function drawChart(data: { name: string; value: number }[]) {
  if (!chart.value) return
  d3.select(chart.value).selectAll('*').remove()

  const margin = { top: 10, right: 10, bottom: 10, left: 10 }
  const width = 800 - margin.left - margin.right
  const height = 800 - margin.top - margin.bottom
  const innerRadius = 150
  const outerRadius = Math.min(width, height) / 2

  const svg = d3
    .select(chart.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2 + 100})`)

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
