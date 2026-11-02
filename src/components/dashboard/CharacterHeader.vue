<script setup>
import {
  ArrowRight,
  BookOpen,
  Clover,
  Droplet,
  Edit2,
  Heart,
  Shield,
  Sparkles,
  Star,
  Sword,
  Zap,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const displayName = computed(() => auth.user?.username || auth.user?.email || 'Account')

const props = defineProps({
  character: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['allocate-stat', 'open-skills'])

const statDefinitions = [
  { key: 'strength', label: 'STR', icon: Sword, color: 'text-red-600' },
  { key: 'intelligence', label: 'INT', icon: BookOpen, color: 'text-teal-700' },
  { key: 'vitality', label: 'VIT', icon: Shield, color: 'text-sky-700' },
  { key: 'agility', label: 'AGI', icon: Clover, color: 'text-emerald-700' },
]

const progressPercent = (value, max) => {
  const current = Number(value || 0)
  const maximum = Number(max || 0)
  if (maximum <= 0) return 0
  return Math.min(Math.max((current / maximum) * 100, 0), 100)
}

const formatNumber = (value) => {
  if (value === undefined || value === null) return '-'
  return Number(value).toLocaleString()
}
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
            <h2 class="m-0 text-2xl font-semibold tracking-[-0.02em] text-stone-950">{{ displayName }}</h2>
            <button type="button" class="text-stone-400 transition hover:text-stone-700" aria-label="Edit profile">
              <Edit2 class="size-4" />
            </button>
            <span class="rounded-sm border border-teal-800/15 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
              {{ props.character?.characterClass || 'Choose class' }} level {{ props.character?.level ?? '-' }}
            </span>
            <span class="rounded-sm border border-amber-800/15 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {{ formatNumber(props.character?.coin) }} coins
            </span>
          </div>

          <p v-if="props.loading" class="m-0 mb-3 text-xs font-medium text-stone-500">Loading character...</p>
          <p v-else-if="props.error" class="m-0 mb-3 rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {{ props.error }}
          </p>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs font-semibold text-stone-600">
                <span class="flex items-center gap-1 text-red-700">
                  <Heart class="size-3.5 fill-red-600" />
                  HP
                </span>
                <span>{{ formatNumber(props.character?.hp) }} / {{ formatNumber(props.character?.maxHp) }}</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-sm bg-red-100">
                <div class="h-full rounded-sm bg-red-600" :style="{ width: `${progressPercent(props.character?.hp, props.character?.maxHp)}%` }"></div>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs font-semibold text-stone-600">
                <span class="flex items-center gap-1 text-sky-700">
                  <Droplet class="size-3.5 fill-sky-600" />
                  MP
                </span>
                <span>{{ formatNumber(props.character?.mp) }} / {{ formatNumber(props.character?.maxMp) }}</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-sm bg-sky-100">
                <div class="h-full rounded-sm bg-sky-700" :style="{ width: `${progressPercent(props.character?.mp, props.character?.maxMp)}%` }"></div>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs font-semibold text-stone-600">
                <span class="flex items-center gap-1 text-amber-700">
                  <Star class="size-3.5 fill-amber-500" />
                  EXP
                </span>
                <span>{{ formatNumber(props.character?.exp) }} / {{ formatNumber(props.character?.nextLevelExp) }}</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-sm bg-amber-100">
                <div class="h-full rounded-sm bg-amber-500" :style="{ width: `${progressPercent(props.character?.exp, props.character?.nextLevelExp)}%` }"></div>
              </div>
            </div>
          </div>

          <div class="mt-5 flex flex-col gap-4 border-t border-stone-200 pt-4 md:flex-row md:items-center md:justify-between">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-stone-600">
              <span v-for="stat in statDefinitions" :key="stat.key" class="inline-flex items-center gap-1.5">
                <component :is="stat.icon" :class="['size-4', stat.color]" />
                {{ stat.label }} <strong class="font-semibold text-stone-950">{{ formatNumber(props.character?.[stat.key]) }}</strong>
                <button
                  type="button"
                  class="grid size-5 place-items-center rounded border border-stone-300 bg-white text-stone-500 transition hover:border-teal-700 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="!props.character?.statPoints || props.loading"
                  :aria-label="`Allocate 1 point to ${stat.label}`"
                  @click="emit('allocate-stat', stat.key.toUpperCase())"
                >
                  +
                </button>
              </span>
              <span class="text-teal-800">Points: {{ formatNumber(props.character?.statPoints) }}</span>
            </div>

            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-md bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
              :disabled="props.loading || !props.character"
              @click="emit('open-skills')"
            >
              <Sparkles class="size-4" />
              {{ props.character?.characterClass ? 'Skills' : 'Choose class' }}
            </button>

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
