<template>
  <div class="min-h-screen">
    <!-- Full-screen layout for public routes (login) -->
    <RouterView v-if="isPublicRoute" />

    <!-- App shell for authenticated routes -->
    <div v-else class="flex h-dvh bg-surface overflow-hidden">

      <!-- Desktop sidebar (lg+) -->
      <aside class="hidden lg:flex w-56 bg-brand flex-col flex-shrink-0 select-none">
        <div class="px-5 pt-6 pb-5">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        <SidebarContent
          :user-initial="userInitial"
          :user-email="authStore.user?.email ?? ''"
          :current-path="route.path"
          @logout="handleLogout"
          @navigate="() => {}"
        />
      </aside>

      <!-- Main column -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

        <!-- Mobile top bar (hidden lg+) -->
        <header class="lg:hidden flex items-center justify-between px-4 py-3 bg-brand border-b border-white/10 flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L3 7v5c0 5 3.75 9.82 9 11 5.25-1.18 9-6 9-11V7L12 2z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <span class="text-white font-bold text-sm tracking-tight">ControlGuard</span>
          </div>
          <button
            @click="mobileMenuOpen = true"
            class="p-2 -mr-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Open navigation menu"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </header>

        <!-- Main content -->
        <main class="flex-1 overflow-y-auto scrollbar-thin">
          <RouterView />
        </main>
      </div>
    </div>

    <!-- Mobile drawer overlay (Teleport keeps it above everything) -->
    <Teleport to="body">
      <Transition name="drawer-backdrop">
        <div
          v-if="mobileMenuOpen"
          class="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm"
          @click="mobileMenuOpen = false"
        />
      </Transition>
      <Transition name="drawer-panel">
        <aside
          v-if="mobileMenuOpen"
          class="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-brand flex flex-col select-none shadow-2xl"
        >
          <!-- Close button -->
          <div class="flex items-center justify-between px-5 pt-5 pb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2L3 7v5c0 5 3.75 9.82 9 11 5.25-1.18 9-6 9-11V7L12 2z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <div>
                <p class="text-white font-bold text-sm leading-tight tracking-tight">ControlGuard</p>
                <p class="text-blue-300/70 text-[10px] font-medium tracking-wide uppercase">AI Audit Platform</p>
              </div>
            </div>
            <button
              @click="mobileMenuOpen = false"
              class="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="mx-4 border-t border-white/10" />

          <SidebarContent
            :user-initial="userInitial"
            :user-email="authStore.user?.email ?? ''"
            :current-path="route.path"
            @logout="handleLogout"
            @navigate="mobileMenuOpen = false"
          />
        </aside>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SidebarContent from '@/components/SidebarContent.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isPublicRoute = computed(() => !!route.meta.public)
const mobileMenuOpen = ref(false)

const userInitial = computed(() => {
  const email = authStore.user?.email ?? ''
  return email.charAt(0).toUpperCase()
})

async function handleLogout() {
  mobileMenuOpen.value = false
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active {
  transition: opacity 200ms ease;
}
.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}

.drawer-panel-enter-active,
.drawer-panel-leave-active {
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-panel-enter-from,
.drawer-panel-leave-to {
  transform: translateX(-100%);
}
</style>
