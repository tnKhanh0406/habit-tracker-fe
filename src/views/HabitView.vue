<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Navbar from '@/components/dashboard/Navbar.vue'
import CharacterHeader from '@/components/dashboard/CharacterHeader.vue'
import DashboardToolbar from '@/components/dashboard/DashboardToolbar.vue'
import HabitColumn from '@/components/dashboard/HabitColumn.vue'
import TodoColumn from '@/components/dashboard/TodoColumn.vue'
import RewardColumn from '@/components/dashboard/RewardColumn.vue'
import CategoryManagerModal from '@/components/categories/CategoryManagerModal.vue'
import SkillPanel from '@/components/rpg/skills/SkillPanel.vue'

import UpdateCheckinModal from '@/components/habits/UpdateCheckinModal.vue'
import CreateHabitModal from '@/components/habits/CreateHabitModal.vue'
import UpdateHabitInformationModal from '@/components/habits/UpdateHabitInformationModal.vue'
import ReminderModal from '@/components/habits/ReminderModal.vue'
import ScheduleModal from '@/components/habits/ScheduleModal.vue'
import UpdateTodoInformationModal from '@/components/todos/UpdateTodoInformationModal.vue'
import UpdateRewardModal from '@/components/rewards/UpdateRewardModal.vue'

import { getHabits } from '@/api/habitApi'
import { getSkills } from '@/api/skillApi'
import { allocateCharacterStat, getCharacter } from '@/api/characterApi'
import { getCategories } from '@/api/categoryApi'
import { getTodos } from '@/api/todoApi'
import { getRewards } from '@/api/rewardApi'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// State
const habits = ref([])
const todos = ref([])
const rewards = ref([])
const categories = ref([])
const loadingCategories = ref(false)

const loading = ref(false)
const error = ref(null)
const character = ref(null)
const characterLoading = ref(false)
const characterError = ref('')
const allocatingStat = ref(false)
const managingCategories = ref(false)
const showingSkills = ref(false)
const skills = ref([])
const updateSkills = (items) => {
  const receivedAt = Date.now()
  skills.value = items.map((skill) => ({
    ...skill,
    cooldownEndsAt: receivedAt + Number(skill.remainingCooldownSeconds || 0) * 1000,
  }))
}
const searchQuery = ref('')

const activeCheckinHabit = ref(null)
const creatingHabit = ref(false)
const creatingTodo = ref(false)
const creatingReward = ref(false)
const editingHabit = ref(null)
const reminderHabit = ref(null)
const scheduleHabit = ref(null)
const notificationMessage = ref('')
const editingReward = ref(null)
const rewardToast = ref(null)
let rewardToastTimer = null
const penaltyToast = ref(null)
let penaltyToastTimer = null
const handledRewardSignatures = new Set()

const habitColumnRef = ref(null)
const todoColumnRef = ref(null)
const rewardColumnRef = ref(null)

const matchesSearch = (item, fields) => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  if (!query) return true
  const categoryText = Array.isArray(item?.categories)
    ? item.categories.map((category) => category.name).join(' ')
    : ''
  const subtaskText = Array.isArray(item?.subtasks)
    ? item.subtasks.map((subtask) => subtask.title).join(' ')
    : ''
  return [...fields.map((field) => item?.[field]), categoryText, subtaskText]
    .some((value) => String(value || '').toLocaleLowerCase().includes(query))
}

const filteredHabits = computed(() => habits.value.filter((habit) => matchesSearch(habit, ['name', 'description', 'icon', 'trackingType'])))
const filteredTodos = computed(() => todos.value.filter((todo) => matchesSearch(todo, ['title', 'description', 'difficulty'])))
const filteredRewards = computed(() => rewards.value.filter((reward) => matchesSearch(reward, ['name', 'description', 'icon', 'type'])))

const normalizeCharacterResponse = (response) => {
  const data = response?.data?.data || response?.data?.character || response?.data
  if (!data || typeof data !== 'object' || data.level === undefined) return null
  return data
}

const applyLoginPenalty = (penalty) => {
  if (!penalty || Number(penalty.hpDelta) >= 0 || !character.value) return

  if (penalty.currentHp !== undefined && penalty.currentHp !== null) {
    character.value.hp = Number(penalty.currentHp)
  }

  const today = new Date().toISOString().slice(0, 10)
  const userKey = auth.user?.id || auth.user?.email || 'current-user'
  const storageKey = `habit-tracker-penalty:${userKey}:${today}`

  try {
    if (window.sessionStorage.getItem(storageKey)) return
    window.sessionStorage.setItem(storageKey, 'shown')
  } catch (storageError) {
    console.warn('Could not persist login penalty notification state:', storageError)
  }

  penaltyToast.value = {
    hpDelta: Number(penalty.hpDelta),
    missedHabits: Number(penalty.missedHabits || 0),
    overdueTodos: Number(penalty.overdueTodos || 0),
  }

  if (penaltyToastTimer) window.clearTimeout(penaltyToastTimer)
  penaltyToastTimer = window.setTimeout(() => {
    penaltyToast.value = null
  }, 5000)
}

