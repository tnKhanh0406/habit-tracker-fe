<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  Activity,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Flame,
  Info,
  MoreVertical,
  Plus,
  Send,
  Trash2,
} from 'lucide-vue-next'
import { createHabitWithName, deleteHabit } from '@/api/habitApi'
import { updateCompletion } from '@/api/habitCheckinApi'
import { HABIT_ICONS, LEGACY_HABIT_ICON_MAP } from '@/constants/habitOptions'
import DeleteHabitConfirmModal from '@/components/habits/DeleteHabitConfirmModal.vue'

const props = defineProps({
  habits: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'habit-created',
  'habit-updated',
  'open-checkin',
  'open-information',
  'open-schedule',
  'open-reminder',
  'habit-deleted',
])

const activeFilter = ref('All')
const newHabitName = ref('')
const isAdding = ref(false)
const showCompleted = ref(false)
const habitInputRef = ref(null)
const activeMenuHabitId = ref(null)
const habitToDelete = ref(null)
const deletingHabitId = ref(null)
const errorMessage = ref('')

const focusInput = () => {
  habitInputRef.value?.focus()
}

defineExpose({ focusInput })

const handleAddHabit = async () => {
  if (!newHabitName.value.trim() || isAdding.value) return
  isAdding.value = true

  try {
    const res = await createHabitWithName(newHabitName.value.trim())
    emit('habit-created', res.data)
    newHabitName.value = ''
  } catch (err) {
    console.error('Failed to create habit:', err)
  } finally {
    isAdding.value = false
  }
}

const toggleHabitCompletion = async (habit) => {
  try {
    const res = await updateCompletion(habit.id, !habit.completed)
    habit.completed = res.data?.completed ?? !habit.completed
    if (res.data?.currentStreak !== undefined) {
      habit.currentStreak = res.data.currentStreak
    }
    emit('habit-updated', habit)
  } catch (err) {
    console.error('Failed to update habit completion:', err)
  }
}

const toggleHabitMenu = (habitId) => {
  activeMenuHabitId.value = activeMenuHabitId.value === habitId ? null : habitId
}

const closeHabitMenu = () => {
  activeMenuHabitId.value = null
}

const handleDocumentClick = (event) => {
  if (!event.target.closest?.('[data-habit-menu]')) {
    closeHabitMenu()
  }
}

const handleSelectInformation = (habit) => {
  closeHabitMenu()
  emit('open-information', habit)
}

const handleSelectSchedule = (habit) => {
  closeHabitMenu()
  emit('open-schedule', habit)
}

const handleSelectReminder = (habit) => {
  closeHabitMenu()
  emit('open-reminder', habit)
}

const requestDeleteHabit = (habit) => {
  closeHabitMenu()
  habitToDelete.value = habit
}

const closeDeleteHabit = () => {
  if (deletingHabitId.value) return
  habitToDelete.value = null
}

const confirmDeleteHabit = async () => {
  if (!habitToDelete.value || deletingHabitId.value) return
  deletingHabitId.value = habitToDelete.value.id
  errorMessage.value = ''

  try {
    await deleteHabit(habitToDelete.value.id)
    emit('habit-deleted', habitToDelete.value.id)
    habitToDelete.value = null
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Delete habit failed.'
  } finally {
    deletingHabitId.value = null
  }
}

const filteredHabits = computed(() => {
  return props.habits
    .filter((habit) => {
      if (habit.completed && !showCompleted.value) return false
      if (activeFilter.value === 'Due') return habit.isScheduledToday
      if (activeFilter.value === 'Not Due') return !habit.isScheduledToday
      return true
    })
    .sort((firstHabit, secondHabit) => Number(isDueHabit(secondHabit)) - Number(isDueHabit(firstHabit)))
})

const completedHabitsCount = computed(() => {
  return props.habits.filter((habit) => habit.completed).length
})

const getHabitIcon = (iconKey) => {
  if (!iconKey) return Dumbbell
  const normalized = LEGACY_HABIT_ICON_MAP[iconKey] || iconKey
  const found = HABIT_ICONS.find((icon) => icon.key === normalized)
  return found?.component || Dumbbell
}

const calculatePercentage = (progress, targetValue) => {
  if (!targetValue || targetValue <= 0) return 0
  const pct = Math.round((Number(progress || 0) / Number(targetValue)) * 100)
  return Math.min(pct, 100)
}

const getTrackingType = (habit) => {
  if (habit.trackingType === 'CHECK' || habit.trackingType === 'QUANTITY') {
    return habit.trackingType
  }

  return habit.targetValue && habit.targetUnit ? 'QUANTITY' : 'CHECK'
}

