<template>
  <div class="min-h-screen">
    <!-- Full-screen layout for public routes (login) -->
    <RouterView v-if="isPublicRoute" />

    <!-- App shell for authenticated routes -->
    <div v-else class="flex h-screen bg-surface overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-56 bg-brand flex flex-col flex-shrink-0 select-none">
        <!-- Brand -->
        <div class="px-5 pt-6 pb-5">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg class="w-4.5 h-4.5 text-white" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L3 7v5c0 5 3.75 9.82 9 11 5.25-1.18 9-6 9-11V7L12 2z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-white font-bold text-sm leading-tight tracking-tight">ControlGuard</p>
              <p class="text-blue-300/80 text-[10px] font-medium tracking-wide uppercase">AI Audit Platform</p>
            </div>
          </div>
        </div>

        <div class="mx-4 border-t border-white/10" />

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-0.5">
          <RouterLink
            to="/sessions"
            class="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
            :class="route.path.startsWith('/sessions')
              ? 'bg-white/12 text-white'
              : 'text-blue-200/70 hover:bg-white/8 hover:text-white'"
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
            <span class="text-slate-300/80 text-xs truncate">{{ authStore.user?.email }}</span>
          </div>
          <button
            @click="handleLogout"
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
      </aside>

      <!-- Main content area -->
      <main class="flex-1 overflow-y-auto scrollbar-thin">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isPublicRoute = computed(() => !!route.meta.public)

const userInitial = computed(() => {
  const email = authStore.user?.email ?? ''
  return email.charAt(0).toUpperCase()
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>
