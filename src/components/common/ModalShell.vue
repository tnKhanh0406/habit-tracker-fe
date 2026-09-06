<script setup>
import { X } from 'lucide-vue-next'

defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 grid place-items-center bg-stone-950/45 px-4 py-6">
      <section class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-md bg-[#fbfaf7] shadow-[0_24px_70px_rgba(41,37,36,0.22)]">
        <header class="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
          <div>
            <h2 class="m-0 text-lg font-semibold tracking-[-0.01em] text-stone-950">{{ title }}</h2>
            <p v-if="subtitle" class="m-0 mt-1 max-w-prose text-sm leading-6 text-stone-500">{{ subtitle }}</p>
          </div>

          <button
            type="button"
            class="grid size-9 place-items-center rounded-md border border-stone-300 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 active:translate-y-px"
            aria-label="Close modal"
            @click="emit('close')"
          >
            <X :size="18" />
          </button>
        </header>

        <slot />
      </section>
    </div>
  </Teleport>
</template>
