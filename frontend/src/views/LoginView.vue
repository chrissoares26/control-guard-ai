<template>
  <div class="min-h-screen flex">
    <!-- Left panel — brand -->
    <div class="hidden lg:flex lg:w-5/12 bg-brand flex-col justify-between p-12 relative overflow-hidden">
      <!-- Background grid pattern -->
      <div class="absolute inset-0 opacity-[0.04]" style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 32px 32px;" />
      <!-- Glow -->
      <div class="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      <div class="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

      <!-- Logo -->
      <div class="relative flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L3 7v5c0 5 3.75 9.82 9 11 5.25-1.18 9-6 9-11V7L12 2z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>
        <div>
          <p class="text-white font-bold text-base tracking-tight">ControlGuard</p>
          <p class="text-blue-300/70 text-xs font-medium tracking-widest uppercase">AI Audit Platform</p>
        </div>
      </div>

      <!-- Main copy -->
      <div class="relative">
        <h1 class="text-4xl font-bold text-white leading-tight mb-5">
          Internal controls<br />
          <span class="text-blue-300">reviewed at scale.</span>
        </h1>
        <p class="text-blue-200/70 text-sm leading-relaxed mb-10">
          AI-accelerated gap analysis with structured evidence, confidence scoring, and a complete human-review audit trail.
        </p>

        <!-- Feature bullets -->
        <div class="space-y-4">
          <div v-for="feature in features" :key="feature.title" class="flex items-start gap-3">
            <div class="mt-0.5 w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p class="text-white text-sm font-semibold">{{ feature.title }}</p>
              <p class="text-blue-200/60 text-xs leading-relaxed">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <p class="relative text-blue-300/40 text-xs">
        AI findings are always reviewed by a qualified human auditor before inclusion in any report.
      </p>
    </div>

    <!-- Right panel — form -->
    <div class="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-white">
      <!-- Mobile logo -->
      <div class="lg:hidden flex items-center gap-2.5 mb-10">
        <div class="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path d="M12 2L3 7v5c0 5 3.75 9.82 9 11 5.25-1.18 9-6 9-11V7L12 2z" stroke-linecap="round" stroke-linejoin="round" />
            <polyline points="9 12 11 14 15 10" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <span class="text-brand font-bold text-base">ControlGuard AI</span>
      </div>

      <div class="w-full max-w-sm">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-1.5">Welcome back</h2>
          <p class="text-slate-500 text-sm">Sign in to your audit account</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label for="email" class="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="you@organisation.com"
              class="block w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
              class="block w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
            />
          </div>

          <div v-if="errorMessage" class="flex items-center gap-2.5 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg">
            <svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p class="text-red-700 text-sm">{{ errorMessage }}</p>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const features = [
  {
    title: 'Consistent framework application',
    description: 'Segregation of duties, preventive, detective, and corrective controls — applied uniformly across every document.',
  },
  {
    title: 'Evidence-backed findings',
    description: 'Every gap is anchored to a specific excerpt from the source document with a confidence score.',
  },
  {
    title: 'Complete audit trail',
    description: 'Every AI output and reviewer decision is immutably logged before inclusion in any report.',
  },
]

async function handleLogin() {
  loading.value = true
  errorMessage.value = ''
  try {
    await authStore.login(email.value, password.value)
    router.push('/sessions')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    errorMessage.value = e.response?.data?.message ?? 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>
