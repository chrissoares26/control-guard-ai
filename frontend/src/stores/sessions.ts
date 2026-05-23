import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export interface SessionSummary {
  id: string
  name: string
  processName: string
  processOwner: string
  status: 'DRAFT' | 'ANALYSED' | 'IN_REVIEW' | 'FINALISED'
  createdAt: string
  finalisedAt: string | null
  findingCount: number
  pendingCount: number
}

export interface SessionDocument {
  id: string
  filename: string
  fileSize: number
  format: string
  wordCount: number
  uploadedAt: string
}

export interface SessionDetail extends SessionSummary {
  document: SessionDocument | null
  findingSummary: {
    total: number
    pending: number
    accepted: number
    edited: number
    dismissed: number
    flaggedForReview: number
  } | null
}

export interface ReviewerDecision {
  decidedBy: string
  decidedAt: string
  action: 'accepted' | 'edited' | 'dismissed'
  originalRecommendation: string
  finalRecommendation: string
  reviewerNote: string | null
}

export interface Finding {
  id: string
  sequence: number
  category: string
  title: string
  description: string
  affectedProcessStep: string
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  confidenceScore: number
  confidenceLabel: 'high' | 'medium' | 'low' | 'flagged'
  evidenceExcerpt: string
  recommendation: string
  controlTypeSuggested: string
  requiresHumanReview: boolean
  reviewStatus: 'pending' | 'accepted' | 'edited' | 'dismissed'
  reviewerDecision: ReviewerDecision | null
}

export interface ReviewFindingDto {
  action: 'accepted' | 'edited' | 'dismissed'
  finalRecommendation?: string
  reviewerNote?: string
}

export const useSessionsStore = defineStore('sessions', () => {
  const sessions = ref<SessionSummary[]>([])
  const currentSession = ref<SessionDetail | null>(null)
  const findings = ref<Finding[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSessions() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/sessions')
      sessions.value = response.data
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      error.value = e.response?.data?.message ?? e.message ?? 'Failed to fetch sessions'
    } finally {
      loading.value = false
    }
  }

  async function fetchSession(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/sessions/${id}`)
      currentSession.value = response.data
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      error.value = e.response?.data?.message ?? e.message ?? 'Failed to fetch session'
    } finally {
      loading.value = false
    }
  }

  async function createSession(dto: { name: string; processName: string; processOwner: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/sessions', dto)
      sessions.value.push(response.data)
      return response.data as SessionSummary
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      error.value = e.response?.data?.message ?? e.message ?? 'Failed to create session'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function uploadDocument(sessionId: string, file: File) {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('file', file)
      await api.post(`/sessions/${sessionId}/document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await fetchSession(sessionId)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      error.value = e.response?.data?.message ?? e.message ?? 'Failed to upload document'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function triggerAnalysis(sessionId: string) {
    loading.value = true
    error.value = null
    try {
      await api.post(`/sessions/${sessionId}/analyse`)
      await fetchSession(sessionId)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      error.value = e.response?.data?.message ?? e.message ?? 'Failed to trigger analysis'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchFindings(sessionId: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/sessions/${sessionId}/findings`)
      findings.value = response.data
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      error.value = e.response?.data?.message ?? e.message ?? 'Failed to fetch findings'
    } finally {
      loading.value = false
    }
  }

  async function reviewFinding(sessionId: string, findingId: string, dto: ReviewFindingDto) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/sessions/${sessionId}/findings/${findingId}/review`, dto)
      const updatedFinding = response.data as Finding
      const index = findings.value.findIndex((f) => f.id === findingId)
      if (index !== -1) {
        findings.value[index] = updatedFinding
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      error.value = e.response?.data?.message ?? e.message ?? 'Failed to submit review'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function finaliseSession(sessionId: string) {
    loading.value = true
    error.value = null
    try {
      await api.post(`/sessions/${sessionId}/finalise`)
      await fetchSession(sessionId)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      error.value = e.response?.data?.message ?? e.message ?? 'Failed to finalise session'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    sessions,
    currentSession,
    findings,
    loading,
    error,
    fetchSessions,
    fetchSession,
    createSession,
    uploadDocument,
    triggerAnalysis,
    fetchFindings,
    reviewFinding,
    finaliseSession
  }
})
