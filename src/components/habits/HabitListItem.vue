<script setup>
import { Edit3 } from 'lucide-vue-next'

defineProps({
  habit: {
    type: Object,
    required: true,
  },
  progressModalOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'toggle-completion',
  'toggle-progress',
  'edit-information',
])

const getTrackingType = (habit) => {
  if (habit.trackingType === 'CHECK' || habit.trackingType === 'QUANTITY') return habit.trackingType
  return habit.targetValue && habit.targetUnit ? 'QUANTITY' : 'CHECK'
}

const isQuantityHabit = (habit) => {
  return getTrackingType(habit) === 'QUANTITY'
}
</script>

<template>
  <li
    class="border border-stone-300 bg-[#fbfaf7] p-4"
    :style="{ borderLeft: `6px solid ${habit.color || '#0f766e'}` }"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="m-0 text-sm font-medium text-stone-500">
          {{ habit.icon }} - {{ habit.color }} - Streak: {{ habit.currentStreak }}
        </p>
        <h2 class="m-0 mt-1 text-lg font-semibold text-stone-950">{{ habit.name }}</h2>
        <p v-if="isQuantityHabit(habit)" class="m-0 mt-1 text-sm text-stone-600">
          Progress: {{ habit.progress }}/{{ habit.targetValue }} {{ habit.targetUnit }}
        </p>
        <p v-else class="m-0 mt-1 text-sm text-stone-600">
          Completion habit
        </p>
        <p class="m-0 mt-1 text-sm text-stone-600">
          {{ habit.completed ? 'Completed' : 'Not completed yet.' }}
        </p>
        <p class="m-0 mt-1 text-sm text-stone-600">
          {{ habit.isScheduledToday ? 'Scheduled for today' : 'Not scheduled for today' }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-md border border-stone-300 px-3 py-2 font-semibold text-stone-700 transition hover:bg-stone-100 active:translate-y-px"
          @click="emit('toggle-completion', habit)"
        >
          {{ habit.completed ? 'Done' : 'Open' }}
        </button>
        <button
          v-if="isQuantityHabit(habit)"
          type="button"
          class="rounded-md border border-stone-300 px-3 py-2 font-semibold text-stone-700 transition hover:bg-stone-100 active:translate-y-px"
          @click="emit('toggle-progress', habit.id)"
        >
          {{ progressModalOpen ? 'Close progress' : 'Progress' }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-md bg-teal-800 px-3 py-2 font-semibold text-white transition hover:bg-teal-700 active:translate-y-px"
          @click="emit('edit-information', habit)"
        >
          <Edit3 :size="16" />
          Edit information
        </button>
      </div>
    </div>
  </li>
</template>
