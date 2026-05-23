<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6">
        <button
          @click="router.push('/sessions')"
          class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg class="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sessions
        </button>
      </div>

      <div class="bg-white shadow rounded-lg p-8">
        <h1 class="text-xl font-bold text-gray-900 mb-6">Create New Review Session</h1>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Session Name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              placeholder="e.g. Q2 2026 AP Process Review"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label for="processName" class="block text-sm font-medium text-gray-700">Process Name</label>
            <input
              id="processName"
              v-model="form.processName"
              type="text"
              required
              placeholder="e.g. Accounts Payable"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label for="processOwner" class="block text-sm font-medium text-gray-700">Process Owner</label>
            <input
              id="processOwner"
              v-model="form.processOwner"
              type="text"
              required
              placeholder="e.g. Jane Smith"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div v-if="sessionsStore.error" class="text-red-600 text-sm">
            {{ sessionsStore.error }}
          </div>

          <div class="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              @click="router.push('/sessions')"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="sessionsStore.loading"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ sessionsStore.loading ? 'Creating...' : 'Create Session' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionsStore } from '@/stores/sessions'

const router = useRouter()
const sessionsStore = useSessionsStore()

const form = reactive({
  name: '',
  processName: '',
  processOwner: ''
})

async function handleSubmit() {
  try {
    const newSession = await sessionsStore.createSession({
      name: form.name,
      processName: form.processName,
      processOwner: form.processOwner
    })
    router.push(`/sessions/${newSession.id}`)
  } catch {
    // error is already set in sessionsStore.error
  }
}
</script>
