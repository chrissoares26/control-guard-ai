<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Nav -->
    <nav class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="router.push('/sessions')" class="text-sm text-indigo-600 hover:underline">
          ← Sessions
        </button>
        <span class="text-gray-300">/</span>
        <span class="text-sm font-medium text-gray-900 truncate max-w-xs">
          {{ sessionsStore.currentSession?.name ?? 'Loading…' }}
        </span>
      </div>
      <SessionStatusBadge v-if="sessionsStore.currentSession" :status="sessionsStore.currentSession.status" />
    </nav>

    <div class="max-w-3xl mx-auto px-6 py-8">
      <!-- Loading -->
      <div v-if="sessionsStore.loading && !sessionsStore.currentSession" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>

      <template v-else-if="sessionsStore.currentSession">
        <!-- Session metadata -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h1 class="text-xl font-bold text-gray-900 mb-1">{{ sessionsStore.currentSession.name }}</h1>
          <p class="text-sm text-gray-500 mb-4">
            Process: <span class="font-medium text-gray-700">{{ sessionsStore.currentSession.processName }}</span>
            · Owner: <span class="font-medium text-gray-700">{{ sessionsStore.currentSession.processOwner }}</span>
            · Created {{ formatDate(sessionsStore.currentSession.createdAt) }}
          </p>

          <!-- Finding summary for analysed+ sessions -->
          <div v-if="sessionsStore.currentSession.findingSummary" class="grid grid-cols-4 gap-3 text-center">
            <div class="rounded-md bg-gray-50 p-3">
              <p class="text-lg font-bold text-gray-900">{{ sessionsStore.currentSession.findingSummary.total }}</p>
              <p class="text-xs text-gray-500">Total</p>
            </div>
            <div class="rounded-md bg-yellow-50 p-3">
              <p class="text-lg font-bold text-yellow-700">{{ sessionsStore.currentSession.findingSummary.pending }}</p>
              <p class="text-xs text-gray-500">Pending</p>
            </div>
            <div class="rounded-md bg-green-50 p-3">
              <p class="text-lg font-bold text-green-700">
                {{ sessionsStore.currentSession.findingSummary.accepted + sessionsStore.currentSession.findingSummary.edited }}
              </p>
              <p class="text-xs text-gray-500">Accepted</p>
            </div>
            <div class="rounded-md bg-red-50 p-3">
              <p class="text-lg font-bold text-red-700">{{ sessionsStore.currentSession.findingSummary.dismissed }}</p>
              <p class="text-xs text-gray-500">Dismissed</p>
            </div>
          </div>
        </div>

        <!-- DRAFT: document upload -->
        <div v-if="sessionsStore.currentSession.status === 'DRAFT'" class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Upload Process Document</h2>

          <div v-if="!sessionsStore.currentSession.document">
            <div
              class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
              @dragover.prevent
              @drop.prevent="handleDrop"
              @click="fileInput?.click()"
            >
              <p class="text-sm text-gray-600">Drag &amp; drop a PDF or DOCX here, or <span class="text-indigo-600 font-medium">browse</span></p>
              <p class="text-xs text-gray-400 mt-1">Maximum 10 MB</p>
            </div>
            <input ref="fileInput" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" class="hidden" @change="handleFileSelect" />
            <p v-if="uploadError" class="text-red-600 text-sm mt-2">{{ uploadError }}</p>
            <div v-if="uploading" class="flex items-center gap-2 mt-3 text-sm text-gray-600">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
              Uploading…
            </div>
          </div>

          <div v-else class="flex items-center gap-3 p-3 bg-green-50 rounded-md">
            <span class="text-green-600 text-lg">✓</span>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ sessionsStore.currentSession.document.filename }}</p>
              <p class="text-xs text-gray-500">{{ formatFileSize(sessionsStore.currentSession.document.fileSize) }} · {{ sessionsStore.currentSession.document.wordCount.toLocaleString() }} words</p>
            </div>
          </div>
        </div>

        <!-- Run analysis button (DRAFT + document exists) -->
        <div v-if="sessionsStore.currentSession.status === 'DRAFT' && sessionsStore.currentSession.document" class="mb-6">
          <button
            :disabled="analysing"
            @click="handleRunAnalysis"
            class="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div v-if="analysing" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            {{ analysing ? 'Running AI Analysis…' : 'Run AI Analysis' }}
          </button>
          <p v-if="analysisError" class="text-red-600 text-sm mt-2 text-center">{{ analysisError }}</p>
        </div>

        <!-- ANALYSED / IN_REVIEW: go to review -->
        <div v-if="sessionsStore.currentSession.status === 'ANALYSED' || sessionsStore.currentSession.status === 'IN_REVIEW'" class="mb-6">
          <button
            @click="router.push(`/sessions/${sessionsStore.currentSession!.id}/review`)"
            class="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700"
          >
            Review Findings →
          </button>
        </div>

        <!-- FINALISED: download report + audit trail -->
        <template v-if="sessionsStore.currentSession.status === 'FINALISED'">
          <div class="mb-6">
            <button
              :disabled="downloadingReport"
              @click="handleDownloadReport"
              class="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <div v-if="downloadingReport" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              {{ downloadingReport ? 'Generating Report…' : 'Download PDF Report' }}
            </button>
          </div>

          <!-- Audit trail -->
          <div class="bg-white rounded-lg border border-gray-200">
            <button
              @click="showAuditTrail = !showAuditTrail"
              class="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              <span>Audit Trail</span>
              <span>{{ showAuditTrail ? '▲' : '▼' }}</span>
            </button>
            <div v-if="showAuditTrail" class="border-t border-gray-200">
              <div v-if="loadingAudit" class="flex items-center justify-center py-6">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
              </div>
              <div v-else-if="auditEntries.length === 0" class="px-6 py-4 text-sm text-gray-500">No audit entries found.</div>
              <div v-else class="overflow-x-auto">
                <table class="w-full text-xs">
                  <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="px-4 py-2 text-left font-medium text-gray-500">Timestamp</th>
                      <th class="px-4 py-2 text-left font-medium text-gray-500">Event</th>
                      <th class="px-4 py-2 text-left font-medium text-gray-500">Actor</th>
                      <th class="px-4 py-2 text-left font-medium text-gray-500">Outcome</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="entry in auditEntries" :key="entry.id" class="hover:bg-gray-50">
                      <td class="px-4 py-2 text-gray-500 whitespace-nowrap">{{ formatDateTime(entry.eventTimestamp) }}</td>
                      <td class="px-4 py-2 text-gray-700">{{ entry.eventType.replace(/_/g, ' ') }}</td>
                      <td class="px-4 py-2 text-gray-700">{{ entry.actor }}</td>
                      <td class="px-4 py-2">
                        <span :class="entry.outcome === 'success' ? 'text-green-700' : 'text-red-700'">{{ entry.outcome }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>
      </template>

      <div v-else-if="!sessionsStore.loading" class="text-center py-20 text-gray-500">
        Session not found.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionsStore } from '@/stores/sessions'
