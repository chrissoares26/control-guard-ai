<template>
  <div class="min-h-full bg-surface px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
    <div class="max-w-2xl w-full mx-auto">

      <!-- Breadcrumb -->
      <button
        @click="router.push('/sessions')"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand transition-colors mb-5"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 19l-7-7 7-7" />
        </svg>
        Back to Sessions
      </button>

      <!-- Page title -->
      <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-7">New Review Session</h1>

      <!-- Form card -->
      <div class="bg-white rounded-xl ring-1 ring-slate-200/60 shadow-card p-6 sm:p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">

          <!-- Session Name -->
          <div>
            <label for="name" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Session Name
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              placeholder="e.g. Q2 2026 AP Process Review"
              class="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
            />
          </div>

          <!-- Process Name -->
          <div>
            <label for="processName" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Process Name
            </label>
            <input
              id="processName"
              v-model="form.processName"
              type="text"
              required
              placeholder="e.g. Accounts Payable"
              class="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
            />
          </div>

          <!-- Process Owner -->
          <div>
            <label for="processOwner" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Process Owner
            </label>
            <input
              id="processOwner"
              v-model="form.processOwner"
              type="text"
              required
              placeholder="e.g. Jane Smith"
              class="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
            />
          </div>

          <!-- Error state -->
          <div
            v-if="sessionsStore.error"
            class="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3"
          >
            <svg class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p class="text-sm text-red-700">{{ sessionsStore.error }}</p>
          </div>

          <!-- Actions -->
          <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              @click="router.push('/sessions')"
              class="border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="sessionsStore.loading"
              class="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="sessionsStore.loading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
                <path d="M21 12a9 9 0 00-9-9" />
              </svg>
              {{ sessionsStore.loading ? 'Creating…' : 'Create Session' }}
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
