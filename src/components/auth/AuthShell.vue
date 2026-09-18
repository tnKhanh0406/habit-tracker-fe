<script setup>
import { Crown } from 'lucide-vue-next'

defineProps({
  eyebrow: {
    type: String,
    default: 'Daily practice, made visible',
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <main class="grid min-h-dvh bg-[#f6f3ee] lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
    <section class="hidden border-r border-stone-300/80 bg-teal-950 px-10 py-10 text-teal-50 lg:flex lg:flex-col lg:justify-between xl:px-16">
      <div>
        <div class="flex items-center gap-3">
          <div class="grid size-10 place-items-center rounded-md border border-teal-300/20 bg-teal-800 text-white">
            <Crown class="size-5" />
          </div>
          <span class="text-lg font-semibold tracking-[-0.01em]">Habit Tracker</span>
        </div>

        <div class="mt-24 max-w-lg">
          <p class="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">{{ eyebrow }}</p>
          <h1 class="m-0 mt-4 text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white xl:text-6xl">
            Build a rhythm you can return to.
          </h1>
          <p class="m-0 mt-6 max-w-md text-base leading-7 text-teal-100/75">
            Keep habits, tasks and rewards in one calm daily workspace.
          </p>
        </div>
      </div>

      <p class="m-0 text-xs font-medium text-teal-200/60">A focused place for the next good action.</p>
    </section>

    <section class="flex items-center justify-center px-5 py-10 sm:px-8">
      <div class="w-full max-w-md">
        <div class="mb-8 lg:hidden">
          <div class="flex items-center gap-3 text-stone-950">
            <div class="grid size-10 place-items-center rounded-md bg-teal-800 text-white">
              <Crown class="size-5" />
            </div>
            <span class="text-lg font-semibold">Habit Tracker</span>
          </div>
        </div>

        <div class="border border-stone-300/80 bg-[#fbfaf7] p-6 shadow-[0_18px_40px_rgba(41,37,36,0.08)] sm:p-8">
          <p class="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">{{ title }}</p>
          <p class="m-0 mt-2 text-sm leading-6 text-stone-500">{{ subtitle }}</p>
          <slot />
        </div>
      </div>
    </section>
  </main>
</template>
