<script setup>
import { ref, watch } from 'vue'
import { LoaderCircle, Pencil, Plus, Save, Trash2 } from 'lucide-vue-next'
import ModalShell from '@/components/common/ModalShell.vue'
import { updateCategories } from '@/api/categoryApi'

const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['updated', 'cancel'])

const rows = ref([])
const saving = ref(false)
const errorMessage = ref('')

const copyCategories = (categories) => {
  rows.value = (Array.isArray(categories) ? categories : []).map((category) => ({
    id: category.id || null,
    name: category.name || '',
  }))
}

const addCategory = () => {
  rows.value.push({ id: null, name: '' })
}

const removeCategory = (index) => {
  rows.value.splice(index, 1)
}

const saveCategories = async () => {
  const names = rows.value.map((row) => row.name.trim())
  if (names.some((name) => !name)) {
    errorMessage.value = 'Category name cannot be empty.'
    return
  }

  const normalizedNames = names.map((name) => name.toLocaleLowerCase())
  if (new Set(normalizedNames).size !== normalizedNames.length) {
    errorMessage.value = 'Category names must be unique.'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    const response = await updateCategories(rows.value.map((row, index) => ({
      id: row.id,
      name: names[index],
    })))
    const updatedCategories = Array.isArray(response.data) ? response.data : rows.value
    emit('updated', updatedCategories)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Could not update categories.'
  } finally {
    saving.value = false
  }
}

watch(
  () => props.categories,
  (categories) => copyCategories(categories),
  { immediate: true, deep: true },
)
</script>

<template>
  <ModalShell
    title="Categories"
    subtitle="Add new categories or edit your existing category names."
    @close="emit('cancel')"
  >
    <div class="grid gap-4 px-5 py-5">
      <div v-if="props.loading" class="flex items-center justify-center gap-2 py-8 text-sm font-medium text-stone-500">
        <LoaderCircle class="size-4 animate-spin" />
        Loading categories...
      </div>

      <div v-else class="grid gap-2">
        <div
          v-for="(category, index) in rows"
          :key="category.id || `new-${index}`"
          class="flex items-center gap-2 rounded-md border border-stone-300 bg-white p-2"
        >
          <Pencil class="ml-1 size-4 shrink-0 text-stone-400" />
          <input
            v-model="category.name"
            type="text"
            maxlength="100"
            class="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm font-medium text-stone-900 outline-none placeholder:text-stone-400"
            placeholder="Category name"
            @keyup.enter="saveCategories"
          />
          <button
            type="button"
            class="grid size-8 shrink-0 place-items-center rounded-md text-red-600 transition hover:bg-red-50"
            aria-label="Remove category"
            @click="removeCategory(index)"
          >
            <Trash2 class="size-4" />
          </button>
        </div>

        <p v-if="!rows.length" class="border border-dashed border-stone-300 py-8 text-center text-sm font-medium text-stone-500">
          No categories yet.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-md border border-dashed border-teal-700/40 bg-teal-50 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
        :disabled="saving || props.loading"
        @click="addCategory"
      >
        <Plus class="size-4" />
        Add category
      </button>

      <p v-if="errorMessage" class="m-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
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
          class="inline-flex items-center gap-2 rounded-md bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="saving || props.loading"
          @click="saveCategories"
        >
          <LoaderCircle v-if="saving" class="size-4 animate-spin" />
          <Save v-else class="size-4" />
          {{ saving ? 'Saving...' : 'Save categories' }}
        </button>
      </footer>
    </div>
  </ModalShell>
</template>
