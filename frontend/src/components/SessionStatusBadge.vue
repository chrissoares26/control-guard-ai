<template>
  <span :class="['text-xs font-semibold px-2.5 py-1 rounded-md inline-flex items-center', colorClass]">
    <span :class="['w-1.5 h-1.5 rounded-full inline-block mr-1.5 shrink-0', dotClass]" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: 'DRAFT' | 'ANALYSED' | 'IN_REVIEW' | 'FINALISED' }>()

const colorClass = computed(() => ({
  DRAFT: 'bg-slate-100 text-slate-600',
  ANALYSED: 'bg-blue-50 text-blue-700',
  IN_REVIEW: 'bg-violet-50 text-violet-700',
  FINALISED: 'bg-emerald-50 text-emerald-700',
}[props.status]))

const dotClass = computed(() => ({
  DRAFT: 'bg-slate-400',
  ANALYSED: 'bg-blue-500',
  IN_REVIEW: 'bg-violet-500',
  FINALISED: 'bg-emerald-500',
}[props.status]))

const label = computed(() =>
  props.status.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
)
</script>
