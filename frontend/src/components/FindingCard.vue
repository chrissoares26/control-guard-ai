<template>
  <div
    :class="[
      'bg-white rounded-lg border shadow-sm p-5',
      finding.requiresHumanReview && finding.reviewStatus === 'pending' ? 'border-2 border-amber-400 bg-amber-50' : 'border-gray-200'
    ]"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-3 mb-3">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm font-semibold text-gray-500">#{{ finding.sequence }}</span>
        <RiskBadge :risk="finding.riskLevel" />
        <ConfidenceBadge :score="finding.confidenceScore" :label="finding.confidenceLabel" />
      </div>
    </div>

    <h3 class="text-base font-semibold text-gray-900 mb-1">{{ finding.title }}</h3>
    <p class="text-xs text-gray-500 mb-3">
      {{ formatCategory(finding.category) }} · {{ finding.affectedProcessStep }}
    </p>

    <p class="text-sm text-gray-700 mb-3">{{ finding.description }}</p>

    <blockquote class="border-l-4 border-gray-300 pl-4 italic text-sm text-gray-600 mb-3">
      "{{ finding.evidenceExcerpt }}"
    </blockquote>

    <div class="mb-4">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recommendation</p>
      <p class="text-sm text-gray-700">{{ finding.recommendation }}</p>
    </div>

    <!-- Decision display (already reviewed) -->
    <div v-if="finding.reviewerDecision" class="rounded-md p-3" :class="decisionBannerClass">
      <p class="text-sm font-semibold">{{ decisionLabel }}</p>
      <p class="text-xs mt-1">
        By {{ finding.reviewerDecision.decidedBy }} on {{ formatDate(finding.reviewerDecision.decidedAt) }}
      </p>
      <p v-if="finding.reviewerDecision.reviewerNote" class="text-xs mt-1 italic">
        "{{ finding.reviewerDecision.reviewerNote }}"
      </p>
      <div v-if="finding.reviewerDecision.action === 'edited'" class="mt-2">
        <p class="text-xs font-semibold">Final recommendation:</p>
        <p class="text-xs">{{ finding.reviewerDecision.finalRecommendation }}</p>
      </div>
    </div>

    <!-- Action buttons (pending) -->
    <div v-else-if="finding.reviewStatus === 'pending'">
      <!-- Low-confidence confirmation prompt -->
      <div v-if="showLowConfirmAccept" class="mb-3 p-3 bg-amber-50 border border-amber-300 rounded-md">
        <p class="text-sm text-amber-800 font-medium mb-2">
          This finding has low AI confidence. Confirm inclusion in the report?
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            @click="confirmLowConfidenceAccept"
            class="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700"
          >Confirm</button>
          <button
            type="button"
            @click="showLowConfirmAccept = false"
            class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >Cancel</button>
        </div>
      </div>

      <div v-else class="flex gap-2 flex-wrap">
        <button
          type="button"
          @click="handleAccept"
          class="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
        >Accept</button>
        <button
          type="button"
          @click="showEditModal = true"
          class="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
        >Edit &amp; Accept</button>
        <button
          type="button"
          @click="showDismissModal = true"
          class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
        >Dismiss</button>
      </div>
    </div>

    <!-- Modals -->
    <DismissModal
      v-if="showDismissModal"
      @confirm="handleDismiss"
      @cancel="showDismissModal = false"
    />
    <EditFindingModal
      v-if="showEditModal"
      :original-recommendation="finding.recommendation"
      @confirm="handleEditAccept"
      @cancel="showEditModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import RiskBadge from './RiskBadge.vue'
import ConfidenceBadge from './ConfidenceBadge.vue'
import DismissModal from './DismissModal.vue'
import EditFindingModal from './EditFindingModal.vue'

interface ReviewerDecision {
  decidedBy: string
  decidedAt: string
  action: 'accepted' | 'edited' | 'dismissed'
  originalRecommendation: string
  finalRecommendation: string
  reviewerNote: string | null
}

interface Finding {
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

const props = defineProps<{ finding: Finding }>()

const emit = defineEmits<{
  accept: []
  'edit-accept': [finalRecommendation: string]
  dismiss: [note: string]
}>()

const showDismissModal = ref(false)
const showEditModal = ref(false)
const showLowConfirmAccept = ref(false)

function handleAccept() {
  if (props.finding.requiresHumanReview) {
    showLowConfirmAccept.value = true
  } else {
    emit('accept')
  }
}

function confirmLowConfidenceAccept() {
  showLowConfirmAccept.value = false
  emit('accept')
}

function handleEditAccept(finalRecommendation: string) {
  showEditModal.value = false
  emit('edit-accept', finalRecommendation)
}

function handleDismiss(note: string) {
  showDismissModal.value = false
  emit('dismiss', note)
}

const decisionBannerClass = computed(() => {
  const action = props.finding.reviewerDecision?.action
  if (action === 'accepted') return 'bg-green-50 border border-green-200 text-green-800'
  if (action === 'edited') return 'bg-amber-50 border border-amber-200 text-amber-800'
  return 'bg-red-50 border border-red-200 text-red-800'
})

const decisionLabel = computed(() => {
  const action = props.finding.reviewerDecision?.action
  if (action === 'accepted') return 'Accepted'
  if (action === 'edited') return 'Edited & Accepted'
  return 'Dismissed'
})

function formatCategory(cat: string) {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
