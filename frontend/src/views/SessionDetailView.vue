<template>
  <div class="min-h-full bg-surface px-4 sm:px-6 py-6 sm:py-8">
    <div class="max-w-3xl mx-auto">

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

      <!-- Loading -->
      <div v-if="sessionsStore.loading && !sessionsStore.currentSession" class="flex items-center justify-center py-24">
        <div class="w-8 h-8 border-2 border-slate-200 border-t-brand rounded-full animate-spin" />
      </div>

      <template v-else-if="sessionsStore.currentSession">

        <!-- Page header: title + status badge -->
        <div class="mb-7">
          <div class="flex items-start gap-3 mb-2">
            <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              {{ sessionsStore.currentSession.name }}
            </h1>
            <SessionStatusBadge
              :status="sessionsStore.currentSession.status"
              class="mt-1 flex-shrink-0"
            />
          </div>
          <!-- Metadata row -->
          <p class="text-sm text-slate-500">
            <span class="font-medium text-slate-700">{{ sessionsStore.currentSession.processName }}</span>
            <span class="mx-1.5 text-slate-300">·</span>
            Owner: <span class="font-medium text-slate-700">{{ sessionsStore.currentSession.processOwner }}</span>
            <span class="mx-1.5 text-slate-300">·</span>
            Created {{ formatDate(sessionsStore.currentSession.createdAt) }}
          </p>
        </div>

        <!-- Finding summary stats (analysed+ sessions) -->
        <div
          v-if="sessionsStore.currentSession.findingSummary"
          class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          <div class="bg-white rounded-xl ring-1 ring-slate-200/60 shadow-card p-4 text-center">
            <p class="text-2xl font-bold text-slate-900 leading-none mb-1">
              {{ sessionsStore.currentSession.findingSummary.total }}
            </p>
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</p>
          </div>
          <div class="bg-white rounded-xl ring-1 ring-amber-200/60 shadow-card p-4 text-center">
            <p class="text-2xl font-bold text-amber-600 leading-none mb-1">
              {{ sessionsStore.currentSession.findingSummary.pending }}
            </p>
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending</p>
          </div>
          <div class="bg-white rounded-xl ring-1 ring-emerald-200/60 shadow-card p-4 text-center">
            <p class="text-2xl font-bold text-emerald-600 leading-none mb-1">
              {{ sessionsStore.currentSession.findingSummary.accepted + sessionsStore.currentSession.findingSummary.edited }}
            </p>
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Accepted</p>
          </div>
          <div class="bg-white rounded-xl ring-1 ring-red-200/60 shadow-card p-4 text-center">
            <p class="text-2xl font-bold text-red-500 leading-none mb-1">
              {{ sessionsStore.currentSession.findingSummary.dismissed }}
            </p>
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Dismissed</p>
          </div>
        </div>

        <!-- DRAFT: document upload -->
        <div
          v-if="sessionsStore.currentSession.status === 'DRAFT'"
          class="bg-white rounded-xl ring-1 ring-slate-200/60 shadow-card p-6 mb-5"
        >
          <h2 class="text-sm font-semibold text-slate-900 mb-4">Upload Process Document</h2>

          <!-- Drop zone (no document yet) -->
          <div v-if="!sessionsStore.currentSession.document">
            <div
              class="border-2 border-dashed border-slate-200 hover:border-brand/40 rounded-xl p-10 text-center cursor-pointer transition-colors group"
              @dragover.prevent
              @drop.prevent="handleDrop"
              @click="fileInput?.click()"
            >
              <!-- Upload cloud icon -->
              <div class="flex justify-center mb-3">
                <div class="w-12 h-12 rounded-full bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center group-hover:bg-brand/5 group-hover:ring-brand/20 transition-colors">
                  <svg class="w-5 h-5 text-slate-400 group-hover:text-brand transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="16 16 12 12 8 16" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                  </svg>
                </div>
              </div>
              <p class="text-sm font-medium text-slate-700 mb-1">
                Drag &amp; drop a file here, or
                <span class="text-brand font-semibold">browse</span>
              </p>
              <p class="text-xs text-slate-400">PDF or DOCX — maximum 10 MB</p>
            </div>

            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              class="hidden"
              @change="handleFileSelect"
            />

            <!-- Upload error -->
            <div
              v-if="uploadError"
              class="flex items-start gap-2.5 mt-3 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5"
            >
              <svg class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p class="text-sm text-red-700">{{ uploadError }}</p>
            </div>

            <!-- Uploading progress -->
            <div v-if="uploading" class="flex items-center gap-2.5 mt-3 text-sm text-slate-600">
              <div class="w-4 h-4 border-2 border-slate-200 border-t-brand rounded-full animate-spin flex-shrink-0" />
              Uploading…
            </div>
          </div>

          <!-- Document uploaded -->
          <div v-else class="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl ring-1 ring-emerald-200/60">
            <!-- SVG checkmark in green circle -->
            <div class="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg class="w-4.5 h-4.5 text-white" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-900 truncate">
                {{ sessionsStore.currentSession.document.filename }}
              </p>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ formatFileSize(sessionsStore.currentSession.document.fileSize) }}
                <span class="mx-1 text-slate-300">·</span>
                {{ sessionsStore.currentSession.document.wordCount.toLocaleString() }} words
              </p>
            </div>
          </div>
        </div>

        <!-- Run analysis button (DRAFT + document exists) -->
        <div
          v-if="sessionsStore.currentSession.status === 'DRAFT' && sessionsStore.currentSession.document"
          class="mb-5"
        >
          <button
            :disabled="analysing"
            @click="handleRunAnalysis"
            class="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-brand hover:bg-brand-dark text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div v-if="analysing" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {{ analysing ? 'Running AI Analysis…' : 'Run AI Analysis' }}
          </button>
          <p v-if="analysisError" class="text-red-600 text-sm mt-2 text-center">{{ analysisError }}</p>
        </div>

        <!-- ANALYSED / IN_REVIEW: go to review -->
        <div
          v-if="sessionsStore.currentSession.status === 'ANALYSED' || sessionsStore.currentSession.status === 'IN_REVIEW'"
          class="mb-5"
        >
          <button
            @click="router.push(`/sessions/${sessionsStore.currentSession!.id}/review`)"
            class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand hover:bg-brand-dark text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Review Findings
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <!-- FINALISED: download report + audit trail -->
        <template v-if="sessionsStore.currentSession.status === 'FINALISED'">
          <div class="mb-5">
            <button
              :disabled="downloadingReport"
              @click="handleDownloadReport"
              class="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div v-if="downloadingReport" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {{ downloadingReport ? 'Generating Report…' : 'Download PDF Report' }}
            </button>
          </div>

          <!-- Audit trail (collapsible) -->
          <div class="bg-white rounded-xl ring-1 ring-slate-200/60 shadow-card overflow-hidden">
            <button
              @click="showAuditTrail = !showAuditTrail"
              class="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
                Audit Trail
              </span>
              <svg
                class="w-4 h-4 text-slate-400 transition-transform duration-200"
                :class="showAuditTrail ? 'rotate-180' : ''"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div v-if="showAuditTrail" class="border-t border-slate-100">
              <!-- Loading -->
              <div v-if="loadingAudit" class="flex items-center justify-center py-8">
                <div class="w-5 h-5 border-2 border-slate-200 border-t-brand rounded-full animate-spin" />
              </div>
              <!-- Empty -->
              <div v-else-if="auditEntries.length === 0" class="px-6 py-6 text-sm text-slate-400 text-center">
                No audit entries found.
              </div>
              <!-- Table -->
              <div v-else class="overflow-x-auto">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-100">
                      <th class="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide">Timestamp</th>
                      <th class="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide">Event</th>
                      <th class="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide">Actor</th>
                      <th class="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide">Outcome</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    <template v-for="entry in auditEntries" :key="entry.id">
                      <tr
                        class="hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
                        @click="toggleAuditDetail(entry.id)"
                      >
                        <td class="px-5 py-3 text-slate-400 whitespace-nowrap font-mono">
                          {{ formatDateTime(entry.eventTimestamp) }}
                        </td>
                        <td class="px-5 py-3 text-slate-700 font-medium">
                          {{ entry.eventType.replace(/_/g, ' ') }}
                        </td>
                        <td class="px-5 py-3 text-slate-600">{{ entry.actor }}</td>
                        <td class="px-5 py-3">
                          <span :class="getOutcomeClass(entry)">
                            <svg v-if="!isNegativeOutcome(entry)" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            {{ getOutcomeLabel(entry) }}
                          </span>
                        </td>
                      </tr>
                      <tr v-if="expandedAuditId === entry.id">
                        <td colspan="4" class="px-5 py-4 bg-slate-50 border-b border-slate-100">
                          <div v-if="entry.errorDetail || entry.payload?.error" class="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <span class="font-semibold">Error: </span>{{ (entry.payload?.error as string) || formatErrorDetail(entry.errorDetail!) }}
                          </div>
                          <p class="text-xs text-slate-700 mb-2 font-medium">{{ getEventSummary(entry) }}</p>
                          <div v-if="hasPayload(entry)" class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs max-w-sm">
                            <template v-for="(val, key) in (entry.payload as Record<string, unknown>)" :key="key">
                              <template v-if="key !== 'raw_response' && key !== 'error'">
                                <span class="text-slate-400 font-mono">{{ key }}</span>
                                <span class="text-slate-700">{{ val }}</span>
                              </template>
                            </template>
                          </div>
                          <p v-else-if="!entry.errorDetail" class="text-xs text-slate-400 italic">
                            No additional details recorded for this event.
                          </p>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>

      </template>

      <!-- Not found -->
      <div v-else-if="!sessionsStore.loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <svg class="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p class="text-sm font-medium">Session not found.</p>
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
type AuditEntry = {
  id: string
  eventType: string
  eventTimestamp: string
  actor: string
  outcome: string
  payload: Record<string, unknown>
  errorDetail: string | null
}

