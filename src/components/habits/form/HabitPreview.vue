<script setup>
defineProps({
  name: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    required: true,
  },
  icon: {
    type: [Object, Function],
    required: true,
  },
  targetUnit: {
    type: String,
    default: '',
  },
  targetValue: {
    type: Number,
    required: true,
  },
})
</script>

<template>
  <div class="border-y border-stone-200 bg-stone-50/60 p-3">
    <div class="flex items-center gap-3">
      <span class="grid size-11 place-items-center rounded-md text-white" :style="{ backgroundColor: color }">
        <component :is="icon" :size="23" :stroke-width="2.5" />
      </span>
      <div>
        <p class="m-0 font-semibold text-stone-950">{{ name || 'Habit preview' }}</p>
        <p class="m-0 text-sm text-stone-500">{{ targetValue }} {{ targetUnit || 'unit' }}</p>
      </div>
    </div>
  </div>
</template>
