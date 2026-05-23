<template>
  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colorClass]">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: 'DRAFT' | 'ANALYSED' | 'IN_REVIEW' | 'FINALISED' }>()

const colorClass = computed(() => ({
  DRAFT: 'bg-gray-100 text-gray-800',
  ANALYSED: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-purple-100 text-purple-800',
  FINALISED: 'bg-green-100 text-green-800',
}[props.status]))

const label = computed(() =>
  props.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
)
</script>
