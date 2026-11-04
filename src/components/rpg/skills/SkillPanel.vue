<script setup>
import { computed, nextTick, onUnmounted, ref } from 'vue'
import { LoaderCircle, Sparkles, Clock3, Shield, Eye, Zap, Heart, BookOpen, Wind, Flame } from 'lucide-vue-next'
import ModalShell from '@/components/common/ModalShell.vue'
import { selectCharacterClass } from '@/api/characterApi'
import { castSkill, getSkills } from '@/api/skillApi'

const props = defineProps({
  character: { type: Object, required: true },
  todos: { type: Array, default: () => [] },
  habits: { type: Array, default: () => [] },
  cachedSkills: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'character-updated', 'skills-updated'])
const now = ref(Date.now())
const cooldownTimer = window.setInterval(() => { now.value = Date.now() }, 1000)
onUnmounted(() => window.clearInterval(cooldownTimer))
const skills = computed(() => props.cachedSkills.map((skill) => ({
  ...skill,
  remainingCooldownSeconds: Math.max(0, Math.ceil((skill.cooldownEndsAt - now.value) / 1000)),
})))
const loading = ref(false)
const castingId = ref(null)
const selectedTodoId = ref('')
const selectedHabitId = ref('')
const error = ref('')
const success = ref('')
const targetingId = ref(null)
const activeSkills = computed(() => skills.value.filter((skill) => skill.skillType !== 'PASSIVE'))
const passiveSkills = computed(() => skills.value.filter((skill) => skill.skillType === 'PASSIVE'))
const manaPercent = computed(() => Math.min(100, Math.max(0, props.character.mp / (props.character.maxMp || 1) * 100)))
const skillIcon = (skill) => ({
  MAGE_FOCUS: Eye, MAGE_ARCANE_SURGE: Zap, MAGE_MEDITATION: Wind,
  MAGE_SCHOLARS_WISDOM: BookOpen, WARRIOR_IRON_WILL: Shield,
  WARRIOR_STREAK_GUARD: Shield, WARRIOR_BATTLE_DISCIPLINE: Flame,
  WARRIOR_LAST_STAND: Heart, RANGER_BOUNTY: Eye, RANGER_EAGLE_EYE: Eye,
  RANGER_QUICK_STEP: Wind, RANGER_MOMENTUM: Flame,
  CLERIC_HEAL: Heart, CLERIC_DIVINE_PROTECTION: Shield,
  CLERIC_BLESSING: Sparkles, CLERIC_RECOVERY: Heart,
}[skill.code] || Sparkles)
const unavailable = (skill) => Boolean(castingId.value || loading.value || skill.unlocked === false || skill.active || skill.remainingCooldownSeconds > 0 || props.character.mp < skill.manaCost)
const actionLabel = (skill) => {
  if (castingId.value === skill.id) return 'Casting…'
  if (skill.unlocked === false) return `Level ${skill.requiredLevel}`
  if (skill.remainingCooldownSeconds > 0) return formatCooldown(skill.remainingCooldownSeconds)
  if (skill.active) return 'Effect active'
  if (props.character.mp < skill.manaCost) return `Need ${skill.manaCost - props.character.mp} MP`
  return 'Cast'
}
const beginCast = (skill) => {
  if (skill.targetType === 'TODO' || skill.targetType === 'HABIT') {
    targetingId.value = skill.id
    selectedTodoId.value = ''
    selectedHabitId.value = ''
  } else useSkill(skill)
}

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
    emit('skills-updated', (await getSkills()).data || [])
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
    targetingId.value = null
    await loadSkills()
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Could not cast skill.'
  } finally {
    castingId.value = null
  }
}

const formatCooldown = (seconds) => {
  if (!seconds) return 'Ready to cast'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return [hours, minutes, remainder].map((value) => String(value).padStart(2, '0')).join(':')
}

</script>

