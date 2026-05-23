<template>
  <span :class="['text-xs font-semibold px-2.5 py-1 rounded-md inline-flex items-center gap-1.5', colorClass]">
    <svg v-if="label === 'flagged'" class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    </svg>
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
  if (props.label === 'flagged') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60'
  return {
    high: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
    medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
    low: 'bg-red-50 text-red-700 ring-1 ring-red-200/60',
  }[props.label]
})

const displayText = computed(() => {
  if (props.label === 'flagged') return 'Requires Human Review'
  return `${Math.round(props.score * 100)}% confidence`
})
</script>
