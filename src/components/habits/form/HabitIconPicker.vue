<script setup>
defineProps({
  icons: {
    type: Array,
    required: true,
  },
})

const model = defineModel({ type: String, required: true })
</script>

<template>
  <fieldset class="grid gap-2">
    <legend class="text-sm font-semibold text-stone-700">Icon</legend>
    <div class="grid grid-cols-4 gap-2 sm:grid-cols-7">
      <button
        v-for="icon in icons"
        :key="icon.key"
        type="button"
        :class="[
          'grid h-14 place-items-center rounded-md border text-stone-600 transition active:translate-y-px',
          model === icon.key
            ? 'border-teal-700 bg-teal-50 text-teal-800 ring-2 ring-teal-100'
            : 'border-stone-300 bg-white hover:border-teal-300 hover:bg-stone-50',
        ]"
        :title="icon.label"
        :aria-label="`Choose ${icon.label} icon`"
        @click="model = icon.key"
      >
        <component :is="icon.component" :size="24" :stroke-width="2.3" />
      </button>
    </div>
  </fieldset>
</template>
