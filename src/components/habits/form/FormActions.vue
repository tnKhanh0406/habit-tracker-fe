<script setup>
import { LoaderCircle, Save } from 'lucide-vue-next'

defineProps({
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['cancel'])
</script>

<template>
  <footer class="flex justify-end gap-2 border-t border-stone-200 pt-4">
    <button
      type="button"
      class="rounded-md border border-stone-300 px-4 py-2 font-semibold text-stone-700 transition hover:bg-stone-100 active:translate-y-px"
      @click="emit('cancel')"
    >
      Cancel
    </button>
    <button
      type="submit"
      class="inline-flex items-center gap-2 rounded-md bg-teal-800 px-4 py-2 font-semibold text-white transition hover:bg-teal-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="saving"
    >
      <LoaderCircle v-if="saving" class="animate-spin" :size="17" />
      <Save v-else :size="17" />
      Save changes
    </button>
  </footer>
</template>
