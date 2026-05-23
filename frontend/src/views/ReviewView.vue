<template>
  <div class="min-h-screen bg-surface">
    <div class="max-w-3xl mx-auto px-6 py-8">

      <!-- Breadcrumb -->
      <div class="mb-6">
        <button
          @click="router.push(`/sessions/${sessionId}`)"
          class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back to Session
        </button>
      </div>

      <!-- Loading -->
      <div v-if="sessionsStore.loading && sessionsStore.findings.length === 0" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-2 border-slate-200 border-t-brand rounded-full animate-spin" />
      </div>

      <template v-else>

        <!-- Page heading -->
        <div class="flex items-center gap-3 mb-6">
          <h1 class="text-2xl font-bold text-slate-900">Review Findings</h1>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-500">
            {{ reviewedCount }} of {{ sessionsStore.findings.length }} reviewed
          </span>
        </div>

        <!-- Flagged findings banner -->
        <div
          v-if="flaggedPendingCount > 0"
          class="mb-5 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3"
        >
          <svg class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p class="text-sm text-amber-800 font-medium">
            {{ flaggedPendingCount }} finding{{ flaggedPendingCount !== 1 ? 's' : '' }} require{{ flaggedPendingCount === 1 ? 's' : '' }} mandatory human review due to low AI confidence.
          </p>
        </div>

        <!-- Progress bar card -->
        <div class="mb-6 bg-white rounded-xl ring-1 ring-slate-200/60 shadow-card p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-slate-700">
              {{ reviewedCount }} / {{ sessionsStore.findings.length }} findings reviewed
            </span>
            <span class="text-sm font-semibold text-slate-500">{{ progressPercent }}%</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2">
            <div
              class="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="sessionsStore.findings.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
          <svg class="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm font-medium text-slate-500">No control gaps identified</p>
          <p class="text-xs text-slate-400 mt-1">The AI analysis found no issues requiring review.</p>
        </div>

        <!-- Finding cards -->
        <div class="space-y-4 mb-24">
          <FindingCard
            v-for="finding in sessionsStore.findings"
            :key="finding.id"
            :finding="finding"
            @accept="handleAccept(finding.id)"
            @edit-accept="(rec) => handleEditAccept(finding.id, rec)"
            @dismiss="(note) => handleDismiss(finding.id, note)"
          />
        </div>

        <!-- Finalise button — sticky bottom -->
        <div class="fixed bottom-0 left-0 right-0 px-6 py-4 bg-surface/80 backdrop-blur border-t border-slate-200/60">
          <div class="max-w-3xl mx-auto">
            <button
              :disabled="pendingCount > 0 || finalising"
              @click="handleFinalise"
              :title="pendingCount > 0 ? `${pendingCount} finding(s) still pending review` : ''"
              class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <div v-if="finalising" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <template v-else-if="pendingCount > 0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </template>
              <template v-else>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </template>
              {{ finalising ? 'Finalising…' : pendingCount > 0 ? `Finalise Session (${pendingCount} pending)` : 'Finalise Session' }}
            </button>
          </div>
        </div>

        <!-- Finalise confirm dialog -->
        <div v-if="showFinaliseConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="showFinaliseConfirm = false" />
          <div class="relative bg-white rounded-2xl shadow-modal w-full max-w-md mx-4 p-6">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-slate-900">Finalise Session</h3>
            </div>
            <p class="text-sm text-slate-600 mb-6 leading-relaxed">
              This will lock the session. No further changes can be made to the findings or recommendations. Are you sure you want to proceed?
            </p>
            <div class="flex gap-3 justify-end">
              <button
                @click="showFinaliseConfirm = false"
                class="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="confirmFinalise"
                class="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand/90 transition-colors"
              >
                Yes, Finalise
              </button>
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionsStore } from '@/stores/sessions'
import FindingCard from '@/components/FindingCard.vue'

const route = useRoute()
const router = useRouter()
const sessionsStore = useSessionsStore()

const sessionId = route.params.id as string
const finalising = ref(false)
const showFinaliseConfirm = ref(false)

onMounted(async () => {
  await sessionsStore.fetchFindings(sessionId)
})

const reviewedCount = computed(() =>
  sessionsStore.findings.filter(f => f.reviewStatus !== 'pending').length
)

const pendingCount = computed(() =>
  sessionsStore.findings.filter(f => f.reviewStatus === 'pending').length
)

const flaggedPendingCount = computed(() =>
  sessionsStore.findings.filter(f => f.requiresHumanReview && f.reviewStatus === 'pending').length
)

const progressPercent = computed(() => {
  if (sessionsStore.findings.length === 0) return 0
  return Math.round((reviewedCount.value / sessionsStore.findings.length) * 100)
})

async function handleAccept(findingId: string) {
  await sessionsStore.reviewFinding(sessionId, findingId, { action: 'accepted' })
}

async function handleEditAccept(findingId: string, finalRecommendation: string) {
  await sessionsStore.reviewFinding(sessionId, findingId, { action: 'edited', finalRecommendation })
}

async function handleDismiss(findingId: string, reviewerNote: string) {
  await sessionsStore.reviewFinding(sessionId, findingId, { action: 'dismissed', reviewerNote })
}

function handleFinalise() {
  showFinaliseConfirm.value = true
}

async function confirmFinalise() {
  showFinaliseConfirm.value = false
  finalising.value = true
  try {
    await sessionsStore.finaliseSession(sessionId)
    router.push(`/sessions/${sessionId}`)
  } finally {
    finalising.value = false
  }
}
</script>
