<script setup>
import { LoaderCircle, Trash2 } from 'lucide-vue-next'
import ModalShell from '@/components/common/ModalShell.vue'

defineProps({
  todo: {
    type: Object,
    required: true,
  },
  deleting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <ModalShell
    title="Delete todo"
    subtitle="This removes the todo and its checklist from your dashboard."
    @close="emit('cancel')"
  >
    <div class="grid gap-5 px-5 py-5">
      <div class="rounded-md border border-stone-200 bg-white px-4 py-3">
        <p class="m-0 text-sm font-semibold text-stone-950">{{ todo.title }}</p>
        <p v-if="todo.description" class="m-0 mt-1 text-sm leading-6 text-stone-500">{{ todo.description }}</p>
      </div>

      <footer class="flex justify-end gap-2 border-t border-stone-200 pt-4">
        <button
          type="button"
          class="rounded-md border border-stone-300 px-4 py-2 font-semibold text-stone-700 transition hover:bg-stone-100 active:translate-y-px"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="deleting"
          @click="emit('confirm')"
        >
          <LoaderCircle v-if="deleting" class="animate-spin" :size="17" />
          <Trash2 v-else :size="17" />
          Delete todo
        </button>
      </footer>
    </div>
  </ModalShell>
</template>
