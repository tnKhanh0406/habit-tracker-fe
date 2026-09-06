<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { Calendar, Clock, FileText } from 'lucide-vue-next'
import { getCategories } from '@/api/categoryApi'
import { updateTodo } from '@/api/todoApi'
import ModalShell from '@/components/common/ModalShell.vue'
import FormActions from '@/components/habits/form/FormActions.vue'
import HabitCategoryPicker from '@/components/habits/form/HabitCategoryPicker.vue'
import HabitDifficultySelect from '@/components/habits/form/HabitDifficultySelect.vue'
import TodoSubtasksEditor from '@/components/todos/TodoSubtasksEditor.vue'
import { HABIT_DIFFICULTIES } from '@/constants/habitOptions'

const props = defineProps({
  todo: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['updated', 'cancel'])

const form = reactive({
  title: '',
  description: '',
  dueDate: '',
  dueTime: '',
  difficulty: 'EASY',
  categoryIds: [],
  subtasks: [],
})

const categories = ref([])
const loadingCategories = ref(false)
const saving = ref(false)
const errorMessage = ref('')

function toDateInput(value) {
  if (!value) return ''
  if (Array.isArray(value)) {
    return `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`
  }
  return String(value).slice(0, 10)
}

function toTimeInput(value) {
  if (!value) return ''
  if (Array.isArray(value)) {
    return `${String(value[0]).padStart(2, '0')}:${String(value[1]).padStart(2, '0')}`
  }
  return String(value).slice(0, 5)
}

function toApiTime(value) {
  if (!value) return value
  return value.length === 5 ? `${value}:00` : value
}

function getTodoCategoryIds(todo) {
  if (Array.isArray(todo.categoryIds)) return todo.categoryIds
  if (Array.isArray(todo.categories)) return todo.categories.map((category) => category.id)
  return []
}

function normalizeSubtasks(subtasks) {
  if (!Array.isArray(subtasks)) return []
  return subtasks
    .slice()
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .map((subtask, position) => ({
      id: subtask.id || null,
      title: subtask.title || '',
      completed: Boolean(subtask.completed),
      position,
    }))
}

function fillForm(todo) {
  form.title = todo.title || ''
  form.description = todo.description || ''
  form.dueDate = toDateInput(todo.dueDate)
  form.dueTime = toTimeInput(todo.dueTime)
  form.difficulty = HABIT_DIFFICULTIES.includes(todo.difficulty) ? todo.difficulty : 'EASY'
  form.categoryIds = getTodoCategoryIds(todo)
  form.subtasks = normalizeSubtasks(todo.subtasks)
}

function buildPayload() {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    dueDate: form.dueDate,
    dueTime: toApiTime(form.dueTime),
    difficulty: form.difficulty,
    categoryIds: form.categoryIds,
    subtasks: form.subtasks
      .filter((subtask) => subtask.title.trim())
      .map((subtask, position) => ({
        id: subtask.id,
        title: subtask.title.trim(),
        completed: Boolean(subtask.completed),
        position,
      })),
  }
}

function validateForm() {
  if (!form.title.trim()) return 'Title is required.'
  if (!form.dueDate || !form.dueTime || !form.difficulty) return 'Please fill in all required fields.'
  return ''
}

async function fetchCategories() {
  loadingCategories.value = true

  try {
    const response = await getCategories()
    categories.value = Array.isArray(response.data) ? response.data : response.data?.content || []
  } catch (error) {
    errorMessage.value = error.message || 'Could not load categories.'
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
    const response = await updateTodo(props.todo.id, payload)

    emit('updated', {
      ...props.todo,
      ...payload,
      ...response.data,
    })
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Update todo failed.'
  } finally {
    saving.value = false
  }
}

watch(
  () => props.todo,
  (todo) => fillForm(todo),
  { immediate: true },
)

onMounted(fetchCategories)
</script>

<template>
  <ModalShell
    title="Update todo information"
    subtitle="Edit the title, schedule, difficulty, categories and checklist."
    @close="emit('cancel')"
  >
    <form class="grid gap-5 px-5 py-5" @submit.prevent="submitForm">
      <label class="grid gap-1.5">
        <span class="text-sm font-semibold text-stone-700">Title</span>
        <input
          v-model="form.title"
          type="text"
          class="h-11 rounded-md border border-stone-300 bg-white px-3 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          required
        />
      </label>

      <label class="grid gap-1.5">
        <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700">
          <FileText :size="16" />
          Description
        </span>
        <textarea
          v-model="form.description"
          rows="3"
          class="resize-none rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        ></textarea>
      </label>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="grid gap-1.5">
          <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700">
            <Calendar :size="16" />
            Due date
          </span>
          <input
            v-model="form.dueDate"
            type="date"
            class="h-11 rounded-md border border-stone-300 bg-white px-3 text-stone-900 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            required
          />
        </label>

        <label class="grid gap-1.5">
          <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700">
            <Clock :size="16" />
            Due time
          </span>
          <input
            v-model="form.dueTime"
            type="time"
            class="h-11 rounded-md border border-stone-300 bg-white px-3 text-stone-900 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            required
          />
        </label>
      </div>

      <HabitDifficultySelect v-model="form.difficulty" :difficulties="HABIT_DIFFICULTIES" />
      <HabitCategoryPicker v-model="form.categoryIds" :categories="categories" :loading="loadingCategories" />
      <TodoSubtasksEditor v-model="form.subtasks" />

      <p v-if="errorMessage" class="m-0 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
        {{ errorMessage }}
      </p>

      <FormActions :saving="saving" @cancel="emit('cancel')" />
    </form>
  </ModalShell>
</template>
