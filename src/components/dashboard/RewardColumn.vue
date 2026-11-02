<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { BookOpen, CheckCircle, Coffee, Coins, Gamepad2, Gift, Info, MoreVertical, Send, Trash2, Tv } from 'lucide-vue-next'
import { createRewardWithName, deleteReward, redeemReward } from '@/api/rewardApi'
import DeleteRewardConfirmModal from '@/components/rewards/DeleteRewardConfirmModal.vue'

const props = defineProps({
  rewards: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['reward-created', 'reward-redeemed', 'reward-information', 'reward-deleted'])

const activeFilter = ref('Custom Rewards')
const newRewardName = ref('')
const isAdding = ref(false)
const rewardInputRef = ref(null)
const redeemedId = ref(null)
const redeemingId = ref(null)
const activeMenuRewardId = ref(null)
const deletingId = ref(null)
const rewardToDelete = ref(null)
const errorMessage = ref('')

const focusInput = () => {
  rewardInputRef.value?.focus()
}

defineExpose({ focusInput })

const handleAddReward = async () => {
  if (!newRewardName.value.trim() || isAdding.value) return
  isAdding.value = true
  try {
    const res = await createRewardWithName(newRewardName.value.trim())
    emit('reward-created', res.data)
    newRewardName.value = ''
  } catch (err) {
    console.error('Failed to create reward:', err)
  } finally {
    isAdding.value = false
  }
}

const handleRedeem = async (reward) => {
  if (!reward?.id || redeemingId.value) return

  redeemingId.value = reward.id
  errorMessage.value = ''

  try {
    const response = await redeemReward(reward.id)
    redeemedId.value = reward.id
    emit('reward-redeemed', { reward, coin: Number(response.data) })
    window.setTimeout(() => {
      if (redeemedId.value === reward.id) redeemedId.value = null
    }, 2000)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Redeem reward failed.'
  } finally {
    redeemingId.value = null
  }
}

const toggleRewardMenu = (rewardId) => {
  activeMenuRewardId.value = activeMenuRewardId.value === rewardId ? null : rewardId
}

const closeRewardMenu = () => {
  activeMenuRewardId.value = null
}

const requestDelete = (reward) => {
  rewardToDelete.value = reward
  closeRewardMenu()
}

const closeDeleteReward = () => {
  if (deletingId.value) return
  rewardToDelete.value = null
}

const confirmDelete = async () => {
  if (!rewardToDelete.value || deletingId.value) return

  deletingId.value = rewardToDelete.value.id
  errorMessage.value = ''

  try {
    await deleteReward(rewardToDelete.value.id)
    emit('reward-deleted', rewardToDelete.value.id)
    rewardToDelete.value = null
  } catch (error) {
    console.error('Failed to delete reward:', error)
    errorMessage.value = error.response?.data?.message || error.message || 'Delete reward failed.'
  } finally {
    deletingId.value = null
  }
}

const handleDocumentClick = (event) => {
  if (!event.target.closest?.('[data-reward-menu]')) {
    closeRewardMenu()
  }
}

const getRewardIcon = (iconName, name) => {
  const str = (iconName || name || '').toLowerCase()
  if (str.includes('tea') || str.includes('coffee') || str.includes('drink')) return Coffee
  if (str.includes('book') || str.includes('read')) return BookOpen
  if (str.includes('game') || str.includes('play')) return Gamepad2
  if (str.includes('movie') || str.includes('tv')) return Tv
  return Gift
}

const filteredRewards = computed(() => {
  return props.rewards.filter((reward) => {
    const typeStr = (reward.type || '').toUpperCase()
    if (activeFilter.value === 'Custom Rewards') return typeStr === 'CUSTOM' || !reward.type
    if (activeFilter.value === 'System Rewards') return typeStr === 'SYSTEM'
    return true
  })
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <section class="flex h-full flex-col border border-stone-300/80 bg-[#fbfaf7] p-4">
    <div class="mb-4 flex items-center justify-between gap-3 border-b border-stone-200 pb-3">
      <div class="flex items-center gap-2">
        <Gift class="size-4.5 text-amber-700" />
        <h3 class="m-0 text-base font-semibold tracking-[-0.01em] text-stone-950">Rewards</h3>
      </div>

      <div class="flex items-center gap-0.5 rounded-md bg-stone-100 p-0.5 text-xs font-medium">
        <button
          v-for="tab in ['Custom Rewards', 'System Rewards']"
          :key="tab"
          type="button"
          :class="[
            'whitespace-nowrap rounded-sm px-2.5 py-1 transition active:translate-y-px',
            activeFilter === tab ? 'bg-white text-amber-900 shadow-sm' : 'text-stone-500 hover:text-stone-900',
          ]"
          @click="activeFilter = tab"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <div class="relative mb-2">
      <input
        ref="rewardInputRef"
        v-model="newRewardName"
        type="text"
        placeholder="Add a new reward"
        class="h-10 w-full rounded-md border border-stone-300 bg-white pl-3.5 pr-10 text-sm font-medium text-stone-800 placeholder:text-stone-400 transition focus:border-amber-700 focus:outline-none"
        @keyup.enter="handleAddReward"
      />
      <button
        type="button"
        class="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-sm bg-amber-700 text-white transition hover:bg-amber-600 active:translate-y-[-45%] disabled:cursor-not-allowed disabled:opacity-30"
        :disabled="!newRewardName.trim() || isAdding"
        @click="handleAddReward"
      >
        <Send class="size-3.5" />
      </button>
    </div>

    <p v-if="errorMessage" class="m-0 mb-2 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
      {{ errorMessage }}
    </p>

    <div class="min-h-0 flex-1 divide-y divide-stone-200 overflow-y-auto">
      <article
        v-for="reward in filteredRewards"
        :key="reward.id"
        class="group relative py-4 pr-9 transition hover:bg-amber-50/60"
      >
        <div class="absolute right-0 top-3 z-20" data-reward-menu>
          <button
            type="button"
            class="grid size-8 place-items-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-stone-800"
            title="Options"
            @click="toggleRewardMenu(reward.id)"
          >
            <MoreVertical class="size-4" />
          </button>

          <div
            v-if="activeMenuRewardId === reward.id"
            class="absolute right-0 top-full z-30 mt-1 w-40 rounded-md border border-stone-200 bg-white p-1 shadow-[0_18px_40px_rgba(41,37,36,0.12)]"
          >
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
              @click="activeMenuRewardId = null; emit('reward-information', reward)"
            >
              <Info class="size-4 text-amber-700" />
              Information
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
              :disabled="deletingId === reward.id"
              @click="requestDelete(reward)"
            >
              <Trash2 class="size-4" />
              {{ deletingId === reward.id ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <div class="grid size-11 shrink-0 place-items-center rounded-md border border-amber-800/15 bg-amber-50 text-amber-800">
              <component :is="getRewardIcon(reward.icon, reward.name)" class="size-5" />
            </div>

            <div class="min-w-0 flex-1">
              <h4 class="m-0 truncate text-sm font-semibold text-stone-950">
                {{ reward.name }}
              </h4>

              <p v-if="reward.description" class="m-0 mt-0.5 truncate text-xs font-medium text-stone-500">
                {{ reward.description }}
              </p>
              <p v-else class="m-0 mt-0.5 text-xs text-stone-400">
                {{ reward.type === 'SYSTEM' ? 'System reward' : 'Custom reward' }}
              </p>

              <div class="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-700">
                <Coins class="size-3.5" />
                <span>{{ reward.cost || 100 }} coins</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            :class="[
              'shrink-0 rounded-md px-3 py-2 text-xs font-semibold transition active:translate-y-px disabled:cursor-wait disabled:opacity-60',
              redeemedId === reward.id
                ? 'bg-emerald-700 text-white'
                : 'border border-stone-300 bg-white text-stone-700 hover:border-amber-700 hover:text-amber-800',
            ]"
            :disabled="redeemingId === reward.id"
            @click="handleRedeem(reward)"
          >
            <span class="inline-flex items-center gap-1">
              <CheckCircle v-if="redeemedId === reward.id" class="size-3.5" />
              {{ redeemedId === reward.id ? 'Redeemed' : 'Redeem' }}
            </span>
          </button>
        </div>
      </article>

      <div v-if="filteredRewards.length === 0" class="py-10 text-center text-sm font-medium text-stone-500">
        No rewards match this view.
      </div>
    </div>

    <DeleteRewardConfirmModal
      v-if="rewardToDelete"
      :reward="rewardToDelete"
      :deleting="deletingId === rewardToDelete.id"
      @confirm="confirmDelete"
      @cancel="closeDeleteReward"
    />
  </section>
</template>
