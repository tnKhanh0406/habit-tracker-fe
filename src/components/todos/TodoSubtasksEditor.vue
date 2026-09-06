<script setup>
import { Plus, Trash2 } from 'lucide-vue-next'

const model = defineModel({ type: Array, required: true })

function addSubtask() {
  model.value = [
    ...model.value,
    {
      id: null,
      title: '',
      completed: false,
      position: model.value.length,
    },
  ]
}

function removeSubtask(index) {
  model.value = model.value
    .filter((_, subtaskIndex) => subtaskIndex !== index)
    .map((subtask, position) => ({ ...subtask, position }))
}

function updateSubtask(index, patch) {
  model.value = model.value.map((subtask, subtaskIndex) => (
    subtaskIndex === index ? { ...subtask, ...patch } : subtask
  ))
}
</script>

<template>
  <fieldset class="grid gap-2">
    <div class="flex items-center justify-between gap-3">
      <legend class="text-sm font-semibold text-stone-700">Subtasks</legend>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 active:translate-y-px"
        @click="addSubtask"
      >
        <Plus :size="15" />
        Add
      </button>
    </div>

    <div v-if="model.length" class="grid gap-2">
      <div
        v-for="(subtask, index) in model"
        :key="subtask.id || index"
        class="grid gap-2 rounded-md border border-stone-200 bg-white p-2 sm:grid-cols-[auto_1fr_auto] sm:items-center"
      >
        <label class="inline-flex items-center gap-2 text-sm font-medium text-stone-600">
          <input
            type="checkbox"
            class="size-4 rounded-sm border-stone-300 text-teal-800 focus:ring-teal-100"
            :checked="subtask.completed"
            @change="updateSubtask(index, { completed: $event.target.checked })"
          />
          Done
        </label>

        <label class="grid gap-1">
          <span class="sr-only">Subtask {{ index + 1 }} title</span>
          <input
            :value="subtask.title"
            type="text"
            class="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            placeholder="Subtask title"
            @input="updateSubtask(index, { title: $event.target.value })"
          />
        </label>

        <button
          type="button"
          class="grid size-10 place-items-center rounded-md border border-stone-300 text-stone-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:translate-y-px"
          aria-label="Remove subtask"
          @click="removeSubtask(index)"
        >
          <Trash2 :size="16" />
        </button>
      </div>
    </div>

    <p v-else class="m-0 text-sm text-stone-500">No subtasks yet.</p>
  </fieldset>
</template>
