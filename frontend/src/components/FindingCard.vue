<template>
  <div
    :class="[
      'bg-white rounded-xl shadow-card overflow-hidden transition-all duration-200',
      finding.requiresHumanReview && finding.reviewStatus === 'pending'
        ? 'ring-2 ring-amber-300'
        : 'ring-1 ring-slate-200/60',
    ]"
  >
    <!-- Risk-level left accent + content wrapper -->
    <div :class="['flex', riskAccentClass]">
      <div class="w-1 flex-shrink-0" />
      <div class="flex-1 p-5">

        <!-- 1. Header row -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[11px] font-semibold text-slate-400 tabular-nums">#{{ finding.sequence }}</span>
          <RiskBadge :risk="finding.riskLevel" />
          <ConfidenceBadge :score="finding.confidenceScore" :label="finding.confidenceLabel" />
          <div class="flex-1" />
          <span class="text-[11px] text-slate-400 font-medium">
            {{ formatCategory(finding.category) }}
            <span class="mx-1 text-slate-300">&middot;</span>
            {{ finding.affectedProcessStep }}
          </span>
        </div>

        <!-- 2. Title -->
        <h3 class="text-base font-bold text-slate-900 mt-2 mb-1 leading-snug">
          {{ finding.title }}
        </h3>

        <!-- 3. Description -->
        <p class="text-sm text-slate-600 leading-relaxed mb-4">
          {{ finding.description }}
        </p>

        <!-- 4. Evidence excerpt -->
        <div class="bg-slate-50 border-l-[3px] border-slate-300 rounded-r-lg px-4 py-3 mb-4">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Evidence</p>
          <blockquote class="text-sm text-slate-600 italic leading-relaxed">
            "{{ finding.evidenceExcerpt }}"
          </blockquote>
        </div>

        <!-- 5. Recommendation -->
        <div>
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
            Recommendation
          </p>
          <p class="text-sm text-slate-700 leading-relaxed">
            {{ finding.recommendation }}
          </p>
        </div>

        <!-- 6. Divider -->
        <div class="border-t border-slate-100 mt-4 pt-4">

          <!-- 8. Decision display (reviewed) -->
          <div v-if="finding.reviewerDecision">
            <!-- Accepted or Edited -->
            <div
              v-if="finding.reviewerDecision.action === 'accepted' || finding.reviewerDecision.action === 'edited'"
              class="bg-emerald-50 rounded-lg px-4 py-3"
            >
              <div class="flex items-start gap-3">
                <span class="mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-emerald-800">{{ decisionLabel }}</p>
                  <p class="text-xs text-emerald-600 mt-0.5">
                    By {{ finding.reviewerDecision.decidedBy }} &middot;
                    {{ formatDate(finding.reviewerDecision.decidedAt) }}
                  </p>
                  <p v-if="finding.reviewerDecision.reviewerNote" class="text-xs text-emerald-700 italic mt-1.5">
                    "{{ finding.reviewerDecision.reviewerNote }}"
                  </p>
                  <div v-if="finding.reviewerDecision.action === 'edited'" class="mt-2.5 border-t border-emerald-200/60 pt-2.5">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">
                      Final Recommendation
                    </p>
                    <p class="text-xs text-emerald-800 leading-relaxed">
                      {{ finding.reviewerDecision.finalRecommendation }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dismissed -->
            <div v-else class="bg-slate-50 rounded-lg px-4 py-3">
              <div class="flex items-start gap-3">
                <span class="mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/>
                    <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
                  </svg>
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-700">{{ decisionLabel }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">
                    By {{ finding.reviewerDecision.decidedBy }} &middot;
                    {{ formatDate(finding.reviewerDecision.decidedAt) }}
                  </p>
                  <p v-if="finding.reviewerDecision.reviewerNote" class="text-xs text-slate-600 italic mt-1.5">
                    "{{ finding.reviewerDecision.reviewerNote }}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 7. Action area (pending) -->
          <div v-else-if="finding.reviewStatus === 'pending'">
            <!-- Low-confidence confirmation box -->
            <div
              v-if="showLowConfirmAccept"
              class="mb-3 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
            >
              <span class="flex-shrink-0 mt-0.5 text-amber-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
              </span>
              <div class="flex-1">
                <p class="text-sm text-amber-800 font-medium mb-2.5">
                  This finding has low AI confidence. Confirm inclusion in the report?
                </p>
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="confirmLowConfidenceAccept"
                    class="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    @click="showLowConfirmAccept = false"
                    class="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <!-- Normal action buttons -->
            <div v-else class="flex items-center gap-2 flex-wrap">
              <!-- Accept -->
              <button
                type="button"
                @click="handleAccept"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Accept
              </button>

              <!-- Edit & Accept -->
              <button
                type="button"
                @click="showEditModal = true"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-brand text-white hover:bg-brand-light transition-colors cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
                </svg>
                Edit &amp; Accept
              </button>

              <!-- Dismiss -->
              <button
                type="button"
                @click="showDismissModal = true"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
                </svg>
                Dismiss
              </button>
            </div>
          </div>

        </div>
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

const riskAccentClass = computed(() => {
  const level = props.finding.riskLevel
  if (level === 'critical') return 'border-l-4 border-red-500'
  if (level === 'high') return 'border-l-4 border-orange-500'
  if (level === 'medium') return 'border-l-4 border-amber-400'
  return 'border-l-4 border-sky-400'
})

const decisionLabel = computed(() => {
  const action = props.finding.reviewerDecision?.action
  if (action === 'accepted') return 'Accepted'
  if (action === 'edited') return 'Edited & Accepted'
  return 'Dismissed'
})

function formatCategory(cat: string) {
  return cat.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
