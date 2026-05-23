<template>
  <span :class="['text-xs font-semibold px-2.5 py-1 rounded-md inline-flex items-center', colorClass]">
    {{ risk.charAt(0).toUpperCase() + risk.slice(1) }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ risk: 'critical' | 'high' | 'medium' | 'low' }>()

const colorClass = computed(() => ({
  critical: 'bg-red-50 text-red-700 ring-1 ring-red-200/60',
  high: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/60',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  low: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60',
}[props.risk]))
</script>