const auditEntries = ref<AuditEntry[]>([])
const expandedAuditId = ref<string | null>(null)

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

function formatErrorDetail(detail: string): string {
  try {
    const parsed = JSON.parse(detail)
    if (Array.isArray(parsed) && parsed[0]?.message) {
      return parsed.map((e: { message: string }) => e.message).join(', ')
    }
  } catch {
    // not JSON — return as-is
  }
  return detail
}

function toggleAuditDetail(id: string) {
  expandedAuditId.value = expandedAuditId.value === id ? null : id
}

function getOutcomeLabel(entry: AuditEntry): string {
  const p = entry.payload as Record<string, unknown> | null
  if (entry.eventType === 'finding_reviewed') {
    if (p?.action === 'accepted' || p?.action === 'edited') return 'Approved'
    if (p?.action === 'dismissed') return 'Rejected'
  }
  if (entry.eventType === 'session_finalised') return 'Finalised'
  if (entry.eventType === 'report_exported') return 'Exported'
  if (entry.outcome === 'failure') return 'Failed'
  return 'Success'
}

function isNegativeOutcome(entry: AuditEntry): boolean {
  const label = getOutcomeLabel(entry)
  return label === 'Failed' || label === 'Rejected'
}

function getOutcomeClass(entry: AuditEntry): string {
  if (isNegativeOutcome(entry)) return 'inline-flex items-center gap-1 text-red-600 font-medium'
  const label = getOutcomeLabel(entry)
  if (label === 'Approved' || label === 'Success' || label === 'Finalised' || label === 'Exported') {
    return 'inline-flex items-center gap-1 text-emerald-700 font-medium'
  }
  return 'inline-flex items-center gap-1 text-amber-600 font-medium'
}

function getEventSummary(entry: AuditEntry): string {
  const p = entry.payload as Record<string, unknown> | null
  switch (entry.eventType) {
    case 'finding_reviewed':
      return `Finding was ${getOutcomeLabel(entry).toLowerCase()} (action: ${p?.action ?? 'unknown'})`
    case 'document_uploaded':
      return `Document "${p?.filename ?? 'unknown'}" (${formatFileSize(Number(p?.filesize ?? 0))}) was uploaded`
    case 'ai_request_initiated':
      return `AI analysis started for document "${p?.document_name ?? 'unknown'}"`
    case 'ai_response_received':
      return entry.outcome === 'failure'
        ? 'AI analysis failed'
        : 'AI analysis completed successfully'
    case 'report_exported':
      return `Report exported by ${p?.exported_by ?? 'unknown'} as "${p?.report_filename ?? 'unknown'}"`
    case 'session_finalised':
      return 'Session was marked as finalised'
    case 'session_created':
      return 'Session was created'
    default:
      return entry.eventType.replace(/_/g, ' ')
  }
}

function hasPayload(entry: AuditEntry): boolean {
  return !!entry.payload && Object.keys(entry.payload).length > 0
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
