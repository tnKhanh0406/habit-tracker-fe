<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  Bell,
  Calendar,
  CheckSquare,
  ChevronDown,
  Info,
  ListChecks,
  ListTodo,
  MoreVertical,
  Send,
  Square,
  Trash2,
} from 'lucide-vue-next'
import { checkTodo, checkTodoSubtask, createTodoWithName, deleteTodo } from '@/api/todoApi'
import DeleteTodoConfirmModal from '@/components/todos/DeleteTodoConfirmModal.vue'
import UpdateTodoInformationModal from '@/components/todos/UpdateTodoInformationModal.vue'
import TodoReminderModal from '@/components/todos/TodoReminderModal.vue'

const props = defineProps({
  todos: {
    type: Array,
    default: () => [],
  },
  categories: {
    type: Array,
    default: () => [],
  },
  loadingCategories: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['todo-created', 'todo-updated', 'todo-deleted'])

const activeFilter = ref('Due Today')
const newTodoTitle = ref('')
const isAdding = ref(false)
const todoInputRef = ref(null)
const openSubtasksId = ref(null)
const activeMenuTodoId = ref(null)
const editingTodo = ref(null)
const reminderTodo = ref(null)
const todoToDelete = ref(null)
const deletingTodoId = ref(null)
const updatingTodoId = ref(null)
const updatingSubtaskKeys = ref(new Set())
const errorMessage = ref('')

const focusInput = () => {
  todoInputRef.value?.focus()
}

defineExpose({ focusInput })

const handleAddTodo = async () => {
  if (!newTodoTitle.value.trim() || isAdding.value) return
  isAdding.value = true

  try {
    const res = await createTodoWithName(newTodoTitle.value.trim())
    emit('todo-created', res.data)
    newTodoTitle.value = ''
  } catch (err) {
    console.error('Failed to create todo:', err)
  } finally {
    isAdding.value = false
  }
}

const toggleTodoCompletion = async (todo) => {
  if (!todo?.id || updatingTodoId.value) return

  const nextCompleted = !todo.completed
  updatingTodoId.value = todo.id
  errorMessage.value = ''

  try {
    const response = await checkTodo(todo.id, nextCompleted)
    emit('todo-updated', {
      ...todo,
      completed: response.data?.completed ?? nextCompleted,
      ...response.data,
    })
  } catch (err) {
    errorMessage.value = err.response?.data?.message || err.message || 'Update todo status failed.'
  } finally {
    updatingTodoId.value = null
  }
}

const getSubtaskKey = (todoId, subtaskId) => `${todoId}:${subtaskId}`

const isSubtaskUpdating = (todoId, subtaskId) => {
  return updatingSubtaskKeys.value.has(getSubtaskKey(todoId, subtaskId))
}

const setSubtaskUpdating = (todoId, subtaskId, updating) => {
  const nextKeys = new Set(updatingSubtaskKeys.value)
  const key = getSubtaskKey(todoId, subtaskId)

  if (updating) {
    nextKeys.add(key)
  } else {
    nextKeys.delete(key)
  }

  updatingSubtaskKeys.value = nextKeys
}

const toggleSubtask = async (todo, subtask) => {
  if (!todo?.id || !subtask?.id || isSubtaskUpdating(todo.id, subtask.id)) return

  const nextCompleted = !subtask.completed
  setSubtaskUpdating(todo.id, subtask.id, true)
  errorMessage.value = ''

  try {
    const response = await checkTodoSubtask(todo.id, subtask.id, nextCompleted)
    const updatedSubtask = {
      ...subtask,
      completed: response.data?.completed ?? nextCompleted,
      ...response.data,
    }
    const updatedSubtasks = Array.isArray(todo.subtasks)
      ? todo.subtasks.map((item) => (item.id === subtask.id ? updatedSubtask : item))
      : []

    emit('todo-updated', {
      ...todo,
      subtasks: updatedSubtasks,
    })
  } catch (err) {
    errorMessage.value = err.response?.data?.message || err.message || 'Update subtask status failed.'
  } finally {
    setSubtaskUpdating(todo.id, subtask.id, false)
  }
}

const toggleSubtasksPopover = (todoId) => {
  openSubtasksId.value = openSubtasksId.value === todoId ? null : todoId
}

const toggleTodoMenu = (todoId) => {
  activeMenuTodoId.value = activeMenuTodoId.value === todoId ? null : todoId
}

const closeTodoMenu = () => {
  activeMenuTodoId.value = null
}

const openTodoInformation = (todo) => {
  editingTodo.value = todo
  closeTodoMenu()
}

const closeTodoInformation = () => {
  editingTodo.value = null
}

const openTodoReminder = (todo) => {
  reminderTodo.value = todo
  closeTodoMenu()
}

const closeTodoReminder = () => {
  reminderTodo.value = null
}

const handleTodoInformationUpdated = (todo) => {
  emit('todo-updated', todo)
  closeTodoInformation()
}

const requestDeleteTodo = (todo) => {
  todoToDelete.value = todo
  closeTodoMenu()
}

const closeDeleteTodo = () => {
  if (deletingTodoId.value) return
  todoToDelete.value = null
}

const confirmDeleteTodo = async () => {
  if (!todoToDelete.value || deletingTodoId.value) return
  deletingTodoId.value = todoToDelete.value.id
  errorMessage.value = ''

  try {
    await deleteTodo(todoToDelete.value.id)
    emit('todo-deleted', todoToDelete.value.id)
    todoToDelete.value = null
  } catch (err) {
    errorMessage.value = err.response?.data?.message || err.message || 'Delete todo failed.'
  } finally {
    deletingTodoId.value = null
  }
}

const handleDocumentClick = (event) => {
  if (!event.target.closest?.('[data-todo-menu]')) {
    closeTodoMenu()
  }
}

const getSortedSubtasks = (subtasks) => {
  if (!Array.isArray(subtasks)) return []
  return subtasks.slice().sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
}

const formatDateValue = (dueDate) => {
  if (!dueDate) return ''
  return Array.isArray(dueDate)
    ? `${dueDate[0]}-${String(dueDate[1]).padStart(2, '0')}-${String(dueDate[2]).padStart(2, '0')}`
    : dueDate
}

const formatDueDateTime = (dueDate, dueTime) => {
  const dateStr = formatDateValue(dueDate)
  if (!dateStr) return ''

  const today = new Date().toISOString().split('T')[0]
  const displayDate = dateStr === today ? 'Today' : dateStr

  if (!dueTime) return displayDate

  const timeStr = Array.isArray(dueTime)
    ? `${String(dueTime[0]).padStart(2, '0')}:${String(dueTime[1]).padStart(2, '0')}`
    : String(dueTime).slice(0, 5)

  return `${displayDate}, ${timeStr}`
}

const isOverdue = (dueDate) => {
  const dateStr = formatDateValue(dueDate)
  if (!dateStr) return false
  const today = new Date().toISOString().split('T')[0]
  return dateStr < today
}

const filteredTodos = computed(() => {
  return props.todos.filter((todo) => {
    if (activeFilter.value === 'Completed') return todo.completed
    if (todo.completed) return false

    const dateStr = formatDateValue(todo.dueDate)
    const today = new Date().toISOString().split('T')[0]

    if (activeFilter.value === 'Overdue') return isOverdue(todo.dueDate)
    if (activeFilter.value === 'Due Today') return dateStr === today || !todo.dueDate
    if (activeFilter.value === 'UpComing') return dateStr > today
    return true
  })
})

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
        <ListTodo class="size-4.5 text-sky-800" />
        <h3 class="m-0 text-base font-semibold tracking-[-0.01em] text-stone-950">Todos</h3>
      </div>

      <div class="flex items-center gap-0.5 overflow-x-auto rounded-md bg-stone-100 p-0.5 text-xs font-medium">
        <button
          v-for="tab in ['Overdue', 'Due Today', 'UpComing', 'Completed']"
          :key="tab"
          type="button"
          :class="[
            'whitespace-nowrap rounded-sm px-2 py-1 transition active:translate-y-px',
            activeFilter === tab ? 'bg-white text-sky-900 shadow-sm' : 'text-stone-500 hover:text-stone-900',
          ]"
          @click="activeFilter = tab"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <div class="relative mb-2">
      <input
        ref="todoInputRef"
        v-model="newTodoTitle"
        type="text"
        placeholder="Add a new todo"
        class="h-10 w-full rounded-md border border-stone-300 bg-white pl-3.5 pr-10 text-sm font-medium text-stone-800 placeholder:text-stone-400 transition focus:border-sky-700 focus:outline-none"
        @keyup.enter="handleAddTodo"
      />
      <button
        type="button"
        class="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-sm bg-sky-800 text-white transition hover:bg-sky-700 active:translate-y-[-45%] disabled:cursor-not-allowed disabled:opacity-30"
        :disabled="!newTodoTitle.trim() || isAdding"
        @click="handleAddTodo"
      >
        <Send class="size-3.5" />
      </button>
    </div>

    <p v-if="errorMessage" class="m-0 mb-2 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
      {{ errorMessage }}
    </p>

    <div class="min-h-0 flex-1 divide-y divide-stone-200 overflow-y-auto">
      <article
        v-for="todo in filteredTodos"
        :key="todo.id"
        :class="['relative py-4 pr-9 transition hover:bg-white/70', todo.completed && 'opacity-60']"
      >
        <div class="absolute right-0 top-3" data-todo-menu>
          <button
            type="button"
            class="grid size-8 place-items-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-stone-900 active:translate-y-px"
            aria-label="Todo actions"
            @click.stop="toggleTodoMenu(todo.id)"
          >
            <MoreVertical :size="17" />
          </button>

          <div
            v-if="activeMenuTodoId === todo.id"
            class="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-stone-200 bg-white py-1 shadow-[0_16px_40px_rgba(41,37,36,0.14)]"
          >
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:text-stone-950"
              @click="openTodoInformation(todo)"
            >
              <Info :size="16" class="text-sky-800" />
              Information
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:text-stone-950"
              @click="openTodoReminder(todo)"
            >
              <Bell :size="16" class="text-sky-800" />
              Reminder
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
              @click="requestDeleteTodo(todo)"
            >
              <Trash2 :size="16" />
              Delete todo
            </button>
          </div>
        </div>

        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 flex-1 items-start gap-3">
            <button
              type="button"
              class="mt-0.5 shrink-0 text-stone-300 transition hover:text-sky-800 active:translate-y-px disabled:cursor-wait disabled:opacity-45"
              :disabled="updatingTodoId === todo.id"
              @click="toggleTodoCompletion(todo)"
            >
              <CheckSquare v-if="todo.completed" class="size-5 fill-sky-50 text-sky-800" />
              <Square v-else class="size-5" />
            </button>

            <div class="min-w-0 flex-1">
              <span
                :class="[
                  'block text-sm font-semibold leading-snug text-stone-950',
                  todo.completed && 'text-stone-400 line-through',
                ]"
              >
                {{ todo.title }}
              </span>

              <button
                v-if="todo.subtasks && todo.subtasks.length > 0"
                type="button"
                class="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-600 transition hover:bg-stone-100"
                @click="toggleSubtasksPopover(todo.id)"
              >
                <ListChecks class="size-3.5 text-sky-700" />
                {{ todo.subtasks.filter((s) => s.completed).length }}/{{ todo.subtasks.length }}
                <ChevronDown class="size-3 text-stone-400" />
              </button>
            </div>
          </div>

          <div v-if="todo.dueDate" class="shrink-0 text-right">
            <div
              :class="[
                'inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium',
                isOverdue(todo.dueDate) && !todo.completed
                  ? 'bg-red-50 text-red-700'
                  : 'bg-stone-100 text-stone-600',
              ]"
            >
              <Calendar class="size-3.5" />
              <span>{{ formatDueDateTime(todo.dueDate, todo.dueTime) }}</span>
            </div>
          </div>
        </div>

        <div
          v-if="openSubtasksId === todo.id && todo.subtasks && todo.subtasks.length > 0"
          class="mt-3 space-y-2 border-l-2 border-stone-200 pl-3"
        >
          <div class="text-xs font-semibold text-stone-500">Checklist</div>
          <button
            v-for="subtask in getSortedSubtasks(todo.subtasks)"
            :key="subtask.id"
            type="button"
            class="flex items-center gap-2 text-left text-xs font-medium text-stone-700 transition hover:text-sky-800 disabled:cursor-wait disabled:opacity-45"
            :disabled="isSubtaskUpdating(todo.id, subtask.id)"
            @click="toggleSubtask(todo, subtask)"
          >
            <CheckSquare v-if="subtask.completed" class="size-3.5 fill-sky-50 text-sky-800" />
            <Square v-else class="size-3.5 text-stone-400" />
            <span :class="{ 'text-stone-400 line-through': subtask.completed }">
              {{ subtask.title }}
            </span>
          </button>
        </div>
      </article>

      <div v-if="filteredTodos.length === 0" class="py-10 text-center text-sm font-medium text-stone-500">
        No todos match this view.
      </div>
    </div>

    <UpdateTodoInformationModal
      v-if="editingTodo"
      :todo="editingTodo"
      :categories="props.categories"
      :loading-categories="props.loadingCategories"
      @updated="handleTodoInformationUpdated"
      @cancel="closeTodoInformation"
    />

    <TodoReminderModal
      v-if="reminderTodo"
      :todo="reminderTodo"
      @cancel="closeTodoReminder"
    />

    <DeleteTodoConfirmModal
      v-if="todoToDelete"
      :todo="todoToDelete"
      :deleting="deletingTodoId === todoToDelete.id"
      @confirm="confirmDeleteTodo"
      @cancel="closeDeleteTodo"
    />
  </section>
</template>
