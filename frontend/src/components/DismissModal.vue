<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="$emit('cancel')" />

    <!-- Modal panel -->
    <div class="relative bg-white rounded-2xl shadow-modal w-full max-w-md p-6">

      <!-- Header -->
      <div class="flex items-start gap-4 mb-5">
        <span class="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </span>
        <div>
          <h3 class="text-base font-bold text-slate-900 leading-snug">Dismiss Finding</h3>
          <p class="text-xs text-slate-500 mt-0.5">This action requires a written justification</p>
        </div>
      </div>

      <!-- Textarea -->
      <div class="mb-1">
        <label for="dismiss-note" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          Justification <span class="text-red-500 normal-case tracking-normal font-semibold">*</span>
        </label>
        <textarea
          id="dismiss-note"
          v-model="note"
          rows="4"
          placeholder="Explain why this finding is being dismissed…"
          class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 transition resize-none"
        />
      </div>

      <!-- Character counter -->
      <p class="text-xs text-slate-400 text-right mt-1 mb-5">{{ note.length }} characters</p>

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
          :disabled="note.trim() === ''"
          @click="handleConfirm"
          class="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Confirm Dismiss
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  confirm: [note: string]
  cancel: []
}>()

const note = ref('')

function handleConfirm() {
  if (note.value.trim()) {
    emit('confirm', note.value.trim())
  }
}
</script>
