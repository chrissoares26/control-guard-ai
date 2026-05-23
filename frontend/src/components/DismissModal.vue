<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" @click="$emit('cancel')" />
    <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Dismiss Finding</h3>
      <div class="mb-4">
        <label for="dismiss-note" class="block text-sm font-medium text-gray-700 mb-1">
          Justification <span class="text-red-500">*</span>
        </label>
        <textarea
          id="dismiss-note"
          v-model="note"
          rows="4"
          placeholder="Explain why this finding is being dismissed..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
      </div>
      <div class="flex gap-3 justify-end">
        <button
          type="button"
          @click="$emit('cancel')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="note.trim() === ''"
          @click="handleConfirm"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
