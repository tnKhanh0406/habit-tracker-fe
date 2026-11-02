<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import {
  Activity,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Coins,
  Flame,
  Gift,
  ListTodo,
  Plus,
  Star,
  Swords,
} from 'lucide-vue-next'

defineProps({
  habitsCompleted: {
    type: String,
    default: '0 / 0',
  },
  todosCompleted: {
    type: String,
    default: '0 / 0',
  },
})

const emit = defineEmits(['add-habit', 'add-todo', 'add-reward'])

const isMenuOpen = ref(false)
const menuRef = ref(null)

const metrics = [
  { label: 'Habits', valueKey: 'habitsCompleted', icon: CheckCircle2, color: 'text-emerald-700' },
  { label: 'Todos', valueKey: 'todosCompleted', icon: ListTodo, color: 'text-sky-700' },
  { label: 'EXP', value: '+320', icon: Star, color: 'text-amber-700' },
  { label: 'Coins', value: '+145', icon: Coins, color: 'text-orange-700' },
  { label: 'Damage', value: '590', icon: Swords, color: 'text-teal-800' },
  { label: 'Streak', value: '12 days', icon: Flame, color: 'text-red-700' },
]

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const handleSelect = (type) => {
  isMenuOpen.value = false
  if (type === 'habit') emit('add-habit')
  if (type === 'todo') emit('add-todo')
  if (type === 'reward') emit('add-reward')
}

const handleClickOutside = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    isMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <section class="mb-6 border-y border-stone-300/80 bg-[#fbfaf7]">
    <div class="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex items-center gap-2 lg:w-40">
        <Calendar class="size-5 text-teal-800" />
        <span class="text-sm font-semibold text-stone-900">Today</span>
      </div>

      <div class="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 xl:grid-cols-6">
        <div v-for="metric in metrics" :key="metric.label" class="min-w-0">
          <div class="flex items-center gap-1.5 text-xs font-medium text-stone-500">
            <component :is="metric.icon" :class="['size-3.5', metric.color]" />
            {{ metric.label }}
          </div>
          <div class="mt-0.5 text-base font-semibold tracking-[-0.01em] text-stone-950">
            {{ metric.valueKey === 'habitsCompleted' ? habitsCompleted : metric.valueKey === 'todosCompleted' ? todosCompleted : metric.value }}
          </div>
        </div>
      </div>

      <div ref="menuRef" class="relative shrink-0">
        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 active:translate-y-px sm:w-auto"
          @click="toggleMenu"
        >
          <Plus class="size-4" />
          Add
          <ChevronDown class="size-4 opacity-80" />
        </button>

        <div
          v-if="isMenuOpen"
          class="absolute right-0 top-full z-40 mt-2 w-48 rounded-md border border-stone-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(41,37,36,0.12)]"
        >
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
            @click="handleSelect('habit')"
          >
            <Activity class="size-4 text-orange-700" />
            Habit
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
            @click="handleSelect('todo')"
          >
            <ListTodo class="size-4 text-sky-700" />
            Todo
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
            @click="handleSelect('reward')"
          >
            <Gift class="size-4 text-teal-800" />
            Reward
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
