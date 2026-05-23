<template>
  <div class="min-h-full">
    <!-- Page header -->
    <div class="px-4 sm:px-6 lg:px-8 pt-8 pb-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-xl font-bold text-slate-900">Review Sessions</h1>
          <p class="mt-1 text-sm text-slate-500">Manage and track your internal controls evaluation sessions</p>
        </div>
        <button
          @click="router.push('/sessions/new')"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Session
        </button>
      </div>
    </div>

    <div class="px-4 sm:px-6 lg:px-8">
      <!-- Filter tabs -->
      <div class="flex items-center gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeFilter = tab.value"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer whitespace-nowrap"
          :class="activeFilter === tab.value
            ? 'border-brand text-brand'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
        >
          {{ tab.label }}
          <span
            class="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
            :class="activeFilter === tab.value ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-500'"
          >
            {{ tabCount(tab.value) }}
          </span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="sessionsStore.loading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-2 border-slate-200 border-t-brand rounded-full animate-spin" />
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredSessions.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <svg class="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke-linecap="round" stroke-linejoin="round" />
            <rect x="9" y="3" width="6" height="4" rx="1" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <h3 class="text-sm font-semibold text-slate-900 mb-1">
          {{ sessionsStore.sessions.length === 0 ? 'No sessions yet' : 'No sessions match this filter' }}
        </h3>
        <p class="text-sm text-slate-500 mb-6">
          {{ sessionsStore.sessions.length === 0 ? 'Create your first review session to get started.' : 'Try selecting a different status filter.' }}
        </p>
        <button
          v-if="sessionsStore.sessions.length === 0"
          @click="router.push('/sessions/new')"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Session
        </button>
      </div>

      <!-- Sessions list / table -->
      <div v-else>
        <!-- Mobile card list (sm and below) -->
        <div class="sm:hidden space-y-2.5">
          <div
            v-for="session in filteredSessions"
            :key="session.id"
            @click="router.push(`/sessions/${session.id}`)"
            class="bg-white rounded-xl ring-1 ring-slate-200/60 shadow-card px-4 py-4 cursor-pointer active:bg-slate-50 transition-colors"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <span class="text-sm font-semibold text-slate-900 leading-tight">{{ session.name }}</span>
              <SessionStatusBadge :status="session.status" />
            </div>
            <p class="text-sm text-slate-500 mb-3">{{ session.processName }}</p>
            <div class="flex items-center gap-4 text-xs text-slate-400">
              <span>{{ session.findingCount ?? 0 }} findings</span>
              <span v-if="session.pendingCount > 0" class="text-amber-600 font-semibold">{{ session.pendingCount }} pending</span>
              <span class="ml-auto">{{ formatDate(session.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Desktop table (sm and above) -->
        <div class="hidden sm:block bg-white rounded-xl ring-1 ring-slate-200/60 shadow-card overflow-hidden">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-slate-100">
                <th class="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Session</th>
                <th class="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Process</th>
                <th class="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Findings</th>
                <th class="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending</th>
                <th class="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="session in filteredSessions"
                :key="session.id"
                @click="router.push(`/sessions/${session.id}`)"
                class="hover:bg-slate-50/70 cursor-pointer transition-colors duration-100 group"
              >
                <td class="px-6 py-4">
                  <span class="text-sm font-semibold text-slate-900 group-hover:text-brand transition-colors">{{ session.name }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-slate-600">{{ session.processName }}</span>
                </td>
                <td class="px-6 py-4">
                  <SessionStatusBadge :status="session.status" />
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-slate-700">{{ session.findingCount ?? '—' }}</span>
                </td>
                <td class="px-6 py-4">
                  <span v-if="session.pendingCount > 0" class="inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    {{ session.pendingCount }}
                  </span>
                  <span v-else class="text-sm text-slate-400">—</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-slate-500">{{ formatDate(session.createdAt) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="sessionsStore.error" class="mt-4 flex items-center gap-2 text-sm text-red-600">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {{ sessionsStore.error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionsStore } from '@/stores/sessions'
import SessionStatusBadge from '@/components/SessionStatusBadge.vue'

const router = useRouter()
const sessionsStore = useSessionsStore()

type Filter = 'all' | 'in-progress' | 'finalised'
const activeFilter = ref<Filter>('all')

const tabs: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Finalised', value: 'finalised' },
]

const filteredSessions = computed(() => {
  if (activeFilter.value === 'all') return sessionsStore.sessions
  if (activeFilter.value === 'in-progress') return sessionsStore.sessions.filter(s => s.status !== 'FINALISED')
  return sessionsStore.sessions.filter(s => s.status === 'FINALISED')
})

function tabCount(filter: Filter) {
  if (filter === 'all') return sessionsStore.sessions.length
  if (filter === 'in-progress') return sessionsStore.sessions.filter(s => s.status !== 'FINALISED').length
  return sessionsStore.sessions.filter(s => s.status === 'FINALISED').length
}

onMounted(() => sessionsStore.fetchSessions())

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
