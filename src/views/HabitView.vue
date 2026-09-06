<script setup>
import { ref, computed, onMounted } from 'vue'
import Navbar from '@/components/dashboard/Navbar.vue'
import CharacterHeader from '@/components/dashboard/CharacterHeader.vue'
import TodaySummary from '@/components/dashboard/TodaySummary.vue'
import HabitColumn from '@/components/dashboard/HabitColumn.vue'
import TodoColumn from '@/components/dashboard/TodoColumn.vue'
import RewardColumn from '@/components/dashboard/RewardColumn.vue'

import UpdateCheckinModal from '@/components/habits/UpdateCheckinModal.vue'
import UpdateHabitInformationModal from '@/components/habits/UpdateHabitInformationModal.vue'
import ReminderModal from '@/components/habits/ReminderModal.vue'
import ScheduleModal from '@/components/habits/ScheduleModal.vue'
import UpdateRewardModal from '@/components/rewards/UpdateRewardModal.vue'

import { getHabits } from '@/api/habitApi'
import { getTodos } from '@/api/todoApi'
import { getRewards } from '@/api/rewardApi'

// State
const habits = ref([])
const todos = ref([])
const rewards = ref([])

const loading = ref(false)
const error = ref(null)

const activeCheckinHabit = ref(null)
const editingHabit = ref(null)
const reminderHabit = ref(null)
const scheduleHabit = ref(null)
const notificationMessage = ref('')
const editingReward = ref(null)

const habitColumnRef = ref(null)
const todoColumnRef = ref(null)
const rewardColumnRef = ref(null)

// Fallback initial data matching design mockup if API is empty or offline
const initialFallbackHabits = [
  {
    id: 'h1',
    name: 'Run 5km',
    icon: 'bike',
    color: '#f97316',
    status: 'ACTIVE',
    targetUnit: 'km',
    targetValue: 5,
    progress: 3.2,
    completed: false,
    isScheduledToday: true,
    currentStreak: 14
  },
  {
    id: 'h2',
    name: 'Read 30 minutes',
    icon: 'book',
    color: '#3b82f6',
    status: 'ACTIVE',
    targetUnit: 'min',
    targetValue: 30,
    progress: 20,
    completed: false,
    isScheduledToday: true,
    currentStreak: 6
  },
  {
    id: 'h3',
    name: 'Meditate',
    icon: 'sprout',
    color: '#10b981',
    status: 'ACTIVE',
    targetUnit: 'min',
    targetValue: 15,
    progress: 15,
    completed: true,
    isScheduledToday: true,
    currentStreak: 8
  }
]

const initialFallbackTodos = [
  {
    id: 't1',
    title: 'Finish Habit Tracker UI',
    completed: false,
    dueDate: '2026-05-25',
    dueTime: '23:59',
    subtasks: [
      { id: 's1', title: 'checklist step 1', completed: true, position: 1 },
      { id: 's2', title: 'checklist step 2', completed: true, position: 2 },
      { id: 's3', title: 'checklist step 3', completed: true, position: 3 }
    ]
  },
  {
    id: 't2',
    title: 'Call dentist',
    completed: false,
    dueDate: '2026-05-26',
    dueTime: '19:00',
    subtasks: []
  },
  {
    id: 't3',
    title: 'Submit Assignment',
    completed: false,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '23:00',
    subtasks: []
  },
  {
    id: 't4',
    title: 'Buy groceries',
    completed: false,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '12:00',
    subtasks: []
  },
  {
    id: 't5',
    title: 'Prepare team presentation',
    completed: false,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '17:00',
    subtasks: [
      { id: 's4', title: 'Slide outline', completed: true, position: 1 },
      { id: 's5', title: 'Review notes', completed: false, position: 2 }
    ]
  }
]

const initialFallbackRewards = [
  {
    id: 'r1',
    name: 'Milk Tea Treat',
    description: 'A sweet bubble tea reward',
    icon: 'tea',
    cost: 120,
    type: 'CUSTOM'
  },
  {
    id: 'r2',
    name: 'Mystery Book',
    description: 'A random new book for your collection',
    icon: 'book',
    cost: 300,
    type: 'SYSTEM'
  }
]

