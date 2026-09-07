<script setup>
import { ref, onMounted } from 'vue'
import { 
  Bell, 
  Clock, 
  Trash2, 
  Plus, 
  Flame
} from 'lucide-vue-next'
import ModalShell from '@/components/common/ModalShell.vue'
import { getReminders, updateReminders } from '@/api/reminderApi'
import { HABIT_ICONS, LEGACY_HABIT_ICON_MAP } from '@/constants/habitOptions'

const props = defineProps({
  habit: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['updated', 'cancel'])

const reminders = ref([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

// Helper for habit icon
const getHabitIcon = (iconKey) => {
  const normalized = LEGACY_HABIT_ICON_MAP[iconKey] || iconKey
  const found = HABIT_ICONS.find(i => i.key === normalized)
  return found?.component || Bell
}

const getTrackingType = (habit) => {
  if (habit.trackingType === 'CHECK' || habit.trackingType === 'QUANTITY') return habit.trackingType
  return habit.targetValue && habit.targetUnit ? 'QUANTITY' : 'CHECK'
}

const isQuantityHabit = (habit) => {
  return getTrackingType(habit) === 'QUANTITY'
}

// Fetch reminders for the habit on mount
const fetchRemindersData = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getReminders(props.habit.id)
    if (Array.isArray(res.data)) {
      reminders.value = res.data.map(r => ({
        id: r.id || null,
        time: formatTimeForInput(r.reminderTime || r.time || '08:00'),
        enabled: r.enabled !== undefined ? r.enabled : true
      }))
    } else {
      reminders.value = []
    }
  } catch (err) {
    console.error('Failed to fetch reminders:', err)
    reminders.value = []
  } finally {
    loading.value = false
  }
}

const formatTimeForInput = (timeStr) => {
  if (!timeStr) return '08:00'
  if (Array.isArray(timeStr)) {
    const h = String(timeStr[0]).padStart(2, '0')
    const m = String(timeStr[1]).padStart(2, '0')
    return `${h}:${m}`
  }
  return String(timeStr).substring(0, 5)
}

const formatTimeDisplay = (time24) => {
  if (!time24) return '08:00 AM'
  const [hStr, mStr] = time24.split(':')
  let h = parseInt(hStr, 10)
  const m = mStr || '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  h = h ? h : 12
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`
}

const addReminderRow = () => {
  reminders.value.push({
    id: null,
    time: '08:00',
    enabled: true
  })
}

const removeReminderRow = (index) => {
  reminders.value.splice(index, 1)
}

const toggleReminderStatus = (reminder) => {
  reminder.enabled = !reminder.enabled
}

const handleSaveReminders = async () => {
  saving.value = true
  errorMessage.value = ''
  try {
    const requests = reminders.value.map(r => ({
      id: r.id || null,
      reminderTime: r.time.length === 5 ? `${r.time}:00` : r.time,
      enabled: Boolean(r.enabled)
    }))
    
    const res = await updateReminders(props.habit.id, requests)
    emit('updated', res.data)
    emit('cancel')
  } catch (err) {
    console.error('Failed to save reminders:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Failed to save reminders.'
  } finally {
    saving.value = false
  }
}

onMounted(fetchRemindersData)
</script>

<template>
  <ModalShell
    title="Habit reminders"
    subtitle="Manage reminder times for this habit."
    @close="emit('cancel')"
  >
    <div class="space-y-4 p-5">
      
      <!-- Habit Summary Box at Top of Modal -->
      <div class="flex items-center justify-between gap-3 border-y border-stone-200 bg-stone-50/60 py-3">
        <div class="flex items-center gap-3">
          <div
            class="grid size-10 shrink-0 place-items-center rounded-md text-white"
            :style="{ backgroundColor: habit.color || '#0f766e' }"
          >
            <component :is="getHabitIcon(habit.icon)" class="h-5 w-5" />
          </div>
          <div>
            <h4 class="text-sm font-semibold text-stone-950">{{ habit.name }}</h4>
            <div class="mt-0.5 flex items-center gap-2 text-xs font-medium text-stone-500">
              <span v-if="isQuantityHabit(habit)">
                {{ habit.progress || 0 }} / {{ habit.targetValue || 0 }} {{ habit.targetUnit || '' }}
              </span>
              <span v-else>Completion habit</span>
            </div>
          </div>
        </div>

        <div v-if="habit.currentStreak" class="flex items-center gap-1 text-xs font-semibold text-red-700">
          <Flame class="size-3.5 text-red-600" />
          <span>{{ habit.currentStreak }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-6 text-center text-sm font-medium text-stone-500">
        Loading reminders...
      </div>

      <!-- Reminders List -->
      <div v-else class="max-h-60 space-y-2.5 overflow-y-auto pr-1">
        
        <div
          v-for="(reminder, idx) in reminders"
          :key="reminder.id || idx"
          class="flex items-center justify-between gap-3 rounded-md border border-stone-300 bg-white p-3 transition hover:border-teal-300"
        >
          <!-- Left: Clock Icon + Time Input & Display -->
          <div class="flex items-center gap-3">
            <div class="grid size-8 place-items-center rounded-md bg-teal-50 text-teal-800">
              <Clock class="size-4" />
            </div>

            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <input
                  v-model="reminder.time"
                  type="time"
                  class="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm font-semibold text-stone-800 transition focus:border-teal-700 focus:outline-none"
                />
                <span class="text-sm font-semibold text-teal-800">
                  {{ formatTimeDisplay(reminder.time) }}
                </span>
              </div>
              <span class="mt-0.5 text-xs font-medium text-stone-500">Follows habit schedule</span>
            </div>
          </div>

          <!-- Right: Toggle Switch & Delete Action -->
          <div class="flex items-center gap-3">
            <!-- Toggle Switch -->
            <button
              type="button"
              @click="toggleReminderStatus(reminder)"
              :class="[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                reminder.enabled ? 'bg-teal-800' : 'bg-stone-300'
              ]"
            >
              <span
                :class="[
                  'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  reminder.enabled ? 'translate-x-5' : 'translate-x-0'
                ]"
              />
            </button>

            <!-- Delete Button -->
            <button
              type="button"
              @click="removeReminderRow(idx)"
              class="grid size-8 place-items-center rounded-md border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
              title="Delete reminder"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div v-if="reminders.length === 0" class="border border-dashed border-stone-300 py-6 text-center text-sm font-medium text-stone-500">
          No reminders configured yet.
        </div>

      </div>

      <!-- Add Reminder Button (Dashed) -->
      <button
        type="button"
        @click="addReminderRow"
        class="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-teal-700/40 bg-teal-50 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-100 active:translate-y-px"
      >
        <Plus class="h-4 w-4" />
        Add reminder
      </button>

      <!-- Error Message -->
      <p v-if="errorMessage" class="border border-red-200 bg-red-50 p-2.5 text-sm font-semibold text-red-700">
        {{ errorMessage }}
      </p>

      <!-- Modal Actions Footer -->
      <div class="flex items-center justify-end gap-2 border-t border-stone-200 pt-3">
        <button
          type="button"
          @click="emit('cancel')"
          class="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 active:translate-y-px"
        >
          Done
        </button>

        <button
          type="button"
          @click="handleSaveReminders"
          :disabled="saving"
          class="inline-flex items-center gap-1.5 rounded-md bg-teal-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 active:translate-y-px disabled:opacity-50"
        >
          <Plus class="h-4 w-4" />
          {{ saving ? 'Saving...' : 'Save reminders' }}
        </button>
      </div>

    </div>
  </ModalShell>
</template>