<template>
  <ModalShell title="Character skills" :subtitle="character.characterClass ? '' : 'Choose a class to discover your skills.'" @close="emit('close')">
    <div class="grid gap-4 px-5 py-5">
      <p v-if="error" class="m-0 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{{ error }}</p>
      <p v-if="success" class="m-0 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{{ success }}</p>

      <template v-if="!character.characterClass">
        <p class="m-0 text-sm text-stone-600">Choose your class. You can change it in Profile after 7 days.</p>
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
        <div class="flex items-center justify-between gap-6 rounded-md bg-sky-50/60 px-4 py-3">
          <span class="font-semibold capitalize text-stone-950">{{ character.characterClass.toLowerCase() }}</span>
          <div class="w-36">
            <div class="mb-1.5 text-right text-xs font-semibold tabular-nums text-sky-800">{{ character.mp }} / {{ character.maxMp }} MP</div>
            <div class="h-1.5 overflow-hidden rounded-full bg-sky-100"><div class="h-full rounded-full bg-sky-600 transition-all" :style="{ width: `${manaPercent}%` }"></div></div>
          </div>
        </div>

        <div v-if="loading" class="flex items-center gap-2 py-6 text-sm text-stone-500">
          <LoaderCircle class="size-4 animate-spin" /> Loading skills...
        </div>

        <article v-for="skill in activeSkills" :key="skill.id" class="rounded-md border border-stone-200 bg-white p-3 sm:p-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="m-0 flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-950"><component :is="skillIcon(skill)" class="size-4 shrink-0 text-teal-700" />{{ skill.name }}<span class="text-xs font-medium text-sky-700">{{ skill.manaCost }} MP</span></h3>
              <p class="m-0 mt-1.5 text-xs leading-5 text-stone-500">{{ skill.description }}</p>
              <span v-if="skill.active" class="mt-2 inline-block rounded bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800">Effect active</span>
            </div>
            <button type="button" class="inline-flex min-w-24 shrink-0 items-center justify-center gap-1.5 rounded-md bg-teal-800 px-3 py-2 text-xs font-semibold tabular-nums text-white disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500" :disabled="unavailable(skill)" :aria-label="`${skill.name}: ${actionLabel(skill)}`" @click="beginCast(skill)">
              <LoaderCircle v-if="castingId === skill.id" class="size-3.5 animate-spin" />
              <Clock3 v-else-if="skill.remainingCooldownSeconds > 0" class="size-3.5" />
              {{ actionLabel(skill) }}
            </button>
          </div>

          <select
            v-if="targetingId === skill.id && skill.targetType === 'TODO'"
            v-model="selectedTodoId"
            class="mt-3 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Select todo target</option>
            <option v-for="todo in incompleteTodos" :key="todo.id" :value="todo.id">{{ todo.title }}</option>
          </select>

          <select
            v-if="targetingId === skill.id && skill.targetType === 'HABIT'"
            v-model="selectedHabitId"
            class="mt-3 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Select habit target</option>
            <option v-for="habit in activeHabits" :key="habit.id" :value="habit.id">{{ habit.name }}</option>
          </select>

          <div v-if="targetingId === skill.id" class="mt-3 flex justify-end gap-2">
            <button type="button" class="px-3 py-2 text-xs font-semibold text-stone-500" :disabled="!!castingId" @click="targetingId = null">Cancel</button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-md bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              v-if="skill.skillType !== 'PASSIVE'"
              :disabled="unavailable(skill) || !(skill.targetType === 'TODO' ? selectedTodoId : selectedHabitId)"
              @click="useSkill(skill)"
            >
              <LoaderCircle v-if="castingId === skill.id" class="size-4 animate-spin" />
              Confirm cast
            </button>
          </div>
        </article>
        <section v-if="passiveSkills.length" class="mt-1 border-t border-stone-200 pt-4">
          <h3 class="m-0 mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Passive</h3>
          <div v-for="skill in passiveSkills" :key="skill.id" class="rounded-md bg-stone-100/70 p-3">
            <div class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-2 text-sm font-semibold text-stone-700"><component :is="skillIcon(skill)" class="size-4 text-stone-500" />{{ skill.name }}</span>
              <span class="shrink-0 text-xs font-medium text-teal-700">{{ skill.unlocked === false ? `Level ${skill.requiredLevel}` : 'Always on' }}</span>
            </div>
            <p class="m-0 mt-1.5 text-xs leading-5 text-stone-500">{{ skill.description }}</p>
          </div>
        </section>
      </template>
    </div>
  </ModalShell>
</template>
