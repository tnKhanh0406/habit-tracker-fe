<script setup>
import { computed, reactive, ref } from 'vue'
import { Dumbbell } from 'lucide-vue-next'
import { createHabit } from '@/api/habitApi'
import ModalShell from '@/components/common/ModalShell.vue'
import {
  HABIT_COLORS,
  HABIT_DIFFICULTIES,
  HABIT_ICONS,
  HABIT_TRACKING_TYPES,
} from '@/constants/habitOptions'
import FormActions from './form/FormActions.vue'
import HabitCategoryPicker from './form/HabitCategoryPicker.vue'
import HabitColorPicker from './form/HabitColorPicker.vue'
import HabitDescriptionField from './form/HabitDescriptionField.vue'
import HabitDifficultySelect from './form/HabitDifficultySelect.vue'
import HabitIconPicker from './form/HabitIconPicker.vue'
import HabitNameField from './form/HabitNameField.vue'
import HabitPreview from './form/HabitPreview.vue'
import HabitTargetFields from './form/HabitTargetFields.vue'
import HabitTrackingTypeSelect from './form/HabitTrackingTypeSelect.vue'

const emit = defineEmits(['created', 'cancel'])

const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  loadingCategories: {
    type: Boolean,
    default: false,
  },
})

const today = new Date().toISOString().split('T')[0]
const form = reactive({
  name: '',
  description: '',
  color: HABIT_COLORS[0],
  icon: HABIT_ICONS[0].key,
  difficulty: 'EASY',
  categoryIds: [],
  trackingType: 'CHECK',
  targetUnit: '',
  targetValue: null,
  scheduleType: 'DAILY',
  intervalValue: 1,
  startDate: today,
  endDate: '',
  weekdays: [0],
  reminders: [],
})

const saving = ref(false)
const errorMessage = ref('')

const selectedIcon = computed(() => {
  return HABIT_ICONS.find((icon) => icon.key === form.icon)?.component || Dumbbell
})

const setTrackingType = (type) => {
  form.trackingType = type
  if (type === 'CHECK') {
    form.targetUnit = ''
    form.targetValue = null
  } else if (!form.targetValue) {
    form.targetValue = 1
  }
}

const addReminder = () => {
  form.reminders.push({ reminderTime: '08:00:00', enabled: true })
}

const removeReminder = (index) => {
  form.reminders.splice(index, 1)
}

const validateForm = () => {
  if (!form.name.trim()) return 'Name is required.'
  if (!form.color || !form.icon || !form.difficulty || !form.trackingType) {
    return 'Please fill in all required fields.'
  }
  if (!form.startDate) return 'Start date is required.'
  if (form.trackingType === 'QUANTITY') {
    if (!Number(form.targetValue) || Number(form.targetValue) <= 0) return 'Target must be greater than 0.'
    if (!form.targetUnit.trim()) return 'Unit is required for amount tracking.'
  }
  return ''
}

const submitForm = async () => {
  errorMessage.value = validateForm()
  if (errorMessage.value) return

  saving.value = true
  try {
    const isQuantity = form.trackingType === 'QUANTITY'
    const payload = {
      basicHabitInformation: {
        name: form.name.trim(),
        description: form.description.trim(),
        color: form.color,
        icon: form.icon,
        difficulty: form.difficulty,
        trackingType: form.trackingType,
        categoryIds: form.categoryIds,
        targetUnit: isQuantity ? form.targetUnit.trim() : null,
        targetValue: isQuantity ? Number(form.targetValue) : null,
      },
      schedule: {
        scheduleType: form.scheduleType,
        intervalValue: Number(form.intervalValue || 1),
        startDate: form.startDate,
        endDate: form.endDate || null,
        weekdays: form.scheduleType === 'WEEKLY' ? form.weekdays : [],
      },
      reminders: form.reminders.map((reminder) => ({
        id: null,
        reminderTime: reminder.reminderTime.length === 5 ? `${reminder.reminderTime}:00` : reminder.reminderTime,
        enabled: Boolean(reminder.enabled),
      })),
    }

    const response = await createHabit(payload)
    emit('created', response.data)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Create habit failed.'
  } finally {
    saving.value = false
  }
}

</script>

