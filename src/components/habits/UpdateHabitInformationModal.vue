<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Dumbbell } from 'lucide-vue-next'
import { getCategories } from '@/api/categoryApi'
import { getHabitDetail, updateBasicHabitInformation } from '@/api/habitApi'
import ModalShell from '@/components/common/ModalShell.vue'
import {
  HABIT_COLORS,
  HABIT_DIFFICULTIES,
  HABIT_ICONS,
  HABIT_TRACKING_TYPES,
  LEGACY_HABIT_ICON_MAP,
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

const props = defineProps({
  habit: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['updated', 'cancel'])

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
})

const categories = ref([])
const loadingCategories = ref(false)
const saving = ref(false)
const loadingHabit = ref(false)
const errorMessage = ref('')
const lastQuantityTargetValue = ref(1)
const lastQuantityTargetUnit = ref('')

const selectedIcon = computed(() => {
  return HABIT_ICONS.find((icon) => icon.key === form.icon)?.component || Dumbbell
})

function getHabitCategoryIds(habit) {
  if (Array.isArray(habit.categoryIds)) return habit.categoryIds
  if (Array.isArray(habit.categories)) return habit.categories.map((category) => category.id)
  return []
}

function normalizeIcon(icon) {
  const normalizedIcon = LEGACY_HABIT_ICON_MAP[icon] || icon
  return HABIT_ICONS.some((option) => option.key === normalizedIcon) ? normalizedIcon : HABIT_ICONS[0].key
}

function normalizeTrackingType(habit) {
  if (habit.trackingType === 'CHECK' || habit.trackingType === 'QUANTITY') return habit.trackingType
  const targetValue = habit.target?.targetValue ?? habit.targetValue
  const targetUnit = habit.target?.targetUnit ?? habit.targetUnit
  return targetValue && targetUnit ? 'QUANTITY' : 'CHECK'
}

function fillForm(habit) {
  const targetValue = habit.target?.targetValue ?? habit.targetValue
  const targetUnit = habit.target?.targetUnit ?? habit.targetUnit

  form.name = habit.name || ''
  form.description = habit.description || ''
  form.color = habit.color || HABIT_COLORS[0]
  form.icon = normalizeIcon(habit.icon)
  form.difficulty = HABIT_DIFFICULTIES.includes(habit.difficulty) ? habit.difficulty : 'EASY'
  form.categoryIds = getHabitCategoryIds(habit)
  form.trackingType = normalizeTrackingType(habit)
  form.targetUnit = targetUnit || ''
  form.targetValue = targetValue === null || targetValue === undefined ? null : Number(targetValue)

  if (form.targetValue && form.targetValue > 0) {
    lastQuantityTargetValue.value = form.targetValue
  }
  if (form.targetUnit) {
    lastQuantityTargetUnit.value = form.targetUnit
  }
}

async function fetchHabitDetail(habit) {
  if (!habit?.id) return

  loadingHabit.value = true
  errorMessage.value = ''

  try {
    const response = await getHabitDetail(habit.id)
    fillForm({ ...habit, ...(response.data || {}) })
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Could not load habit details.'
    fillForm(habit)
  } finally {
    loadingHabit.value = false
  }
}

function setTrackingType(type) {
  if (form.trackingType === 'QUANTITY') {
    if (Number(form.targetValue) > 0) lastQuantityTargetValue.value = Number(form.targetValue)
    if (form.targetUnit.trim()) lastQuantityTargetUnit.value = form.targetUnit
  }

  form.trackingType = type

  if (type === 'QUANTITY') {
    form.targetValue = Number(lastQuantityTargetValue.value || form.targetValue || 1)
    form.targetUnit = lastQuantityTargetUnit.value || form.targetUnit || ''
  }
}

function buildPayload() {
  const isQuantity = form.trackingType === 'QUANTITY'

  return {
    name: form.name.trim(),
    description: form.description.trim(),
    color: form.color,
    icon: form.icon,
    difficulty: form.difficulty,
    categoryIds: form.categoryIds,
    trackingType: form.trackingType,
    targetUnit: isQuantity ? form.targetUnit.trim() : null,
    targetValue: isQuantity ? Number(form.targetValue) : null,
  }
}

function validateForm() {
  if (!form.name.trim()) return 'Name is required.'
  if (!form.color || !form.icon || !form.difficulty || !form.trackingType) {
    return 'Please fill in all required fields.'
  }
  if (form.trackingType === 'QUANTITY') {
    if (!Number(form.targetValue) || Number(form.targetValue) <= 0) return 'Target must be greater than 0.'
    if (!form.targetUnit.trim()) return 'Unit is required for amount tracking.'
  }
  if (!form.categoryIds.length) return 'Please choose at least one category.'
  return ''
}

async function fetchCategories() {
  loadingCategories.value = true

  try {
    const response = await getCategories()
    categories.value = Array.isArray(response.data) ? response.data : response.data?.content || []
  } catch (error) {
    errorMessage.value = error.message || 'Khong the tai danh sach category.'
  } finally {
    loadingCategories.value = false
  }
}

async function submitForm() {
  errorMessage.value = validateForm()
  if (errorMessage.value) return

  saving.value = true

  try {
    const payload = buildPayload()
    const response = await updateBasicHabitInformation(props.habit.id, payload)

    emit('updated', {
      ...props.habit,
      ...payload,
      ...response.data,
    })
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Update habit failed.'
  } finally {
    saving.value = false
  }
}

watch(
  () => props.habit,
  (habit) => fetchHabitDetail(habit),
  { immediate: true },
)

onMounted(fetchCategories)
</script>

<template>
  <ModalShell
    title="Update habit information"
    subtitle="Basic profile, tracking type, categories, color and icon."
    @close="emit('cancel')"
  >
    <form class="grid gap-5 px-5 py-5" @submit.prevent="submitForm">
      <div v-if="loadingHabit" class="border border-teal-100 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">
        Loading habit details...
      </div>

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
      <HabitCategoryPicker v-model="form.categoryIds" :categories="categories" :loading="loadingCategories" />

      <HabitPreview
        :name="form.name"
        :color="form.color"
        :icon="selectedIcon"
        :tracking-type="form.trackingType"
        :target-value="form.targetValue"
        :target-unit="form.targetUnit"
      />

      <p v-if="errorMessage" class="m-0 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
        {{ errorMessage }}
      </p>

      <FormActions :saving="saving || loadingHabit" @cancel="emit('cancel')" />
    </form>
  </ModalShell>
</template>
