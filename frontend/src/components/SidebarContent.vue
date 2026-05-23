<template>
  <!-- Navigation -->
  <nav class="flex-1 px-3 py-4 space-y-0.5">
    <RouterLink
      to="/sessions"
      class="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
      :class="currentPath.startsWith('/sessions')
        ? 'bg-white/12 text-white'
        : 'text-blue-200/70 hover:bg-white/8 hover:text-white'"
      @click="$emit('navigate')"
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
      Review Sessions
    </RouterLink>
  </nav>

  <div class="mx-4 border-t border-white/10" />

  <!-- User / Logout -->
  <div class="px-3 py-4 space-y-1">
    <div class="flex items-center gap-2.5 px-3 py-2">
      <div class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 uppercase">
        {{ userInitial }}
      </div>
      <span class="text-slate-300/80 text-xs truncate">{{ userEmail }}</span>
    </div>
    <button
      @click="$emit('logout')"
      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-blue-200/60 text-xs font-medium hover:bg-white/8 hover:text-white transition-all duration-150 cursor-pointer"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Sign out
    </button>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  userInitial: string
  userEmail: string
  currentPath: string
}>()

defineEmits<{
  logout: []
  navigate: []
}>()
</script>
