<template>
  <div ref="chart"></div>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'BarChart',
  props: {
    data: {
      type: Array,
      required: true,
    },
  },
  mounted() {
    this.createChart()
  },
  methods: {
    createChart() {
      const data = this.data
      const margin = { top: 20, right: 30, bottom: 40, left: 40 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom
      const svg = d3
        .select(this.$refs.chart)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
      const x = d3
        .scaleBand()
        .domain(data.map((d) => d.name))
        .range([0, width])
        .padding(0.1)
      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value)])
        .nice()
        .range([height, 0])
      svg
        .append('g')
        .selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d) => x(d.name))
        .attr('y', (d) => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', (d) => height - y(d.value))
        .attr('fill', 'steelblue')
      svg
        .append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
      svg.append('g').attr('class', 'y-axis').call(d3.axisLeft(y))
    },
  },
}
</script>
<style scoped>
.bar {
  fill: steelblue;
}
.x-axis path,
.x-axis line,
.y-axis path,
.y-axis line {
  shape-rendering: crispEdges;
}
.x-axis text,
.y-axis text {
  font-size: 12px;
}
</style>
