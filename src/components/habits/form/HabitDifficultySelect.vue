<script setup>
defineProps({
  difficulties: {
    type: Array,
    required: true,
  },
})

const model = defineModel({ type: String, required: true })
</script>

<template>
  <label class="grid gap-1.5">
    <span class="text-sm font-semibold text-stone-700">Difficulty</span>
    <select
      v-model="model"
      class="h-11 rounded-md border border-stone-300 bg-white px-3 text-stone-900 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
      required
    >
      <option v-for="difficulty in difficulties" :key="difficulty" :value="difficulty">
        {{ difficulty }}
      </option>
    </select>
  </label>
</template>
