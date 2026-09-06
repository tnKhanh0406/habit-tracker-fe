<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Dumbbell } from 'lucide-vue-next'
import { getCategories } from '@/api/categoryApi'
import { updateBasicHabitInformation } from '@/api/habitApi'
import ModalShell from '@/components/common/ModalShell.vue'
import {
  HABIT_COLORS,
  HABIT_DIFFICULTIES,
  HABIT_ICONS,
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
  targetUnit: '',
  targetValue: 1,
})

const categories = ref([])
const loadingCategories = ref(false)
const saving = ref(false)
const errorMessage = ref('')

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

function fillForm(habit) {
  form.name = habit.name || ''
  form.description = habit.description || ''
  form.color = habit.color || HABIT_COLORS[0]
  form.icon = normalizeIcon(habit.icon)
  form.difficulty = HABIT_DIFFICULTIES.includes(habit.difficulty) ? habit.difficulty : 'EASY'
  form.categoryIds = getHabitCategoryIds(habit)
  form.targetUnit = habit.targetUnit || ''
  form.targetValue = Number(habit.targetValue || 1)
}

function buildPayload() {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    color: form.color,
    icon: form.icon,
    difficulty: form.difficulty,
    categoryIds: form.categoryIds,
    targetUnit: form.targetUnit.trim(),
    targetValue: Number(form.targetValue),
  }
}

function validateForm() {
  if (!form.name.trim()) return 'Name is required.'
  if (!form.color || !form.icon || !form.difficulty || !form.targetUnit.trim()) {
    return 'Please fill in all required fields.'
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
  (habit) => fillForm(habit),
  { immediate: true },
)

onMounted(fetchCategories)
</script>

<template>
  <ModalShell
    title="Update habit information"
    subtitle="Basic profile, target, categories, color and icon."
    @close="emit('cancel')"
  >
    <form class="grid gap-5 px-5 py-5" @submit.prevent="submitForm">
      <div class="grid gap-4 md:grid-cols-2">
        <HabitNameField v-model="form.name" />
        <HabitTargetFields v-model:target-value="form.targetValue" v-model:target-unit="form.targetUnit" />
      </div>

      <HabitDescriptionField v-model="form.description" />
      <HabitColorPicker v-model="form.color" :colors="HABIT_COLORS" />
      <HabitIconPicker v-model="form.icon" :icons="HABIT_ICONS" />
      <HabitDifficultySelect v-model="form.difficulty" :difficulties="HABIT_DIFFICULTIES" />
      <HabitCategoryPicker v-model="form.categoryIds" :categories="categories" :loading="loadingCategories" />

      <HabitPreview
        :name="form.name"
        :color="form.color"
        :icon="selectedIcon"
        :target-value="form.targetValue"
        :target-unit="form.targetUnit"
      />

      <p v-if="errorMessage" class="m-0 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
        {{ errorMessage }}
      </p>

      <FormActions :saving="saving" @cancel="emit('cancel')" />
    </form>
  </ModalShell>
</template>
