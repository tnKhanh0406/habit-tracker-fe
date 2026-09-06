<script setup>
import { Coins, LoaderCircle, Trash2 } from 'lucide-vue-next'
import ModalShell from '@/components/common/ModalShell.vue'

defineProps({
  reward: {
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
    title="Delete reward"
    subtitle="This removes the reward from the available list."
    @close="emit('cancel')"
  >
    <div class="grid gap-5 px-5 py-5">
      <div class="rounded-md border border-stone-200 bg-white px-4 py-3">
        <p class="m-0 text-sm font-semibold text-stone-950">{{ reward.name }}</p>
        <p v-if="reward.description" class="m-0 mt-1 text-sm leading-6 text-stone-500">
          {{ reward.description }}
        </p>
        <div class="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <Coins class="size-3.5" />
          {{ reward.cost || 100 }} coins
        </div>
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
          Delete reward
        </button>
      </footer>
    </div>
  </ModalShell>
</template>
