<template>
  <tr>
    <td class="border border-gray-300 p-2">{{ data.perspective }}</td>
    <td class="border border-gray-300 p-2">{{ data.objective }}</td>
    <td class="border border-gray-300 p-2">{{ data.kpi }}</td>
    <td class="border border-gray-300 p-2 text-center">{{ data.target24 }}</td>
    <td class="border border-gray-300 p-2 text-center">{{ data.targetQ1 }}</td>
    <td class="border border-gray-300 p-2 text-center">{{ data.weightage }}</td>
    <td class="border border-gray-300 p-2 text-center">{{ data.achievement }}</td>
    <td class="border border-gray-300 p-2 text-center">{{ data.overallAchv }}</td>
    <td class="border border-gray-300 p-2 text-center">{{ data.score }}</td>
    <td class="border border-gray-300 p-2 text-center">
      <span :class="getTrendClass(data.trend)">
        <Icon v-if="data.trend === 'up'" icon="ic:round-arrow-upward" />
        <Icon v-if="data.trend === 'down'" icon="ic:round-arrow-downward" />
        <Icon v-if="data.trend === 'yearly'" icon="ic:baseline-calendar-today" />
      </span>
    </td>
  </tr>
</template>

<script setup>
import { Icon } from "@iconify/vue";

defineProps({
  data: {
    type: Object,
    required: true,
  },
});

function getTrendClass(trend) {
  if (trend === "up") return "text-green-500"; // Trend up: green
  if (trend === "down") return "text-red-500"; // Trend down: red
  if (trend === "yearly") return "text-blue-500"; // Yearly: blue
  return "";
}
</script>

<style scoped>
/* Optional: Add custom styles here if needed */
</style>
