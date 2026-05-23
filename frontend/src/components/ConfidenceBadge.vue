<template>
  <span :class="['inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', colorClass]">
    <span v-if="label === 'flagged'">⚠</span>
    {{ displayText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number
  label: 'high' | 'medium' | 'low' | 'flagged'
}>()

const colorClass = computed(() => {
  if (props.label === 'flagged') return 'bg-amber-100 text-amber-800'
  return {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-red-100 text-red-800',
  }[props.label]
})

const displayText = computed(() => {
  if (props.label === 'flagged') return 'Requires Human Review'
  return `${Math.round(props.score * 100)}% confidence`
})
</script>
