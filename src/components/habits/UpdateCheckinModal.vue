<script setup>
import { computed, ref, watch } from 'vue'
import { BarChart2, CheckCircle2, Flame, Info, ShieldCheck, Target, TrendingUp } from 'lucide-vue-next'
import ModalShell from '@/components/common/ModalShell.vue'
import { addProgress, updateProgress } from '@/api/habitCheckinApi'
import { HABIT_ICONS, LEGACY_HABIT_ICON_MAP } from '@/constants/habitOptions'

const props = defineProps({
  habit: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['add-progress', 'update-progress', 'cancel'])

const activeMode = ref('add')
const amountToAdd = ref(1)
const setProgressValue = ref(Number(props.habit.progress || 0))
const saving = ref(false)
const errorMessage = ref('')

const targetVal = computed(() => Number(props.habit.targetValue ?? 0))
const targetUnitStr = computed(() => props.habit.targetUnit || '')
const currentProg = computed(() => Number(props.habit.progress || 0))

const getHabitIconComponent = (iconKey) => {
  const normalized = LEGACY_HABIT_ICON_MAP[iconKey] || iconKey
  const found = HABIT_ICONS.find((i) => i.key === normalized)
  return found?.component || BarChart2
}

const calculatedNewProgress = computed(() => {
  const added = Number(amountToAdd.value || 0)
  return Math.max(0, currentProg.value + added)
})

const calculatedNewPercentage = computed(() => {
  if (targetVal.value <= 0) return 0
  const pct = Math.round((calculatedNewProgress.value / targetVal.value) * 100)
  return Math.min(pct, 100)
})

const currentPercentage = computed(() => {
  if (targetVal.value <= 0) return 0
  const pct = Math.round((currentProg.value / targetVal.value) * 100)
  return Math.min(pct, 100)
})

const setPercentage = computed(() => {
  if (targetVal.value <= 0) return 0
  const pct = Math.round((Number(setProgressValue.value || 0) / targetVal.value) * 100)
  return Math.min(pct, 100)
})

const remainingToTarget = computed(() => {
  const rem = targetVal.value - Number(setProgressValue.value || 0)
  return Math.max(0, Math.round(rem * 100) / 100)
})

const handleAddSubmit = async () => {
  if (amountToAdd.value <= 0) return
  saving.value = true
  errorMessage.value = ''
  try {
    const res = await addProgress(props.habit.id, Number(amountToAdd.value))
    emit('add-progress', res.data)
  } catch (err) {
    console.error('Failed to add progress:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Failed to add progress.'
  } finally {
    saving.value = false
  }
}

const handleSetSubmit = async () => {
  saving.value = true
  errorMessage.value = ''
  try {
    const res = await updateProgress(props.habit.id, Number(setProgressValue.value))
    emit('update-progress', res.data)
  } catch (err) {
    console.error('Failed to set progress:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Failed to set progress.'
  } finally {
    saving.value = false
  }
}

watch(
  () => props.habit,
  (h) => {
    setProgressValue.value = Number(h.progress || 0)
  },
  { immediate: true },
)
</script>

<template>
  <ModalShell
    :title="activeMode === 'add' ? 'Add progress' : 'Set progress'"
    :subtitle="activeMode === 'add' ? 'Log additional progress for today.' : 'Set the exact progress value for today.'"
    @close="emit('cancel')"
  >
    <div class="space-y-5 p-5">
      <div class="flex items-center rounded-md bg-stone-100 p-0.5 text-sm font-medium">
        <button
          type="button"
          :class="[
            'flex flex-1 items-center justify-center gap-1.5 rounded-sm py-2 transition active:translate-y-px',
            activeMode === 'add' ? 'bg-white text-teal-900 shadow-sm' : 'text-stone-500 hover:text-stone-900',
          ]"
          @click="activeMode = 'add'"
        >
          <BarChart2 class="size-4" />
          Add progress
        </button>
        <button
          type="button"
          :class="[
            'flex flex-1 items-center justify-center gap-1.5 rounded-sm py-2 transition active:translate-y-px',
            activeMode === 'set' ? 'bg-white text-teal-900 shadow-sm' : 'text-stone-500 hover:text-stone-900',
          ]"
          @click="activeMode = 'set'"
        >
          <Target class="size-4" />
          Set progress
        </button>
      </div>

      <section class="border-y border-stone-200 bg-stone-50/60 py-3">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="grid size-10 shrink-0 place-items-center rounded-md text-white"
              :style="{ backgroundColor: habit.color || '#0f766e' }"
            >
              <component :is="getHabitIconComponent(habit.icon)" class="size-5" />
            </div>

            <div>
              <h4 class="m-0 text-sm font-semibold text-stone-950">{{ habit.name }}</h4>
              <p class="m-0 mt-0.5 text-xs font-medium text-stone-500">
                {{ currentProg }} / {{ targetVal }} {{ targetUnitStr }}
              </p>
            </div>
          </div>

          <div v-if="habit.currentStreak !== undefined" class="flex items-center gap-1 text-xs font-semibold text-red-700">
            <Flame class="size-3.5 text-red-600" />
            <span>{{ habit.currentStreak }}</span>
          </div>
        </div>

        <div class="mt-3 space-y-1">
          <div class="flex items-center justify-between text-xs font-medium text-stone-600">
            <span>Current progress</span>
            <span>{{ currentPercentage }}%</span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-sm bg-stone-200">
            <div
              class="h-full rounded-sm bg-teal-700 transition-all duration-300"
              :style="{ width: `${currentPercentage}%` }"
            ></div>
          </div>
        </div>
      </section>

      <form v-if="activeMode === 'add'" class="space-y-4" @submit.prevent="handleAddSubmit">
        <label class="grid gap-1.5">
          <span class="text-sm font-semibold text-stone-700">Amount to add</span>
          <div class="relative flex items-center rounded-md border border-stone-300 bg-white px-3 py-2 transition focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-100">
            <input
              v-model.number="amountToAdd"
              type="number"
              min="0.01"
              step="any"
              placeholder="0.0"
              class="w-full bg-transparent text-center text-2xl font-semibold tracking-[-0.02em] text-stone-950 outline-none"
            />
            <span v-if="targetUnitStr" class="absolute right-4 text-xs font-semibold text-stone-400">
              {{ targetUnitStr }}
            </span>
          </div>
        </label>

        <section class="border border-teal-800/15 bg-teal-50 p-3">
          <div class="text-xs font-semibold text-teal-800">New progress</div>
          <div class="mt-2 flex items-center justify-between text-sm font-semibold text-stone-950">
            <div class="flex items-center gap-2">
              <TrendingUp class="size-4 text-teal-800" />
              <span>
                {{ calculatedNewProgress }}
                <span class="text-xs font-medium text-stone-500">/ {{ targetVal }} {{ targetUnitStr }}</span>
              </span>
            </div>
            <span class="text-xs font-semibold text-teal-800">{{ calculatedNewPercentage }}%</span>
          </div>

          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-sm bg-teal-100">
            <div
              class="h-full rounded-sm bg-teal-700 transition-all duration-300"
              :style="{ width: `${calculatedNewPercentage}%` }"
            ></div>
          </div>
        </section>


        <p v-if="errorMessage" class="border border-red-200 bg-red-50 p-2.5 text-sm font-semibold text-red-700">
          {{ errorMessage }}
        </p>

        <div class="flex items-center justify-end gap-2 border-t border-stone-200 pt-3">
          <button
            type="button"
            class="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 active:translate-y-px"
            @click="emit('cancel')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="inline-flex items-center gap-1.5 rounded-md bg-teal-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="saving || amountToAdd <= 0"
          >
            <BarChart2 class="size-4" />
            {{ saving ? 'Adding...' : 'Add progress' }}
          </button>
        </div>
      </form>

      <form v-else class="space-y-4" @submit.prevent="handleSetSubmit">
        <label class="grid gap-2">
          <span class="text-sm font-semibold text-stone-700">Set progress</span>
          <div class="relative flex items-center rounded-md border border-stone-300 bg-white px-3 py-2 transition focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-100">
            <input
              v-model.number="setProgressValue"
              type="number"
              min="0"
              step="any"
              placeholder="0.0"
              class="w-full bg-transparent text-center text-2xl font-semibold tracking-[-0.02em] text-stone-950 outline-none"
            />
            <span v-if="targetUnitStr" class="absolute right-4 text-xs font-semibold text-stone-400">
              {{ targetUnitStr }}
            </span>
          </div>

          <div class="flex justify-between text-xs font-medium text-stone-500">
            <span>0</span>
            <span>Target: {{ targetVal }} {{ targetUnitStr }}</span>
            <span class="font-semibold text-teal-800">{{ setPercentage }}%</span>
          </div>
        </label>

        <section
          :class="[
            'flex items-start gap-3 border p-3 transition',
            setProgressValue >= targetVal
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-teal-800/15 bg-teal-50 text-teal-950',
          ]"
        >
          <div
            :class="[
              'grid size-7 shrink-0 place-items-center rounded-md text-white',
              setProgressValue >= targetVal ? 'bg-emerald-700' : 'bg-teal-800',
            ]"
          >
            <CheckCircle2 v-if="setProgressValue >= targetVal" class="size-4" />
            <Target v-else class="size-4" />
          </div>

          <div class="text-sm">
            <div class="font-semibold">
              {{ setProgressValue >= targetVal ? 'Completed' : 'Not completed yet' }}
            </div>
            <div class="mt-0.5 text-xs font-medium text-stone-500">
              <span v-if="setProgressValue < targetVal">
                {{ remainingToTarget }} {{ targetUnitStr }} remaining to reach your target.
              </span>
              <span v-else>Target reached. The habit will be marked completed.</span>
            </div>
          </div>
        </section>

        <div class="flex items-center gap-2 text-xs font-medium text-stone-500">
          <Info class="size-3.5 shrink-0" />
          <span>If progress reaches the target, the habit is marked completed automatically.</span>
        </div>

        <p v-if="errorMessage" class="border border-red-200 bg-red-50 p-2.5 text-sm font-semibold text-red-700">
          {{ errorMessage }}
        </p>

        <div class="flex items-center justify-end gap-2 border-t border-stone-200 pt-3">
          <button
            type="button"
            class="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 active:translate-y-px"
            @click="emit('cancel')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="inline-flex items-center gap-1.5 rounded-md bg-teal-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="saving"
          >
            <ShieldCheck class="size-4" />
            {{ saving ? 'Saving...' : 'Save progress' }}
          </button>
        </div>
      </form>
    </div>
  </ModalShell>
</template>
