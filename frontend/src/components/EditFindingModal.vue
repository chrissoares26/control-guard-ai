<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" @click="$emit('cancel')" />
    <div class="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Edit Recommendation</h3>

      <div class="mb-4">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">AI Original</p>
        <div class="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700">
          {{ originalRecommendation }}
        </div>
      </div>

      <div class="mb-4">
        <label for="final-rec" class="block text-sm font-medium text-gray-700 mb-1">
          Your Final Recommendation <span class="text-red-500">*</span>
        </label>
        <textarea
          id="final-rec"
          v-model="finalRec"
          rows="4"
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
          :disabled="finalRec.trim() === ''"
          @click="handleConfirm"
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