// Fetch all dashboard data (only on page mount)
const fetchDashboardData = async () => {
  loading.value = true
  error.value = null

  try {
    loadingCategories.value = true
    characterLoading.value = true
    const [habitsRes, todosRes, rewardsRes, categoriesRes, characterRes, skillsRes] = await Promise.allSettled([
      getHabits(),
      getTodos(),
      getRewards(),
      getCategories(),
      getCharacter(),
      getSkills(),
    ])
    if (skillsRes.status === 'fulfilled') updateSkills(skillsRes.value.data || [])

    if (habitsRes.status === 'fulfilled' && Array.isArray(habitsRes.value?.data) && habitsRes.value.data.length > 0) {
      habits.value = habitsRes.value.data
    } else {
      habits.value = []
    }

    if (todosRes.status === 'fulfilled' && Array.isArray(todosRes.value?.data) && todosRes.value.data.length > 0) {
      todos.value = todosRes.value.data
    } else {
      todos.value = []
    }

    if (rewardsRes.status === 'fulfilled' && Array.isArray(rewardsRes.value?.data) && rewardsRes.value.data.length > 0) {
      rewards.value = rewardsRes.value.data
    } else {
      rewards.value = []
    }

    if (categoriesRes.status === 'fulfilled') {
      categories.value = Array.isArray(categoriesRes.value?.data)
        ? categoriesRes.value.data
        : categoriesRes.value?.data?.content || []
    } else {
      categories.value = []
    }

    const characterData = characterRes.status === 'fulfilled'
      ? normalizeCharacterResponse(characterRes.value)
      : null

    console.log('[Character API] settled result:', characterRes)
    console.log('[Character API] raw response data:', characterRes.status === 'fulfilled' ? characterRes.value?.data : null)
    console.log('[Character API] normalized character:', characterData)

    if (characterData) {
      character.value = characterData
      characterError.value = ''
      applyLoginPenalty(auth.loginPenalty)
    } else {
      character.value = null
      characterError.value = characterRes.status === 'rejected'
        ? `Could not load character data (${characterRes.reason?.response?.status || 'network error'}).`
        : 'Character data is unavailable. Check the character API response.'
    }
  } catch (err) {
    console.error('Error fetching dashboard data:', err)
    habits.value = []
    todos.value = []
    rewards.value = []
    categories.value = []
    character.value = null
    characterError.value = err.message || 'Could not load character data.'
  } finally {
    loadingCategories.value = false
    characterLoading.value = false
    loading.value = false
  }
}

// Handlers for creation & focus
const handleHabitCreated = (newHabit) => {
  habits.value.unshift(newHabit)
}

const handleHabitDeleted = (habitId) => {
  habits.value = habits.value.filter((habit) => habit.id !== habitId)
}

const handleFullHabitCreated = (newHabit) => {
  handleHabitCreated(newHabit)
  creatingHabit.value = false
}

const closeCreateHabitModal = () => {
  creatingHabit.value = false
}

const handleTodoCreated = (newTodo) => {
  todos.value.unshift(newTodo)
}

const applyReward = (reward) => {
  if (!reward) return

  const expDelta = Number(reward.expDelta || 0)
  const coinDelta = Number(reward.coinDelta || 0)
  const signature = [
    expDelta,
    coinDelta,
    reward.currentExp,
    reward.currentCoin,
    reward.currentLevel,
    Boolean(reward.levelUp),
    Boolean(reward.levelDown),
  ].join('|')

  if (handledRewardSignatures.has(signature)) return
  handledRewardSignatures.add(signature)

  if (character.value) {
    if (reward.currentExp !== undefined && reward.currentExp !== null) {
      character.value.exp = Number(reward.currentExp)
    }
    if (reward.currentCoin !== undefined && reward.currentCoin !== null) {
      character.value.coin = Number(reward.currentCoin)
    }
    if (reward.currentLevel !== undefined && reward.currentLevel !== null) {
      character.value.level = Number(reward.currentLevel)
    }
  }

  if (expDelta === 0 && coinDelta === 0) return

  rewardToast.value = {
    expDelta,
    coinDelta,
    levelUp: Boolean(reward.levelUp),
    levelDown: Boolean(reward.levelDown),
  }

  if (rewardToastTimer) window.clearTimeout(rewardToastTimer)
  rewardToastTimer = window.setTimeout(() => {
    rewardToast.value = null
  }, 3600)
}

const handleFullTodoCreated = (newTodo) => {
  handleTodoCreated(newTodo)
  creatingTodo.value = false
}

