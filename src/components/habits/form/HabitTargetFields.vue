<script setup>
import { Target } from 'lucide-vue-next'

const targetValue = defineModel('targetValue', { type: Number, required: true })
const targetUnit = defineModel('targetUnit', { type: String, required: true })
</script>

<template>
  <label class="grid gap-1.5">
    <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700">
      <Target :size="16" />
      Target
    </span>
    <div class="grid grid-cols-[1fr_130px] gap-2">
      <input
        v-model.number="targetValue"
        class="h-11 rounded-md border border-stone-300 bg-white px-3 text-stone-900 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        type="number"
        min="0.01"
        step="0.01"
        required
      />
      <input
        v-model="targetUnit"
        class="h-11 rounded-md border border-stone-300 bg-white px-3 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        type="text"
        placeholder="minutes"
        required
      />
    </div>
  </label>
</template>