const isQuantityHabit = (habit) => {
  return getTrackingType(habit) === 'QUANTITY'
}

const isDueHabit = (habit) => {
  return Boolean(habit.isScheduledToday)
}

const getSoftColor = (color, alpha = 0.12) => {
  const fallback = '15, 118, 110'
  if (!color || !color.startsWith('#')) return `rgba(${fallback}, ${alpha})`

  const hex = color.replace('#', '')
  const normalizedHex = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex

  if (normalizedHex.length !== 6) return `rgba(${fallback}, ${alpha})`

  const red = parseInt(normalizedHex.slice(0, 2), 16)
  const green = parseInt(normalizedHex.slice(2, 4), 16)
  const blue = parseInt(normalizedHex.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const getHabitCardStyle = (habit) => {
  const color = habit.color || '#0f766e'
  const isMuted = !isDueHabit(habit) && !habit.completed

  return {
    backgroundColor: getSoftColor(color, habit.completed ? 0.06 : isMuted ? 0.055 : 0.13),
    borderColor: getSoftColor(color, habit.completed ? 0.12 : isMuted ? 0.12 : 0.26),
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <section class="flex h-full flex-col border border-stone-300/80 bg-[#fbfaf7] p-4">
    <div class="mb-4 flex items-center justify-between gap-3 border-b border-stone-200 pb-3">
      <div class="flex items-center gap-2">
        <Activity class="size-4.5 text-orange-700" />
        <h3 class="m-0 text-base font-semibold tracking-[-0.01em] text-stone-950">Habits</h3>
      </div>

      <div class="flex items-center gap-0.5 rounded-md bg-stone-100 p-0.5 text-xs font-medium">
        <button
          v-for="tab in ['All', 'Due', 'Not Due']"
          :key="tab"
          type="button"
          :class="[
            'whitespace-nowrap rounded-sm px-2.5 py-1 transition active:translate-y-px',
            activeFilter === tab ? 'bg-white text-teal-900 shadow-sm' : 'text-stone-500 hover:text-stone-900',
          ]"
          @click="activeFilter = tab"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <div class="relative mb-2">
      <input
        ref="habitInputRef"
        v-model="newHabitName"
        type="text"
        placeholder="Add a new habit"
        class="h-10 w-full rounded-md border border-stone-300 bg-white pl-3.5 pr-10 text-sm font-medium text-stone-800 placeholder:text-stone-400 transition focus:border-teal-700 focus:outline-none"
        @keyup.enter="handleAddHabit"
      />
      <button
        type="button"
        class="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-sm bg-teal-800 text-white transition hover:bg-teal-700 active:translate-y-[-45%] disabled:cursor-not-allowed disabled:opacity-30"
        :disabled="!newHabitName.trim() || isAdding"
        @click="handleAddHabit"
      >
        <Send class="size-3.5" />
      </button>
    </div>

    <div class="min-h-0 flex-1 space-y-2 overflow-y-auto">
      <article
        v-for="habit in filteredHabits"
        :key="habit.id"
        :class="[
          'relative rounded-md border px-3 py-3 transition hover:shadow-[0_10px_24px_rgba(41,37,36,0.08)]',
          activeMenuHabitId === habit.id && 'z-30',
          !isDueHabit(habit) && !habit.completed && 'opacity-55 hover:opacity-75',
          habit.completed && 'opacity-65',
        ]"
        :style="getHabitCardStyle(habit)"
      >
        <div class="grid grid-cols-[44px_minmax(0,1fr)_76px_32px] items-start gap-3">
          <div
            class="grid size-11 shrink-0 place-items-center rounded-md text-white shadow-[0_12px_24px_rgba(41,37,36,0.12)]"
            :style="{ backgroundColor: habit.color || '#0f766e' }"
          >
            <component :is="getHabitIcon(habit.icon)" class="size-5" />
          </div>

          <div class="min-w-0">
            <h4
              :class="[
                'm-0 break-words text-sm font-semibold leading-snug text-stone-950',
                habit.completed && 'text-stone-400 line-through',
                !isDueHabit(habit) && !habit.completed && 'text-stone-600',
              ]"
            >
              {{ habit.name }}
            </h4>

            <span
              v-if="isDueHabit(habit)"
              class="mt-1.5 inline-flex items-center gap-1 whitespace-nowrap rounded-sm border border-teal-800/15 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800"
            >
              <Calendar class="size-3.5" />
              Due today
            </span>

            <p v-if="!isQuantityHabit(habit)" class="m-0 mt-2 text-xs font-medium text-stone-600">
              {{ habit.completed ? 'Completed' : 'Completion habit' }}
            </p>

            <div v-if="isQuantityHabit(habit)" class="mt-3 space-y-1.5">
              <div class="flex items-center justify-between gap-3 text-xs font-medium text-stone-600">
                <span>
                  <strong class="text-base font-semibold tracking-[-0.01em] text-teal-900">
                    {{ habit.progress || 0 }}
                  </strong>
                  / {{ habit.targetValue || 0 }} {{ habit.targetUnit || '' }}
                </span>
                <span>{{ calculatePercentage(habit.progress, habit.targetValue) }}%</span>
              </div>

              <div class="h-1.5 w-full overflow-hidden rounded-sm bg-stone-200">
                <div
                  class="h-full rounded-sm bg-teal-700 transition-all duration-300"
                  :style="{ width: `${calculatePercentage(habit.progress, habit.targetValue)}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="flex min-h-16 flex-col items-end justify-between gap-2">
            <div
              v-if="habit.currentStreak !== undefined && habit.currentStreak !== null"
              class="inline-flex min-h-5 items-center justify-center gap-1 text-xs font-semibold text-red-700"
            >
              <Flame class="size-3.5 fill-red-600 text-red-600" />
              <span>{{ habit.currentStreak }}</span>
            </div>
            <span v-else class="min-h-5"></span>

            <div class="grid grid-cols-[2rem_2.25rem] items-center justify-end gap-2">
              <button
                v-if="isQuantityHabit(habit)"
                type="button"
                class="grid size-8 place-items-center rounded-md border border-stone-300 bg-white text-stone-600 transition hover:border-teal-700 hover:text-teal-800 active:translate-y-px"
                aria-label="Update habit progress"
                @click="emit('open-checkin', habit)"
              >
                <Plus class="size-4" />
              </button>
              <span v-else class="size-8"></span>

              <button
                type="button"
                :class="[
                  'grid size-9 place-items-center rounded-md text-white transition active:translate-y-px',
                  habit.completed ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-teal-800 hover:bg-teal-700',
                ]"
                :aria-label="habit.completed ? 'Mark habit incomplete' : 'Mark habit complete'"
                @click="toggleHabitCompletion(habit)"
              >
                <Check class="size-5 stroke-[2.6]" />
              </button>
            </div>
          </div>

          <div class="relative" data-habit-menu>
            <button
              type="button"
              class="grid size-8 place-items-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-stone-900 active:translate-y-px"
              aria-label="Habit actions"
              @click.stop="toggleHabitMenu(habit.id)"
            >
              <MoreVertical :size="17" />
            </button>

            <div
              v-if="activeMenuHabitId === habit.id"
              class="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-md border border-stone-200 bg-white py-1 shadow-[0_16px_40px_rgba(41,37,36,0.14)]"
            >
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:text-stone-950"
                @click="handleSelectInformation(habit)"
              >
                <Info :size="16" class="text-teal-800" />
                Information
              </button>
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:text-stone-950"
                @click="handleSelectSchedule(habit)"
              >
                <Clock :size="16" class="text-teal-800" />
                Schedule
              </button>
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:text-stone-950"
                @click="handleSelectReminder(habit)"
              >
                <Bell :size="16" class="text-teal-800" />
                Reminder
              </button>
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
                @click="requestDeleteHabit(habit)"
              >
                <Trash2 :size="16" />
                Delete habit
              </button>
            </div>
          </div>
        </div>
      </article>

      <div v-if="filteredHabits.length === 0" class="py-10 text-center text-sm font-medium text-stone-500">
        No habits match this view.
      </div>
    </div>

    <p v-if="errorMessage" class="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
      {{ errorMessage }}
    </p>

    <div v-if="completedHabitsCount > 0" class="mt-3 border-t border-stone-200 pt-3">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 transition hover:text-teal-800 active:translate-y-px"
        @click="showCompleted = !showCompleted"
      >
        <span>{{ showCompleted ? 'Hide completed' : 'Show completed' }} ({{ completedHabitsCount }})</span>
        <component :is="showCompleted ? ChevronUp : ChevronDown" class="size-4" />
      </button>
    </div>

    <DeleteHabitConfirmModal
      v-if="habitToDelete"
      :habit="habitToDelete"
      :deleting="deletingHabitId === habitToDelete.id"
      @confirm="confirmDeleteHabit"
      @cancel="closeDeleteHabit"
    />
  </section>
</template>
