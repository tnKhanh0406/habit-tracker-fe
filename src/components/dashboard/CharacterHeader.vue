<script setup>
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Clover,
  Droplet,
  Edit2,
  Heart,
  Search,
  Shield,
  Sparkles,
  Star,
  Sword,
  Zap,
} from 'lucide-vue-next'

const props = defineProps({
  currentExp: {
    type: Number,
    default: 750,
  },
  currentCoin: {
    type: Number,
    default: 1250,
  },
  currentLevel: {
    type: Number,
    default: 18,
  },
})
</script>

<template>
  <section class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
    <div class="lg:col-span-8 border-y border-stone-300/80 bg-[#fbfaf7] px-4 py-5 sm:px-5">
      <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div class="relative shrink-0">
          <div class="grid size-20 place-items-center rounded-lg bg-stone-900 text-white shadow-[0_14px_30px_rgba(41,37,36,0.14)] sm:size-24">
            <Sparkles class="size-10 text-teal-200" />
          </div>
          <div class="absolute -bottom-2 -right-2 grid size-8 place-items-center rounded-md border border-stone-200 bg-[#f8f6f1] text-teal-800 shadow-sm">
            <Zap class="size-4 fill-teal-700 text-teal-700" />
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <div class="mb-4 flex flex-wrap items-center gap-2">
            <h2 class="m-0 text-2xl font-semibold tracking-[-0.02em] text-stone-950">Ve Ve Ka</h2>
            <button type="button" class="text-stone-400 transition hover:text-stone-700" aria-label="Edit profile">
              <Edit2 class="size-4" />
            </button>
            <span class="rounded-sm border border-teal-800/15 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
              Mage level {{ props.currentLevel }}
            </span>
            <span class="rounded-sm border border-amber-800/15 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {{ props.currentCoin.toLocaleString() }} coins
            </span>
          </div>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs font-semibold text-stone-600">
                <span class="flex items-center gap-1 text-red-700">
                  <Heart class="size-3.5 fill-red-600" />
                  HP
                </span>
                <span>80 / 100</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-sm bg-red-100">
                <div class="h-full rounded-sm bg-red-600" style="width: 80%"></div>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs font-semibold text-stone-600">
                <span class="flex items-center gap-1 text-sky-700">
                  <Droplet class="size-3.5 fill-sky-600" />
                  MP
                </span>
                <span>45 / 70</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-sm bg-sky-100">
                <div class="h-full rounded-sm bg-sky-700" style="width: 64%"></div>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs font-semibold text-stone-600">
                <span class="flex items-center gap-1 text-amber-700">
                  <Star class="size-3.5 fill-amber-500" />
                  EXP
                </span>
                <span>{{ props.currentExp.toLocaleString() }}</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-sm bg-amber-100">
                <div class="h-full rounded-sm bg-amber-500" :style="{ width: `${Math.min(props.currentExp / 1000 * 100, 100)}%` }"></div>
              </div>
            </div>
          </div>

          <div class="mt-5 flex flex-col gap-4 border-t border-stone-200 pt-4 md:flex-row md:items-center md:justify-between">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-stone-600">
              <span class="flex items-center gap-1.5">
                <Sword class="size-4 text-red-600" />
                STR <strong class="font-semibold text-stone-950">12</strong>
              </span>
              <span class="flex items-center gap-1.5">
                <BookOpen class="size-4 text-teal-700" />
                INT <strong class="font-semibold text-stone-950">25</strong>
              </span>
              <span class="flex items-center gap-1.5">
                <Shield class="size-4 text-sky-700" />
                DEF <strong class="font-semibold text-stone-950">14</strong>
              </span>
              <span class="flex items-center gap-1.5">
                <Clover class="size-4 text-emerald-700" />
                LUCK <strong class="font-semibold text-stone-950">8</strong>
              </span>
            </div>

            <div class="flex w-full items-center gap-2 md:w-auto">
              <div class="relative min-w-0 flex-1 md:w-56">
                <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search all tasks"
                  class="h-9 w-full rounded-md border border-stone-300 bg-white py-1.5 pl-9 pr-3 text-sm font-medium text-stone-800 placeholder:text-stone-400 transition focus:border-teal-700 focus:outline-none"
                />
              </div>

              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 active:translate-y-px"
              >
                All categories
                <ChevronDown class="size-3.5 text-stone-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <aside class="lg:col-span-4 border-y border-teal-900/20 bg-teal-950 px-5 py-5 text-teal-50">
      <p class="m-0 text-xs font-semibold tracking-[0.12em] text-teal-200">current quest</p>
      <h3 class="m-0 mt-1 text-xl font-semibold tracking-[-0.01em] text-white">Ancient Dragon</h3>

      <div class="mt-5 space-y-2">
        <div class="h-2 w-full overflow-hidden rounded-sm bg-teal-900">
          <div class="h-full rounded-sm bg-teal-300" style="width: 62%"></div>
        </div>
        <div class="flex items-center justify-between text-xs font-medium text-teal-100">
          <span>12,400 / 20,000 HP</span>
          <span>Your damage: 580</span>
        </div>
      </div>

      <div class="mt-5 flex items-center justify-between border-t border-teal-800 pt-4">
        <button type="button" class="inline-flex items-center gap-1 text-sm font-semibold text-teal-100 transition hover:text-white">
          View quest
          <ArrowRight class="size-4" />
        </button>
        <div class="grid size-10 place-items-center rounded-md border border-teal-700 bg-teal-900">
          <Zap class="size-5 text-teal-200" />
        </div>
      </div>
    </aside>
  </section>
</template>