<template>
  <ModalShell
    title="Create habit"
    subtitle="Set up the habit, repeat schedule and optional reminders."
    @close="emit('cancel')"
  >
    <form class="grid gap-5 px-5 py-5" @submit.prevent="submitForm">
      <div class="grid gap-4 md:grid-cols-2">
        <HabitNameField v-model="form.name" />
        <HabitDifficultySelect v-model="form.difficulty" :difficulties="HABIT_DIFFICULTIES" />
      </div>

      <HabitDescriptionField v-model="form.description" />
      <HabitTrackingTypeSelect
        :model-value="form.trackingType"
        :options="HABIT_TRACKING_TYPES"
        @update:model-value="setTrackingType"
      />
      <HabitTargetFields
        v-if="form.trackingType === 'QUANTITY'"
        v-model:target-value="form.targetValue"
        v-model:target-unit="form.targetUnit"
      />
      <HabitColorPicker v-model="form.color" :colors="HABIT_COLORS" />
      <HabitIconPicker v-model="form.icon" :icons="HABIT_ICONS" />
      <HabitCategoryPicker v-model="form.categoryIds" :categories="props.categories" :loading="props.loadingCategories" />

      <fieldset class="grid gap-3 border-t border-stone-200 pt-4">
        <legend class="text-sm font-semibold text-stone-700">Schedule</legend>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1.5">
            <span class="text-xs font-semibold text-stone-600">Repeat</span>
            <select v-model="form.scheduleType" class="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 outline-none focus:border-teal-700">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </label>
          <label class="grid gap-1.5">
            <span class="text-xs font-semibold text-stone-600">Interval</span>
            <input v-model.number="form.intervalValue" type="number" min="1" class="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 outline-none focus:border-teal-700" />
          </label>
          <label class="grid gap-1.5">
            <span class="text-xs font-semibold text-stone-600">Start date</span>
            <input v-model="form.startDate" type="date" class="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 outline-none focus:border-teal-700" />
          </label>
          <label class="grid gap-1.5">
            <span class="text-xs font-semibold text-stone-600">End date <span class="font-normal text-stone-400">(optional)</span></span>
            <input v-model="form.endDate" type="date" class="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 outline-none focus:border-teal-700" />
          </label>
        </div>
        <div v-if="form.scheduleType === 'WEEKLY'" class="grid grid-cols-7 gap-1.5">
          <button
            v-for="(day, index) in ['M', 'T', 'W', 'T', 'F', 'S', 'S']"
            :key="`${day}-${index}`"
            type="button"
            :class="['grid h-9 place-items-center rounded-md border text-xs font-semibold', form.weekdays.includes(index) ? 'border-teal-800 bg-teal-800 text-white' : 'border-stone-300 bg-white text-stone-600']"
            @click="form.weekdays = form.weekdays.includes(index) ? (form.weekdays.length > 1 ? form.weekdays.filter((dayIndex) => dayIndex !== index) : form.weekdays) : [...form.weekdays, index].sort((a, b) => a - b)"
          >
            {{ day }}
          </button>
        </div>
      </fieldset>

      <fieldset class="grid gap-2 border-t border-stone-200 pt-4">
        <div class="flex items-center justify-between gap-3">
          <legend class="text-sm font-semibold text-stone-700">Reminders <span class="font-normal text-stone-400">(optional)</span></legend>
          <button type="button" class="inline-flex items-center rounded-md border border-teal-700/40 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50" @click="addReminder">Add reminder</button>
        </div>
        <div v-for="(reminder, index) in form.reminders" :key="index" class="flex items-center gap-2">
          <input v-model="reminder.reminderTime" type="time" class="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 outline-none focus:border-teal-700" />
          <label class="inline-flex items-center gap-1.5 text-sm font-medium text-stone-700">
            <input v-model="reminder.enabled" type="checkbox" /> Enabled
          </label>
          <button type="button" class="ml-auto text-sm font-semibold text-red-700 hover:text-red-900" @click="removeReminder(index)">Remove</button>
        </div>
      </fieldset>

      <HabitPreview
        :name="form.name"
        :color="form.color"
        :icon="selectedIcon"
        :tracking-type="form.trackingType"
        :target-value="form.targetValue"
        :target-unit="form.targetUnit"
      />

      <p v-if="errorMessage" class="m-0 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{{ errorMessage }}</p>
      <FormActions :saving="saving || props.loadingCategories" @cancel="emit('cancel')" />
    </form>
  </ModalShell>
</template>