import SessionStatusBadge from '@/components/SessionStatusBadge.vue'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const sessionsStore = useSessionsStore()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref('')
const analysing = ref(false)
const analysisError = ref('')
const downloadingReport = ref(false)
const showAuditTrail = ref(false)
const loadingAudit = ref(false)
const auditEntries = ref<Array<{ id: string; eventType: string; eventTimestamp: string; actor: string; outcome: string }>>([])

const sessionId = route.params.id as string

onMounted(async () => {
  await sessionsStore.fetchSession(sessionId)
})

watch(showAuditTrail, async (open) => {
  if (open && auditEntries.value.length === 0) {
    loadingAudit.value = true
    try {
      const res = await api.get(`/sessions/${sessionId}/audit-log`)
      auditEntries.value = res.data
    } finally {
      loadingAudit.value = false
    }
  }
})

function validateFile(file: File): string | null {
  const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowed.includes(file.type)) return 'Only PDF and DOCX files are accepted.'
  if (file.size > 10 * 1024 * 1024) return 'File must be under 10 MB.'
  return null
}

async function uploadFile(file: File) {
  const err = validateFile(file)
  if (err) { uploadError.value = err; return }
  uploading.value = true
  uploadError.value = ''
  try {
    await sessionsStore.uploadDocument(sessionId, file)
  } catch (e: unknown) {
    const ex = e as { response?: { data?: { message?: string } } }
    uploadError.value = ex.response?.data?.message ?? 'Upload failed.'
  } finally {
    uploading.value = false
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) uploadFile(input.files[0])
}

function handleDrop(event: DragEvent) {
  const file = event.dataTransfer?.files[0]
  if (file) uploadFile(file)
}

async function handleRunAnalysis() {
  analysing.value = true
  analysisError.value = ''
  try {
    await sessionsStore.triggerAnalysis(sessionId)
  } catch (e: unknown) {
    const ex = e as { response?: { data?: { message?: string } } }
    analysisError.value = ex.response?.data?.message ?? 'Analysis failed. Please try again.'
  } finally {
    analysing.value = false
  }
}

async function handleDownloadReport() {
  downloadingReport.value = true
  try {
    const response = await api.get(`/sessions/${sessionId}/report`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `controlguard-report-${sessionId}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    downloadingReport.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
