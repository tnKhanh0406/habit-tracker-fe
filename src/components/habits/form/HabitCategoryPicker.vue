<script setup>
import { LoaderCircle, Tags } from 'lucide-vue-next'

defineProps({
  categories: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const model = defineModel({ type: Array, required: true })

function toggleCategory(categoryId) {
  if (model.value.includes(categoryId)) {
    model.value = model.value.filter((id) => id !== categoryId)
    return
  }

  model.value = [...model.value, categoryId]
}
</script>

<template>
  <fieldset class="grid gap-2">
    <legend class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700">
      <Tags :size="16" />
      Categories
    </legend>

    <div v-if="loading" class="flex items-center gap-2 text-sm text-stone-500">
      <LoaderCircle class="animate-spin" :size="16" />
      Loading categories...
    </div>

    <div v-else-if="categories.length" class="flex flex-wrap gap-2">
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        :class="[
          'rounded-md border px-3 py-1.5 text-sm font-medium transition active:translate-y-px',
          model.includes(category.id)
            ? 'border-teal-700 bg-teal-50 text-teal-800'
            : 'border-stone-300 bg-white text-stone-600 hover:border-teal-300',
        ]"
        @click="toggleCategory(category.id)"
      >
        {{ category.name }}
      </button>
    </div>

    <p v-else class="m-0 text-sm text-stone-500">No categories found.</p>
  </fieldset>
</template>