// Computed Summary Stats
const habitsCompletedText = computed(() => {
  const comp = habits.value.filter(h => h.completed).length
  const total = habits.value.length
  return total > 0 ? `${comp} / ${total}` : '5 / 8'
})

const todosCompletedText = computed(() => {
  const comp = todos.value.filter(t => t.completed).length
  const total = todos.value.length
  return total > 0 ? `${comp} / ${total}` : '2 / 4'
})

// Fetch all dashboard data (only on page mount)
const fetchDashboardData = async () => {
  loading.value = true
  error.value = null

  try {
    const [habitsRes, todosRes, rewardsRes] = await Promise.allSettled([
      getHabits(),
      getTodos(),
      getRewards()
    ])

    if (habitsRes.status === 'fulfilled' && Array.isArray(habitsRes.value?.data) && habitsRes.value.data.length > 0) {
      habits.value = habitsRes.value.data
    } else {
      habits.value = initialFallbackHabits
    }

    if (todosRes.status === 'fulfilled' && Array.isArray(todosRes.value?.data) && todosRes.value.data.length > 0) {
      todos.value = todosRes.value.data
    } else {
      todos.value = initialFallbackTodos
    }

    if (rewardsRes.status === 'fulfilled' && Array.isArray(rewardsRes.value?.data) && rewardsRes.value.data.length > 0) {
      rewards.value = rewardsRes.value.data
    } else {
      rewards.value = initialFallbackRewards
    }
  } catch (err) {
    console.error('Error fetching dashboard data:', err)
    habits.value = initialFallbackHabits
    todos.value = initialFallbackTodos
    rewards.value = initialFallbackRewards
  } finally {
    loading.value = false
  }
}

// Handlers for creation & focus
const handleHabitCreated = (newHabit) => {
  habits.value.unshift(newHabit)
}

const handleTodoCreated = (newTodo) => {
  todos.value.unshift(newTodo)
}

const handleTodoUpdated = (updatedTodo) => {
  const idx = todos.value.findIndex(t => t.id === updatedTodo.id)
  if (idx !== -1) {
    todos.value[idx] = {
      ...todos.value[idx],
      ...updatedTodo
    }
  }
}

const handleTodoDeleted = (todoId) => {
  todos.value = todos.value.filter(t => t.id !== todoId)
}

const handleRewardCreated = (newReward) => {
  rewards.value.unshift(newReward)
}

const handleRewardDeleted = (rewardId) => {
  rewards.value = rewards.value.filter(r => r.id !== rewardId)
}

const openRewardInformationModal = (reward) => {
  editingReward.value = reward
}

const closeRewardInformationModal = () => {
  editingReward.value = null
}

const handleRewardUpdated = (updatedReward) => {
  const idx = rewards.value.findIndex(r => r.id === updatedReward.id)
  if (idx !== -1) {
    rewards.value[idx] = {
      ...rewards.value[idx],
      ...updatedReward
    }
  }
  closeRewardInformationModal()
}

const handleAddHabitFocus = () => {
  if (habitColumnRef.value) habitColumnRef.value.focusInput()
}

const handleAddTodoFocus = () => {
  if (todoColumnRef.value) todoColumnRef.value.focusInput()
}

const handleAddRewardFocus = () => {
  if (rewardColumnRef.value) rewardColumnRef.value.focusInput()
}

// Checkin Modal Handlers
const openCheckinModal = (habit) => {
  activeCheckinHabit.value = habit
}

const closeCheckinModal = () => {
  activeCheckinHabit.value = null
}

const updateHabitFromCheckinResponse = (response) => {
  if (!response) return
  const targetId = response.habitId || activeCheckinHabit.value?.id
  const habit = habits.value.find(h => h.id === targetId)
  if (habit) {
    if (response.progress !== undefined) habit.progress = response.progress
    if (response.completed !== undefined) habit.completed = response.completed
    if (response.currentStreak !== undefined) habit.currentStreak = response.currentStreak
    if (response.targetValue !== undefined) habit.targetValue = response.targetValue
  }
}

const handleAddProgress = (checkinResponse) => {
  updateHabitFromCheckinResponse(checkinResponse)
  closeCheckinModal()
}

