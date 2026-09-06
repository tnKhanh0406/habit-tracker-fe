<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  submitLabel: {
    type: String,
    required: true,
  },
  progress: {
    type: Number,
    required: true,
  },
  targetValue: {
    type: Number,
    required: true,
  },
  targetUnit: {
    type: String,
    required: true,
  },
})

const model = defineModel({ type: Number, required: true })
const emit = defineEmits(['cancel', 'submit'])
</script>

<template>
  <section class="grid gap-2 border border-stone-300 bg-stone-50/60 p-3">
    <h3 class="m-0 text-base font-semibold text-stone-950">{{ title }}</h3>
    <p class="m-0 text-sm text-stone-600">Current Progress: {{ progress }} / {{ targetValue }} {{ targetUnit }}</p>

    <form class="grid gap-2 sm:grid-cols-[1fr_auto_auto]" @submit.prevent="emit('submit')">
      <div class="grid grid-cols-[1fr_auto] overflow-hidden rounded-md border border-stone-300 bg-white">
        <input
          v-model.number="model"
          class="h-10 min-w-0 border-0 px-3 outline-none"
          type="number"
          min="0"
          step="0.01"
          placeholder="Enter progress"
        />
        <span class="grid place-items-center px-3 text-sm font-semibold text-stone-500">{{ targetUnit }}</span>
      </div>

      <button
        type="button"
        class="rounded-md border border-stone-300 px-3 py-2 font-semibold text-stone-700 transition hover:bg-white active:translate-y-px"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button type="submit" class="rounded-md bg-teal-800 px-3 py-2 font-semibold text-white transition hover:bg-teal-700 active:translate-y-px">
        {{ submitLabel }}
      </button>
    </form>
  </section>
</template>
