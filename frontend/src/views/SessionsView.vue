<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Review Sessions</h1>
          <p class="text-sm text-gray-500 mt-1">{{ authStore.user?.email }}</p>
        </div>
        <button
          @click="router.push('/sessions/new')"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          + New Session
        </button>
      </div>

      <!-- Status filter tabs -->
      <div class="flex gap-1 mb-4 border-b border-gray-200">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeFilter = tab.value"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeFilter === tab.value
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          {{ tab.label }}
          <span class="ml-1.5 text-xs rounded-full px-1.5 py-0.5" :class="activeFilter === tab.value ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'">
            {{ tabCount(tab.value) }}
          </span>
        </button>
      </div>

      <div v-if="sessionsStore.loading" class="flex justify-center items-center py-16">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>

      <div
        v-else-if="filteredSessions.length === 0"
        class="text-center py-16"
      >
        <p class="text-gray-500 text-sm">
          {{ sessionsStore.sessions.length === 0 ? 'No sessions yet. Create your first review session.' : 'No sessions match this filter.' }}
        </p>
        <button
          v-if="sessionsStore.sessions.length === 0"
          @click="router.push('/sessions/new')"
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          New Session
        </button>
      </div>

      <div v-else class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Findings</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="session in filteredSessions"
              :key="session.id"
              @click="router.push(`/sessions/${session.id}`)"
              class="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-medium text-gray-900">{{ session.name }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-700">{{ session.processName }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <SessionStatusBadge :status="session.status" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ session.findingCount }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="session.pendingCount > 0 ? 'text-yellow-700 font-medium' : 'text-gray-500'" class="text-sm">
                  {{ session.pendingCount }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(session.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="sessionsStore.error" class="mt-4 text-red-600 text-sm">{{ sessionsStore.error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionsStore } from '@/stores/sessions'
import { useAuthStore } from '@/stores/auth'
import SessionStatusBadge from '@/components/SessionStatusBadge.vue'

const router = useRouter()
const sessionsStore = useSessionsStore()
const authStore = useAuthStore()

type Filter = 'all' | 'in-progress' | 'finalised'
const activeFilter = ref<Filter>('all')

const tabs: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Finalised', value: 'finalised' },
]

const filteredSessions = computed(() => {
  if (activeFilter.value === 'all') return sessionsStore.sessions
  if (activeFilter.value === 'in-progress') {
    return sessionsStore.sessions.filter(s => s.status !== 'FINALISED')
  }
  return sessionsStore.sessions.filter(s => s.status === 'FINALISED')
})

function tabCount(filter: Filter) {
  if (filter === 'all') return sessionsStore.sessions.length
  if (filter === 'in-progress') return sessionsStore.sessions.filter(s => s.status !== 'FINALISED').length
  return sessionsStore.sessions.filter(s => s.status === 'FINALISED').length
}

onMounted(() => {
  sessionsStore.fetchSessions()
})

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
