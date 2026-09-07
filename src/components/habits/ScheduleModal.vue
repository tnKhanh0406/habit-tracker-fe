<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Calendar, Check, Flame, LoaderCircle, RotateCw } from 'lucide-vue-next'
import ModalShell from '@/components/common/ModalShell.vue'
import { getHabitSchedule, updateHabitSchedule } from '@/api/habitScheduleApi'
import { HABIT_ICONS, LEGACY_HABIT_ICON_MAP } from '@/constants/habitOptions'

const props = defineProps({
  habit: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['updated', 'cancel'])

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const todayStr = new Date().toISOString().split('T')[0]

const form = reactive({
  scheduleType: 'DAILY',
  intervalValue: 1,
  startDate: todayStr,
  endDate: '',
  weekdays: [0],
})

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const getHabitIcon = (iconKey) => {
  const normalized = LEGACY_HABIT_ICON_MAP[iconKey] || iconKey
  const found = HABIT_ICONS.find((icon) => icon.key === normalized)
  return found?.component || Calendar
}

const getTrackingType = (habit) => {
  if (habit.trackingType === 'CHECK' || habit.trackingType === 'QUANTITY') return habit.trackingType
  return habit.targetValue && habit.targetUnit ? 'QUANTITY' : 'CHECK'
}

const isQuantityHabit = (habit) => {
  return getTrackingType(habit) === 'QUANTITY'
}

const getOrdinal = (n) => {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const value = n % 100
  return n + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0])
}

const repeatDescription = computed(() => {
  const type = form.scheduleType
  const interval = Number(form.intervalValue || 1)

  if (type === 'DAILY') {
    return interval === 1 ? 'Repeats every day' : `Repeats every ${interval} days`
  }

  if (type === 'WEEKLY') {
    const selectedDays = (form.weekdays || [])
      .slice()
      .sort((a, b) => a - b)
      .map((day) => WEEKDAY_NAMES[day])

    const dayText = selectedDays.length > 0 ? selectedDays.join(', ') : 'Monday'
    return interval === 1
      ? `Repeats every week on ${dayText}`
      : `Repeats every ${interval} weeks on ${dayText}`
  }

  let dayNum = 1
  let monthName = 'January'

  if (form.startDate) {
    const dateObj = new Date(form.startDate)
    if (!Number.isNaN(dateObj.getTime())) {
      dayNum = dateObj.getDate()
      monthName = MONTH_NAMES[dateObj.getMonth()]
    }
  }

  const ordinalDay = getOrdinal(dayNum)

  if (type === 'MONTHLY') {
    return interval === 1
      ? `Repeats every month on the ${ordinalDay}`
      : `Repeats every ${interval} months on the ${ordinalDay}`
  }

  if (type === 'YEARLY') {
    return interval === 1
      ? `Repeats every year on ${monthName} ${ordinalDay}`
      : `Repeats every ${interval} years on ${monthName} ${ordinalDay}`
  }

  return 'Repeats every day'
})

const toggleWeekday = (dayIndex) => {
  const idx = form.weekdays.indexOf(dayIndex)
  if (idx > -1) {
    if (form.weekdays.length > 1) {
      form.weekdays.splice(idx, 1)
    }
    return
  }

  form.weekdays.push(dayIndex)
  form.weekdays.sort((a, b) => a - b)
}

const formatDateFromApi = (val) => {
  if (!val) return ''
  if (Array.isArray(val)) {
    return `${val[0]}-${String(val[1]).padStart(2, '0')}-${String(val[2]).padStart(2, '0')}`
  }
  return String(val)
}

const fetchScheduleData = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const res = await getHabitSchedule(props.habit.id)
    if (res.data) {
      const data = res.data
      form.scheduleType = data.scheduleType || 'DAILY'
      form.intervalValue = Number(data.intervalValue || 1)
      form.startDate = formatDateFromApi(data.startDate) || todayStr
      form.endDate = formatDateFromApi(data.endDate) || ''
      form.weekdays = Array.isArray(data.weekdays) && data.weekdays.length > 0 ? data.weekdays : [0]
    }
  } catch (err) {
    console.error('Failed to fetch habit schedule:', err)
  } finally {
    loading.value = false
  }
}

