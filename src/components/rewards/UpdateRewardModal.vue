<script setup>
import { reactive, ref, watch } from 'vue'
import ModalShell from '@/components/common/ModalShell.vue'
import { updateReward } from '@/api/rewardApi'
import { HABIT_ICONS } from '@/constants/habitOptions'
import HabitIconPicker from '@/components/habits/form/HabitIconPicker.vue'

const props = defineProps({
  reward: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['updated', 'cancel'])

const form = reactive({
  name: '',
  description: '',
  icon: HABIT_ICONS[0].key,
  cost: 1,
})
const saving = ref(false)
const errorMessage = ref('')

const fillForm = (reward) => {
  form.name = reward.name || ''
  form.description = reward.description || ''
  const rewardIcon = reward.icon === 'tea' ? 'coffee' : reward.icon
  form.icon = HABIT_ICONS.some((icon) => icon.key === rewardIcon) ? rewardIcon : HABIT_ICONS[0].key
  form.cost = Number(reward.cost || 1)
}

const submitForm = async () => {
  errorMessage.value = ''

  if (!form.name.trim() || !form.icon || Number(form.cost) < 1) {
    errorMessage.value = 'Name, icon and a cost of at least 1 are required.'
    return
  }

  saving.value = true

  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      icon: form.icon,
      cost: Number(form.cost),
      type: 'CUSTOM',
    }
    const response = await updateReward(props.reward.id, payload)

    emit('updated', {
      ...props.reward,
      ...payload,
      ...response.data,
    })
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Update reward failed.'
  } finally {
    saving.value = false
  }
}

watch(
  () => props.reward,
  (reward) => fillForm(reward),
  { immediate: true },
)
</script>

<template>
  <ModalShell
    title="Update reward"
    subtitle="Change the reward details shown on your dashboard."
    @close="emit('cancel')"
  >
    <form class="grid gap-4 px-5 py-5" @submit.prevent="submitForm">
      <label class="grid gap-1.5 text-sm font-semibold text-stone-700">
        Name
        <input
          v-model="form.name"
          type="text"
          class="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none transition focus:border-amber-700"
          required
        />
      </label>

      <label class="grid gap-1.5 text-sm font-semibold text-stone-700">
        Description
        <textarea
          v-model="form.description"
          rows="3"
          class="resize-y rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none transition focus:border-amber-700"
        ></textarea>
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="grid gap-1.5 text-sm font-semibold text-stone-700">
          Cost
          <input
            v-model.number="form.cost"
            type="number"
            min="1"
            class="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none transition focus:border-amber-700"
            required
          />
        </label>
      </div>

      <HabitIconPicker v-model="form.icon" :icons="HABIT_ICONS" />

      <p v-if="errorMessage" class="m-0 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
        {{ errorMessage }}
      </p>

      <footer class="flex justify-end gap-2 border-t border-stone-200 pt-4">
        <button
          type="button"
          class="rounded-md border border-stone-300 px-4 py-2 font-semibold text-stone-700 transition hover:bg-stone-100 active:translate-y-px"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="rounded-md bg-amber-700 px-4 py-2 font-semibold text-white transition hover:bg-amber-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="saving"
        >
          {{ saving ? 'Saving...' : 'Save changes' }}
        </button>
      </footer>
    </form>
  </ModalShell>
</template>
