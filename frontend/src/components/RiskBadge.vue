<template>
  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colorClass]">
    {{ risk.charAt(0).toUpperCase() + risk.slice(1) }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ risk: 'critical' | 'high' | 'medium' | 'low' }>()

const colorClass = computed(() => ({
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
}[props.risk]))
</script>