const handleSaveSchedule = async () => {
  if (!form.startDate) {
    errorMessage.value = 'Start date is required.'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    const payload = {
      scheduleType: form.scheduleType,
      intervalValue: Number(form.intervalValue || 1),
      startDate: form.startDate,
      endDate: form.endDate || null,
      weekdays: form.scheduleType === 'WEEKLY' ? form.weekdays : [],
    }

    const res = await updateHabitSchedule(props.habit.id, payload)
    emit('updated', res?.data || payload)
    emit('cancel')
  } catch (err) {
    console.error('Failed to update habit schedule:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Failed to update schedule.'
  } finally {
    saving.value = false
  }
}

onMounted(fetchScheduleData)
</script>

<template>
  <ModalShell
    title="Habit schedule"
    subtitle="Configure how often and when this habit repeats."
    @close="emit('cancel')"
  >
    <div class="space-y-4 p-5">
      <section class="border-y border-stone-200 bg-stone-50/60 py-3">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="grid size-10 shrink-0 place-items-center rounded-md text-white"
              :style="{ backgroundColor: habit.color || '#0f766e' }"
            >
              <component :is="getHabitIcon(habit.icon)" class="size-5" />
            </div>
            <div class="min-w-0">
              <h4 class="m-0 truncate text-sm font-semibold text-stone-950">{{ habit.name }}</h4>
              <p class="m-0 mt-0.5 text-xs font-medium text-stone-500">
                <span v-if="isQuantityHabit(habit)">
                  {{ habit.progress || 0 }} / {{ habit.targetValue || 0 }} {{ habit.targetUnit || '' }}
                </span>
                <span v-else>Completion habit</span>
              </p>
            </div>
          </div>

          <div v-if="habit.currentStreak" class="flex items-center gap-1 text-xs font-semibold text-red-700">
            <Flame class="size-3.5 fill-red-600 text-red-600" />
            <span>{{ habit.currentStreak }}</span>
          </div>
        </div>
      </section>

      <div v-if="loading" class="py-6 text-center text-sm font-medium text-stone-500">
        Loading schedule...
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSaveSchedule">
        <fieldset class="grid gap-2">
          <legend class="text-sm font-semibold text-stone-700">Repeat frequency</legend>
          <div class="grid grid-cols-2 gap-1.5 rounded-md bg-stone-100 p-1 text-xs font-medium sm:grid-cols-4">
            <button
              v-for="type in ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']"
              :key="type"
              type="button"
              :class="[
                'rounded-sm py-2 text-center transition active:translate-y-px',
                form.scheduleType === type ? 'bg-white text-teal-900 shadow-sm' : 'text-stone-500 hover:text-stone-900',
              ]"
              @click="form.scheduleType = type"
            >
              {{ type.toLowerCase() }}
            </button>
          </div>
        </fieldset>

        <label class="grid gap-1.5">
          <span class="text-sm font-semibold text-stone-700">
            Interval
          </span>
          <div class="relative flex items-center rounded-md border border-stone-300 bg-white px-3 py-2 transition focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-100">
            <input
              v-model.number="form.intervalValue"
              type="number"
              min="1"
              step="1"
              class="w-full bg-transparent text-sm font-semibold text-stone-900 outline-none"
            />
            <span class="text-xs font-semibold text-stone-400">
              {{ form.scheduleType === 'DAILY' ? 'day(s)' : form.scheduleType === 'WEEKLY' ? 'week(s)' : form.scheduleType === 'MONTHLY' ? 'month(s)' : 'year(s)' }}
            </span>
          </div>
        </label>

        <fieldset v-if="form.scheduleType === 'WEEKLY'" class="grid gap-2">
          <legend class="text-sm font-semibold text-stone-700">Repeat on days</legend>
          <div class="grid grid-cols-7 gap-1.5">
            <button
              v-for="(shortName, dayIdx) in WEEKDAY_SHORT"
              :key="dayIdx"
              type="button"
              :class="[
                'grid h-9 place-items-center rounded-md border text-xs font-semibold transition active:translate-y-px',
                form.weekdays.includes(dayIdx)
                  ? 'border-teal-800 bg-teal-800 text-white'
                  : 'border-stone-300 bg-white text-stone-600 hover:border-teal-300',
              ]"
              @click="toggleWeekday(dayIdx)"
            >
              {{ shortName }}
            </button>
          </div>
        </fieldset>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="grid gap-1.5">
            <span class="text-sm font-semibold text-stone-700">Start date</span>
            <input
              v-model="form.startDate"
              type="date"
              required
              class="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <label class="grid gap-1.5">
            <span class="text-sm font-semibold text-stone-700">End date</span>
            <input
              v-model="form.endDate"
              type="date"
              class="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>
        </div>

        <section class="flex items-start gap-3 border border-teal-800/15 bg-teal-50 p-3 text-teal-950">
          <div class="grid size-8 shrink-0 place-items-center rounded-md bg-teal-800 text-white">
            <RotateCw class="size-4" />
          </div>
          <div>
            <div class="text-sm font-semibold">Schedule summary</div>
            <div class="mt-0.5 text-sm font-medium text-teal-900">{{ repeatDescription }}</div>
          </div>
        </section>

        <p v-if="errorMessage" class="m-0 border border-red-200 bg-red-50 p-2.5 text-sm font-semibold text-red-700">
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
            <LoaderCircle v-if="saving" class="size-4 animate-spin" />
            <Check v-else class="size-4" />
            {{ saving ? 'Saving...' : 'Save schedule' }}
          </button>
        </div>
      </form>
    </div>
  </ModalShell>
</template>
