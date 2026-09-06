<script setup>
import { Check, Palette } from 'lucide-vue-next'

defineProps({
  colors: {
    type: Array,
    required: true,
  },
})

const model = defineModel({ type: String, required: true })
</script>

<template>
  <fieldset class="grid gap-2">
    <legend class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700">
      <Palette :size="16" />
      Color
    </legend>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="color in colors"
        :key="color"
        type="button"
        :class="[
          'grid size-9 place-items-center rounded-md border-2 shadow-sm transition active:translate-y-px',
          model === color ? 'border-stone-950' : 'border-white',
        ]"
        :style="{ backgroundColor: color }"
        :aria-label="`Choose ${color}`"
        @click="model = color"
      >
        <Check v-if="model === color" class="text-white drop-shadow" :size="17" :stroke-width="3" />
      </button>
    </div>
  </fieldset>
</template>
