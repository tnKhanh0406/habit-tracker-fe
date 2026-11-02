<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { ChevronDown, Gift, ListTodo, Plus, Search, Activity } from 'lucide-vue-next'

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
  categories: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:search', 'add-habit', 'add-todo', 'add-reward', 'manage-categories'])
const isMenuOpen = ref(false)
const menuRef = ref(null)

const handleSelect = (type) => {
  isMenuOpen.value = false
  emit(`add-${type}`)
}

const handleClickOutside = (event) => {
  if (!menuRef.value?.contains(event.target)) isMenuOpen.value = false
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <section class="mb-6 border-y border-stone-300/80 bg-[#fbfaf7] px-4 py-3 sm:px-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label class="relative min-w-0 flex-1 sm:max-w-xl">
        <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        <input
          :value="props.search"
          type="search"
          placeholder="Search habits, todos and rewards"
          class="h-10 w-full rounded-md border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm font-medium text-stone-800 placeholder:text-stone-400 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          @input="emit('update:search', $event.target.value)"
        />
      </label>

      <div class="flex w-full items-center gap-2 sm:w-auto">
        <button
          type="button"
          class="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 sm:flex-none"
          @click="emit('manage-categories')"
        >
          <span class="truncate">Categories ({{ props.categories.length }})</span>
          <ChevronDown class="size-3.5 shrink-0 text-stone-400" />
        </button>

        <div ref="menuRef" class="relative shrink-0">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 active:translate-y-px"
            @click="isMenuOpen = !isMenuOpen"
          >
            <Plus class="size-4" />
            Add
            <ChevronDown class="size-4 opacity-80" />
          </button>

          <div
            v-if="isMenuOpen"
            class="absolute right-0 top-full z-40 mt-2 w-48 rounded-md border border-stone-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(41,37,37,0.12)]"
          >
            <button type="button" class="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100" @click="handleSelect('habit')">
              <Activity class="size-4 text-orange-700" />
              Habit
            </button>
            <button type="button" class="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100" @click="handleSelect('todo')">
              <ListTodo class="size-4 text-sky-700" />
              Todo
            </button>
            <button type="button" class="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100" @click="handleSelect('reward')">
              <Gift class="size-4 text-teal-800" />
              Reward
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
