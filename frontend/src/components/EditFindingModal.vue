<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="$emit('cancel')" />

    <!-- Modal panel -->
    <div class="relative bg-white rounded-2xl shadow-modal w-full max-w-lg p-6">

      <!-- Header -->
      <div class="flex items-start gap-4 mb-5">
        <span class="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand/10 text-brand">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
          </svg>
        </span>
        <div>
          <h3 class="text-base font-bold text-slate-900 leading-snug">Edit Recommendation</h3>
          <p class="text-xs text-slate-500 mt-0.5">Review the AI suggestion and write your final version</p>
        </div>
      </div>

      <!-- AI Original section -->
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-2">
          <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">AI Original</p>
          <!-- Sparkles badge -->
          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand/8 text-brand text-[10px] font-semibold">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
            </svg>
            AI
          </span>
        </div>
        <div class="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-600 leading-relaxed">
          {{ originalRecommendation }}
        </div>
      </div>

      <!-- Your Final Recommendation textarea -->
      <div class="mb-5">
        <label for="final-rec" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          Your Final Recommendation <span class="text-red-500 normal-case tracking-normal font-semibold">*</span>
        </label>
        <textarea
          id="final-rec"
          v-model="finalRec"
          rows="5"
          class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 transition resize-none"
        />
      </div>

      <!-- Buttons -->
      <div class="flex gap-3 justify-end">
        <button
          type="button"
          @click="$emit('cancel')"
          class="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="finalRec.trim() === ''"
          @click="handleConfirm"
          class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Confirm &amp; Accept
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ originalRecommendation: string }>()

const emit = defineEmits<{
  confirm: [finalRecommendation: string]
  cancel: []
}>()

const finalRec = ref(props.originalRecommendation)

function handleConfirm() {
  if (finalRec.value.trim()) {
    emit('confirm', finalRec.value.trim())
  }
}
</script>
