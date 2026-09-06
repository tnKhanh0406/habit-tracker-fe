<script setup>
import { FileText } from 'lucide-vue-next'

const model = defineModel({ type: String, required: true })
</script>

<template>
  <label class="grid gap-1.5">
    <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700">
      <FileText :size="16" />
      Description
    </span>
    <textarea
      v-model="model"
      class="min-h-24 resize-y rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
      placeholder="Optional description"
    ></textarea>
  </label>
</template>
