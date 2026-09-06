<script setup>
import { Type } from 'lucide-vue-next'

const model = defineModel({ type: String, required: true })
</script>

<template>
  <label class="grid gap-1.5">
    <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700">
      <Type :size="16" />
      Name
    </span>
    <input
      v-model="model"
      maxlength="100"
      class="h-11 rounded-md border border-stone-300 bg-white px-3 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
      type="text"
      placeholder="Read 30 minutes"
      required
    />
  </label>
</template>