const closeCreateTodoModal = () => {
  creatingTodo.value = false
}

const handleTodoUpdated = (updatedTodo) => {
  applyReward(updatedTodo?.reward)
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

const handleFullRewardCreated = (newReward) => {
  handleRewardCreated(newReward)
  creatingReward.value = false
}

const handleRewardRedeemed = ({ coin } = {}) => {
  if (character.value && Number.isFinite(coin)) {
    character.value.coin = coin
  }
}

const closeCreateRewardModal = () => {
  creatingReward.value = false
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
  creatingHabit.value = true
}

const handleAddTodoFocus = () => {
  creatingTodo.value = true
}

const handleAddRewardFocus = () => {
  creatingReward.value = true
}

const handleAllocateStat = async (stat) => {
  if (!character.value?.statPoints || allocatingStat.value) return

  allocatingStat.value = true
  characterError.value = ''

  try {
    const response = await allocateCharacterStat(stat, 1)
    if (response.data && character.value) {
      character.value = {
        ...character.value,
        ...response.data,
      }
    }
  } catch (allocationError) {
    characterError.value = allocationError.response?.data?.message
      || allocationError.message
      || 'Could not allocate stat point.'
  } finally {
    allocatingStat.value = false
  }
}

const handleCharacterUpdated = (updatedCharacter) => {
  if (!updatedCharacter) return
  character.value = { ...character.value, ...updatedCharacter }
}

const openCategoryManager = () => {
  managingCategories.value = true
}

const closeCategoryManager = () => {
  if (!loadingCategories.value) managingCategories.value = false
}

const handleCategoriesUpdated = (updatedCategories) => {
  categories.value = Array.isArray(updatedCategories) ? updatedCategories : []
  managingCategories.value = false
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
  applyReward(response.reward)
  const targetId = response.habitId || activeCheckinHabit.value?.id
  const habit = habits.value.find(h => h.id === targetId)
  if (habit) {
    if (response.progress !== undefined) habit.progress = response.progress
    if (response.completed !== undefined) habit.completed = response.completed
    if (response.currentStreak !== undefined) habit.currentStreak = response.currentStreak
    if (response.targetValue !== undefined) habit.targetValue = response.targetValue
  }
}

const handleHabitUpdated = (updatedHabit) => {
  applyReward(updatedHabit?.reward)
  const idx = habits.value.findIndex(h => h.id === updatedHabit.id)
  if (idx !== -1) {
    habits.value[idx] = {
      ...habits.value[idx],
      ...updatedHabit,
    }
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
  handleHabitUpdated(updatedHabit)
  closeInformationModal()
}

// Reminder Modal Handlers
const openReminderModal = (habit) => {
  reminderHabit.value = habit
}

const closeReminderModal = () => {
  reminderHabit.value = null
}

const handleReminderUpdated = async ({ habitId } = {}) => {
  closeReminderModal()

  try {
    const response = await getHabits()
    const refreshedHabit = Array.isArray(response.data)
      ? response.data.find((habit) => habit.id === habitId)
      : null
    const habitIndex = habits.value.findIndex((habit) => habit.id === habitId)

    if (refreshedHabit && habitIndex !== -1) {
      habits.value[habitIndex] = refreshedHabit
    }
  } catch (error) {
    console.error('Failed to refresh habit after updating reminders:', error)
  }
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

onUnmounted(() => {
  if (rewardToastTimer) window.clearTimeout(rewardToastTimer)
  if (penaltyToastTimer) window.clearTimeout(penaltyToastTimer)
})
</script>

<template>
  <div class="min-h-dvh pb-14 text-stone-800 antialiased">
    <Navbar :character="character" />

    <main class="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
      <CharacterHeader
        :character="character"
        :loading="characterLoading || allocatingStat"
        :error="characterError"
        @allocate-stat="handleAllocateStat"
        @open-skills="showingSkills = true"
      />

      <DashboardToolbar
        v-model:search="searchQuery"
        :categories="categories"
        @add-habit="handleAddHabitFocus"
        @add-todo="handleAddTodoFocus"
        @add-reward="handleAddRewardFocus"
        @manage-categories="openCategoryManager"
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
          :habits="filteredHabits"
          :total-habits="habits.length"
          @habit-created="handleHabitCreated"
          @habit-updated="handleHabitUpdated"
          @habit-deleted="handleHabitDeleted"
          @open-checkin="openCheckinModal"
          @open-information="openInformationModal"
          @open-schedule="openScheduleModal"
          @open-reminder="openReminderModal"
        />

        <TodoColumn
          ref="todoColumnRef"
          :todos="filteredTodos"
          :total-todos="todos.length"
          :categories="categories"
          :loading-categories="loadingCategories"
          @todo-created="handleTodoCreated"
          @todo-updated="handleTodoUpdated"
          @todo-deleted="handleTodoDeleted"
        />

        <RewardColumn
          ref="rewardColumnRef"
          :rewards="filteredRewards"
          @reward-created="handleRewardCreated"
          @reward-redeemed="handleRewardRedeemed"
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

    <CreateHabitModal
      v-if="creatingHabit"
      :categories="categories"
      :loading-categories="loadingCategories"
      @created="handleFullHabitCreated"
      @cancel="closeCreateHabitModal"
    />

    <UpdateTodoInformationModal
      v-if="creatingTodo"
      mode="create"
      :categories="categories"
      :loading-categories="loadingCategories"
      @created="handleFullTodoCreated"
      @cancel="closeCreateTodoModal"
    />

    <UpdateHabitInformationModal
      v-if="editingHabit"
      :habit="editingHabit"
      :categories="categories"
      :loading-categories="loadingCategories"
      @updated="handleUpdatedInformation"
      @cancel="closeInformationModal"
    />

    <ReminderModal
      v-if="reminderHabit"
      :habit="reminderHabit"
      @updated="handleReminderUpdated"
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

    <UpdateRewardModal
      v-if="creatingReward"
      mode="create"
      @created="handleFullRewardCreated"
      @cancel="closeCreateRewardModal"
    />

    <CategoryManagerModal
      v-if="managingCategories"
      :categories="categories"
      :loading="loadingCategories"
      @updated="handleCategoriesUpdated"
      @cancel="closeCategoryManager"
    />

    <SkillPanel
      v-if="showingSkills && character"
      :character="character"
      :todos="todos"
      :habits="habits"
      :cached-skills="skills"
      @skills-updated="updateSkills"
      @character-updated="handleCharacterUpdated"
      @close="showingSkills = false"
    />

    <Transition name="penalty-toast">
      <aside
        v-if="penaltyToast"
        class="fixed right-3 top-3 z-[71] w-[min(22rem,calc(100vw-1.5rem))] rounded-md border border-red-200 bg-white px-4 py-3 shadow-[0_18px_45px_rgba(127,29,29,0.18)] sm:right-5 sm:top-5"
        role="status"
        aria-live="polite"
      >
        <p class="m-0 text-sm font-bold text-red-800">Login penalty</p>
        <p class="m-0 mt-1 text-lg font-bold text-red-700">{{ penaltyToast.hpDelta }} HP</p>
        <div class="mt-1 grid gap-0.5 text-xs font-semibold text-stone-600">
          <span v-if="penaltyToast.missedHabits > 0">
            {{ penaltyToast.missedHabits }} habit{{ penaltyToast.missedHabits === 1 ? '' : 's' }} missed
          </span>
          <span v-if="penaltyToast.overdueTodos > 0">
            {{ penaltyToast.overdueTodos }} todo{{ penaltyToast.overdueTodos === 1 ? '' : 's' }} overdue
          </span>
        </div>
      </aside>
    </Transition>

    <Transition name="reward-toast">
      <aside
        v-if="rewardToast"
        class="fixed right-3 top-3 z-[70] w-[min(22rem,calc(100vw-1.5rem))] rounded-md border border-stone-200 bg-white px-4 py-3 shadow-[0_18px_45px_rgba(41,37,36,0.18)] sm:right-5 sm:top-5"
        role="status"
        aria-live="polite"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="m-0 text-sm font-bold text-stone-950">
              {{ rewardToast.levelUp ? 'Level Up' : rewardToast.levelDown ? 'Level Down' : 'Reward received' }}
            </p>
            <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
              <span
                v-if="rewardToast.expDelta !== 0"
                :class="rewardToast.expDelta > 0 ? 'text-emerald-700' : 'text-red-700'"
              >
                {{ rewardToast.expDelta > 0 ? '+' : '' }}{{ rewardToast.expDelta }} EXP
              </span>
              <span
                v-if="rewardToast.coinDelta !== 0"
                :class="rewardToast.coinDelta > 0 ? 'text-emerald-700' : 'text-red-700'"
              >
                {{ rewardToast.coinDelta > 0 ? '+' : '' }}{{ rewardToast.coinDelta }} coin
              </span>
            </div>
          </div>
          <span
            class="mt-1 size-2 shrink-0 rounded-full"
            :class="rewardToast.expDelta > 0 || rewardToast.coinDelta > 0 ? 'bg-emerald-500' : 'bg-red-500'"
          ></span>
        </div>
      </aside>
    </Transition>
  </div>
</template>

<style scoped>
.reward-toast-enter-active,
.reward-toast-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.reward-toast-enter-from,
.reward-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) translateX(8px);
}

.penalty-toast-enter-active,
.penalty-toast-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.penalty-toast-enter-from,
.penalty-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) translateX(8px);
}
</style>
