<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Nav -->
    <nav class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="router.push(`/sessions/${sessionId}`)" class="text-sm text-indigo-600 hover:underline">
          ← Session
        </button>
        <span class="text-gray-300">/</span>
        <span class="text-sm font-medium text-gray-900">Review Findings</span>
      </div>
    </nav>

    <div class="max-w-3xl mx-auto px-6 py-8">
      <!-- Loading -->
      <div v-if="sessionsStore.loading && sessionsStore.findings.length === 0" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>

      <template v-else>
        <!-- Flagged findings banner -->
        <div
          v-if="flaggedPendingCount > 0"
          class="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-3"
        >
          <span class="text-amber-600 text-lg">⚠</span>
          <p class="text-sm text-amber-800 font-medium">
            {{ flaggedPendingCount }} finding{{ flaggedPendingCount !== 1 ? 's' : '' }} require{{ flaggedPendingCount === 1 ? 's' : '' }} mandatory human review due to low AI confidence.
          </p>
        </div>

        <!-- Progress bar -->
        <div class="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">
              {{ reviewedCount }} of {{ sessionsStore.findings.length }} reviewed
            </span>
            <span class="text-sm text-gray-500">{{ progressPercent }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="sessionsStore.findings.length === 0" class="text-center py-20">
          <p class="text-gray-500 text-sm">No control gaps identified by AI analysis.</p>
        </div>

        <!-- Finding cards -->
        <div class="space-y-4 mb-8">
          <FindingCard
            v-for="finding in sessionsStore.findings"
            :key="finding.id"
            :finding="finding"
            @accept="handleAccept(finding.id)"
            @edit-accept="(rec) => handleEditAccept(finding.id, rec)"
            @dismiss="(note) => handleDismiss(finding.id, note)"
          />
        </div>

        <!-- Finalise button -->
        <div class="sticky bottom-6">
          <button
            :disabled="pendingCount > 0 || finalising"
            @click="handleFinalise"
            :title="pendingCount > 0 ? `${pendingCount} finding(s) still pending review` : ''"
            class="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            <div v-if="finalising" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            {{ finalising ? 'Finalising…' : pendingCount > 0 ? `Finalise Session (${pendingCount} pending)` : 'Finalise Session' }}
          </button>
        </div>

        <!-- Finalise confirm dialog -->
        <div v-if="showFinaliseConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showFinaliseConfirm = false" />
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Finalise Session</h3>
            <p class="text-sm text-gray-600 mb-6">
              This will lock the session. No further changes can be made. Are you sure?
            </p>
            <div class="flex gap-3 justify-end">
              <button @click="showFinaliseConfirm = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button @click="confirmFinalise" class="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700">Yes, Finalise</button>
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