const handleUpdateProgress = (checkinResponse) => {
  updateHabitFromCheckinResponse(checkinResponse)
  closeCheckinModal()
}

// Information Modal Handlers
const openInformationModal = (habit) => {
  editingHabit.value = habit
}

const closeInformationModal = () => {
  editingHabit.value = null
}

const handleUpdatedInformation = (updatedHabit) => {
  const idx = habits.value.findIndex(h => h.id === updatedHabit.id)
  if (idx !== -1) {
    habits.value[idx] = {
      ...habits.value[idx],
      ...updatedHabit
    }
  }
  closeInformationModal()
}

// Reminder Modal Handlers
const openReminderModal = (habit) => {
  reminderHabit.value = habit
}

const closeReminderModal = () => {
  reminderHabit.value = null
}

// Schedule Modal Handlers
const openScheduleModal = (habit) => {
  scheduleHabit.value = habit
}

const closeScheduleModal = () => {
  scheduleHabit.value = null
}

const handleScheduleUpdated = (scheduleData) => {
  if (scheduleData && scheduleData.habitId) {
    const habit = habits.value.find(h => h.id === scheduleData.habitId)
    if (habit && scheduleData.isScheduledToday !== undefined) {
      habit.isScheduledToday = scheduleData.isScheduledToday
    }
  }
  closeScheduleModal()
}

onMounted(fetchDashboardData)
</script>

<template>
  <div class="min-h-dvh pb-14 text-stone-800 antialiased">
    <Navbar />

    <main class="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
      <CharacterHeader />

      <TodaySummary
        :habits-completed="habitsCompletedText"
        :todos-completed="todosCompletedText"
        @add-habit="handleAddHabitFocus"
        @add-todo="handleAddTodoFocus"
        @add-reward="handleAddRewardFocus"
      />

      <div v-if="loading" class="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div v-for="index in 3" :key="index" class="border border-stone-300/80 bg-[#fbfaf7] p-4">
          <div class="h-5 w-28 rounded-sm bg-stone-200"></div>
          <div class="mt-5 space-y-4">
            <div v-for="row in 4" :key="row" class="flex gap-3 border-t border-stone-200 pt-4">
              <div class="size-10 rounded-md bg-stone-200"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 w-2/3 rounded-sm bg-stone-200"></div>
                <div class="h-3 w-full rounded-sm bg-stone-100"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="error" class="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
        {{ error }}
      </div>

      <div v-else class="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <HabitColumn
          ref="habitColumnRef"
          :habits="habits"
          @habit-created="handleHabitCreated"
          @open-checkin="openCheckinModal"
          @open-information="openInformationModal"
          @open-schedule="openScheduleModal"
          @open-reminder="openReminderModal"
        />

        <TodoColumn
          ref="todoColumnRef"
          :todos="todos"
          @todo-created="handleTodoCreated"
          @todo-updated="handleTodoUpdated"
          @todo-deleted="handleTodoDeleted"
        />

        <RewardColumn
          ref="rewardColumnRef"
          :rewards="rewards"
          @reward-created="handleRewardCreated"
          @reward-information="openRewardInformationModal"
          @reward-deleted="handleRewardDeleted"
        />
      </div>
    </main>

    <UpdateCheckinModal
      v-if="activeCheckinHabit"
      :habit="activeCheckinHabit"
      @add-progress="handleAddProgress"
      @update-progress="handleUpdateProgress"
      @cancel="closeCheckinModal"
    />

    <UpdateHabitInformationModal
      v-if="editingHabit"
      :habit="editingHabit"
      @updated="handleUpdatedInformation"
      @cancel="closeInformationModal"
    />

    <ReminderModal
      v-if="reminderHabit"
      :habit="reminderHabit"
      @cancel="closeReminderModal"
    />

    <ScheduleModal
      v-if="scheduleHabit"
      :habit="scheduleHabit"
      @updated="handleScheduleUpdated"
      @cancel="closeScheduleModal"
    />

    <UpdateRewardModal
      v-if="editingReward"
      :reward="editingReward"
      @updated="handleRewardUpdated"
      @cancel="closeRewardInformationModal"
    />
  </div>
</template>
