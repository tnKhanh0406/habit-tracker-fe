<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { LoaderCircle, Sparkles } from 'lucide-vue-next'
import ModalShell from '@/components/common/ModalShell.vue'
import { selectCharacterClass } from '@/api/characterApi'
import { castSkill, getSkills } from '@/api/skillApi'

const props = defineProps({
  character: { type: Object, required: true },
  todos: { type: Array, default: () => [] },
  habits: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'character-updated'])
const skills = ref([])
const loading = ref(false)
const castingId = ref(null)
const selectedTodoId = ref('')
const selectedHabitId = ref('')
const error = ref('')
const success = ref('')

const classes = [
  { code: 'WARRIOR', name: 'Warrior', description: 'Iron Will blocks 1 HP from the next login penalty.' },
  { code: 'MAGE', name: 'Mage', description: 'Focus grants 25% bonus EXP on the next completion.' },
  { code: 'RANGER', name: 'Ranger', description: 'Bounty grants 50% bonus coin for a selected todo.' },
  { code: 'CLERIC', name: 'Cleric', description: 'Heal restores 20 HP immediately.' },
]

const incompleteTodos = computed(() => props.todos.filter((todo) => !todo.completed))
const activeHabits = computed(() => props.habits.filter((habit) => habit.status !== 'ARCHIVED'))

const loadSkills = async () => {
  if (!props.character.characterClass) return
  loading.value = true
  error.value = ''
  try {
    skills.value = (await getSkills()).data || []
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Could not load skills.'
  } finally {
    loading.value = false
  }
}

const chooseClass = async (characterClass) => {
  loading.value = true
  error.value = ''
  try {
    const response = await selectCharacterClass(characterClass)
    emit('character-updated', response.data)
    await nextTick()
    await loadSkills()
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Could not select class.'
  } finally {
    loading.value = false
  }
}

const useSkill = async (skill) => {
  const targetId = skill.targetType === 'TODO'
    ? selectedTodoId.value
    : skill.targetType === 'HABIT' ? selectedHabitId.value : null
  if ((skill.targetType === 'TODO' || skill.targetType === 'HABIT') && !targetId) {
    error.value = `Select a ${skill.targetType.toLowerCase()} target.`
    return
  }
  castingId.value = skill.id
  error.value = ''
  success.value = ''
  try {
    const response = await castSkill(skill.id, targetId)
    emit('character-updated', {
      ...props.character,
      mp: response.data.currentMana,
      hp: response.data.currentHp,
      coin: response.data.currentCoin,
    })
    success.value = `${skill.name} activated.`
    await loadSkills()
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Could not cast skill.'
  } finally {
    castingId.value = null
  }
}

const formatCooldown = (seconds) => {
  if (!seconds) return ''
  const hours = Math.ceil(seconds / 3600)
  return `${hours}h cooldown`
}

onMounted(loadSkills)
</script>

<template>
  <ModalShell title="Character skills" subtitle="Choose a class once, then spend mana to activate its skill." @close="emit('close')">
    <div class="grid gap-4 px-5 py-5">
      <p v-if="error" class="m-0 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{{ error }}</p>
      <p v-if="success" class="m-0 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{{ success }}</p>

      <template v-if="!character.characterClass">
        <p class="m-0 text-sm text-stone-600">Class selection is permanent in this MVP.</p>
        <div class="grid gap-3 sm:grid-cols-2">
          <button
            v-for="item in classes"
            :key="item.code"
            type="button"
            class="rounded-md border border-stone-200 bg-white p-4 text-left transition hover:border-teal-700 hover:bg-teal-50 disabled:opacity-50"
            :disabled="loading"
            @click="chooseClass(item.code)"
          >
            <strong class="text-stone-950">{{ item.name }}</strong>
            <span class="mt-1 block text-sm leading-5 text-stone-500">{{ item.description }}</span>
          </button>
        </div>
      </template>

      <template v-else>
        <div class="flex items-center justify-between rounded-md border border-stone-200 bg-white px-4 py-3">
          <span class="font-semibold text-stone-950">{{ character.characterClass }}</span>
          <span class="text-sm font-semibold text-sky-700">{{ character.mp }} / {{ character.maxMp }} MP</span>
        </div>

        <div v-if="loading" class="flex items-center gap-2 py-6 text-sm text-stone-500">
          <LoaderCircle class="size-4 animate-spin" /> Loading skills...
        </div>

        <article v-for="skill in skills" v-else :key="skill.id" class="rounded-md border border-stone-200 bg-white p-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="m-0 flex items-center gap-2 font-semibold text-stone-950"><Sparkles class="size-4 text-teal-700" />{{ skill.name }}</h3>
              <p class="m-0 mt-1 text-sm leading-6 text-stone-500">{{ skill.description }}</p>
            </div>
            <span class="shrink-0 text-sm font-semibold text-sky-700">
              {{ skill.skillType === 'PASSIVE' ? 'Passive' : `${skill.manaCost} MP` }}
            </span>
          </div>

          <select
            v-if="skill.targetType === 'TODO'"
            v-model="selectedTodoId"
            class="mt-3 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Select todo target</option>
            <option v-for="todo in incompleteTodos" :key="todo.id" :value="todo.id">{{ todo.title }}</option>
          </select>

          <select
            v-if="skill.targetType === 'HABIT'"
            v-model="selectedHabitId"
            class="mt-3 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Select habit target</option>
            <option v-for="habit in activeHabits" :key="habit.id" :value="habit.id">{{ habit.name }}</option>
          </select>

          <div class="mt-4 flex items-center justify-between gap-3">
            <span class="text-xs font-semibold text-stone-500">
              {{ skill.skillType === 'PASSIVE' ? 'Always active' : skill.active ? 'Active' : formatCooldown(skill.remainingCooldownSeconds) }}
            </span>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-md bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              v-if="skill.skillType !== 'PASSIVE'"
              :disabled="castingId || skill.active || skill.remainingCooldownSeconds > 0 || character.mp < skill.manaCost"
              @click="useSkill(skill)"
            >
              <LoaderCircle v-if="castingId === skill.id" class="size-4 animate-spin" />
              Cast
            </button>
          </div>
        </article>
      </template>
    </div>
  </ModalShell>
</template>
