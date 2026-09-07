<script setup>
import { CheckCircle2, Target } from 'lucide-vue-next'

defineProps({
  options: {
    type: Array,
    required: true,
  },
})

const model = defineModel({ type: String, required: true })

const getIcon = (value) => {
  return value === 'QUANTITY' ? Target : CheckCircle2
}
</script>

<template>
  <fieldset class="grid gap-2">
    <legend class="text-sm font-semibold text-stone-700">Tracking type</legend>

    <div class="grid gap-2 md:grid-cols-2">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :class="[
          'flex items-start gap-3 rounded-md border bg-white p-3 text-left transition active:translate-y-px',
          model === option.value
            ? 'border-teal-700 bg-teal-50 text-teal-950'
            : 'border-stone-300 text-stone-700 hover:border-teal-300',
        ]"
        @click="model = option.value"
      >
        <component :is="getIcon(option.value)" class="mt-0.5 size-4.5 shrink-0 text-teal-800" />
        <span>
          <span class="block text-sm font-semibold">{{ option.label }}</span>
          <span class="mt-0.5 block text-xs leading-5 text-stone-500">{{ option.description }}</span>
        </span>
      </button>
    </div>
  </fieldset>
</template>
