<script setup>
import { onMounted, ref } from 'vue'
import { Bell, LoaderCircle, Plus, Trash2 } from 'lucide-vue-next'
import ModalShell from '@/components/common/ModalShell.vue'
import { getTodoReminders, updateTodoReminders } from '@/api/todoApi'

const props = defineProps({
  todo: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['updated', 'cancel'])

const reminders = ref([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const formatDateTimeForInput = (value) => {
  if (!value) return ''
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0] = value
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  return String(value).slice(0, 16)
}

const formatDateTimeForApi = (value) => {
  if (!value) return value
  return value.length === 16 ? `${value}:00` : value
}

const formatDateTimeDisplay = (value) => {
  if (!value) return 'Choose date and time'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.replace('T', ' ')
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

const fetchReminders = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getTodoReminders(props.todo.id)
    reminders.value = Array.isArray(response.data)
      ? response.data.map((reminder) => ({
        id: reminder.id || null,
        reminderTime: formatDateTimeForInput(reminder.reminderTime),
        enabled: reminder.enabled !== false,
      }))
      : []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Could not load todo reminders.'
  } finally {
    loading.value = false
  }
}

const addReminder = () => {
  const now = new Date()
  now.setSeconds(0, 0)
  const localValue = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  reminders.value.push({ id: null, reminderTime: localValue, enabled: true })
}

const removeReminder = (index) => {
  reminders.value.splice(index, 1)
}

const saveReminders = async () => {
  if (reminders.value.some((reminder) => !reminder.reminderTime)) {
    errorMessage.value = 'Every reminder must have a date and time.'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    const requests = reminders.value.map((reminder) => ({
      id: reminder.id,
      reminderTime: formatDateTimeForApi(reminder.reminderTime),
      enabled: Boolean(reminder.enabled),
    }))
    await updateTodoReminders(props.todo.id, requests)
    emit('updated', requests)
    emit('cancel')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Could not save todo reminders.'
  } finally {
    saving.value = false
  }
}

onMounted(fetchReminders)
</script>

<template>
  <ModalShell
    title="Todo reminders"
    subtitle="Choose when this todo should remind you."
    @close="emit('cancel')"
  >
    <div class="grid gap-4 px-5 py-5">
      <div class="flex items-center gap-3 border-y border-stone-200 bg-stone-50/60 py-3">
        <div class="grid size-10 place-items-center rounded-md bg-sky-50 text-sky-800">
          <Bell class="size-5" />
        </div>
        <div class="min-w-0">
          <h3 class="m-0 truncate text-sm font-semibold text-stone-950">{{ todo.title }}</h3>
          <p class="m-0 mt-0.5 text-xs font-medium text-stone-500">{{ reminders.length }} reminder{{ reminders.length === 1 ? '' : 's' }}</p>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center gap-2 py-8 text-sm font-medium text-stone-500">
        <LoaderCircle class="size-4 animate-spin" />
        Loading reminders...
      </div>

      <div v-else class="grid gap-2.5">
        <div
          v-for="(reminder, index) in reminders"
          :key="reminder.id || index"
          class="grid gap-3 rounded-md border border-stone-300 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
        >
          <div class="grid gap-1">
            <input
              v-model="reminder.reminderTime"
              type="datetime-local"
              class="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-sky-700 focus:ring-2 focus:ring-sky-100"
            />
            <span class="text-xs font-medium text-stone-500">{{ formatDateTimeDisplay(reminder.reminderTime) }}</span>
          </div>

          <div class="flex items-center justify-between gap-3 sm:justify-end">
            <label class="inline-flex items-center gap-2 text-sm font-medium text-stone-700">
              <input v-model="reminder.enabled" type="checkbox" />
              Enabled
            </label>
            <button
              type="button"
              class="grid size-8 place-items-center rounded-md border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
              aria-label="Remove reminder"
              @click="removeReminder(index)"
            >
              <Trash2 class="size-4" />
            </button>
          </div>
        </div>

        <p v-if="!reminders.length" class="border border-dashed border-stone-300 py-6 text-center text-sm font-medium text-stone-500">
          No reminders configured yet.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-sky-700/40 bg-sky-50 py-2.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
        @click="addReminder"
      >
        <Plus class="size-4" />
        Add reminder
      </button>

      <p v-if="errorMessage" class="m-0 border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
        {{ errorMessage }}
      </p>

      <footer class="flex justify-end gap-2 border-t border-stone-200 pt-4">
        <button
          type="button"
          class="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-md bg-sky-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading || saving"
          @click="saveReminders"
        >
          <LoaderCircle v-if="saving" class="size-4 animate-spin" />
          <Bell v-else class="size-4" />
          {{ saving ? 'Saving...' : 'Save reminders' }}
        </button>
      </footer>
    </div>
  </ModalShell>
</template>