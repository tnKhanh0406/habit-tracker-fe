<script setup>
import { computed, onMounted, ref } from 'vue'
import { Box, Droplets, Heart, LoaderCircle, PackageOpen, Shield, Sparkles, Sword } from 'lucide-vue-next'
import ModalShell from '@/components/common/ModalShell.vue'
import { equipInventoryItem, getInventory, unequipInventoryItem, useInventoryItem } from '@/api/inventoryApi'

const emit = defineEmits(['close', 'character-updated'])
const items = ref([])
const loading = ref(true)
const usingId = ref(null)
const changingEquipmentId = ref(null)
const error = ref('')
const message = ref('')
const filter = ref('ALL')

const filters = ['ALL', 'EQUIPMENT', 'CONSUMABLE']
const visibleItems = computed(() => filter.value === 'ALL'
  ? items.value
  : items.value.filter((item) => item.itemType === filter.value))

const load = async () => {
  loading.value = true
  error.value = ''
  try { items.value = (await getInventory()).data || [] }
  catch (requestError) { error.value = requestError.response?.data?.message || 'Could not load inventory.' }
  finally { loading.value = false }
}

const useItem = async (item) => {
  usingId.value = item.inventoryItemId
  error.value = ''
  message.value = ''
  try {
    const result = (await useInventoryItem(item.inventoryItemId)).data
    item.quantity = result.remainingQuantity
    items.value = items.value.filter((entry) => entry.quantity > 0)
    emit('character-updated', result.character)
    message.value = `${item.name} used.`
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Could not use item.'
  } finally { usingId.value = null }
}

const changeEquipment = async (item) => {
  changingEquipmentId.value = item.inventoryItemId
  error.value = ''
  message.value = ''
  try {
    const request = item.equipped ? unequipInventoryItem : equipInventoryItem
    const character = (await request(item.inventoryItemId)).data
    await load()
    emit('character-updated', character)
    message.value = `${item.name} ${item.equipped ? 'unequipped' : 'equipped'}.`
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Could not change equipment.'
  } finally { changingEquipmentId.value = null }
}

const itemIcon = (item) => {
  if (item.consumable?.effectType === 'RESTORE_HP') return Heart
  if (item.consumable?.effectType === 'RESTORE_MP') return Droplets
  if (item.equipment?.slot === 'WEAPON') return Sword
  if (item.equipment?.slot === 'ARMOR') return Shield
  if (item.equipment?.slot === 'ACCESSORY') return Sparkles
  return Box
}

const equipmentStats = (equipment) => {
  if (!equipment) return ''
  const stats = [
    ['STR', equipment.strengthBonus], ['INT', equipment.intelligenceBonus],
    ['VIT', equipment.vitalityBonus], ['AGI', equipment.agilityBonus],
    ['HP', equipment.maxHpBonus], ['MP', equipment.maxMpBonus],
  ].filter(([, value]) => value > 0).map(([name, value]) => `+${value} ${name}`)
  if (Number(equipment.bossDamagePercent) > 0) stats.push(`+${equipment.bossDamagePercent}% boss damage`)
  return stats.join(' · ')
}

onMounted(load)
</script>

<template>
  <ModalShell title="Inventory" subtitle="Your equipment and consumable items." @close="emit('close')">
    <div class="space-y-4 p-5">
      <div class="flex gap-1 rounded-md bg-stone-100 p-1">
        <button v-for="option in filters" :key="option" type="button"
          :class="['flex-1 rounded px-3 py-1.5 text-xs font-semibold transition', filter === option ? 'bg-white text-teal-800 shadow-sm' : 'text-stone-500']"
          @click="filter = option">{{ option === 'ALL' ? 'All' : option === 'EQUIPMENT' ? 'Equipment' : 'Consumables' }}</button>
      </div>

      <p v-if="error" role="alert" class="rounded bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <p v-if="message" role="status" class="rounded bg-teal-50 p-3 text-sm text-teal-700">{{ message }}</p>
      <div v-if="loading" class="flex items-center justify-center gap-2 py-10 text-sm text-stone-500"><LoaderCircle class="size-4 animate-spin" />Loading inventory…</div>
      <div v-else-if="!visibleItems.length" class="grid place-items-center gap-2 py-10 text-center text-stone-500">
        <PackageOpen class="size-8 text-stone-300" /><p class="text-sm">No items in this category.</p>
      </div>
      <div v-else class="grid gap-3 sm:grid-cols-2">
        <article v-for="item in visibleItems" :key="item.inventoryItemId" :class="['flex flex-col rounded-md border bg-white p-3', item.equipped ? 'border-teal-500 ring-1 ring-teal-100' : 'border-stone-200']">
          <div class="flex gap-3">
            <div class="grid size-10 shrink-0 place-items-center rounded-md bg-stone-100"><component :is="itemIcon(item)" class="size-5 text-teal-700" /></div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2"><h3 class="m-0 text-sm font-semibold text-stone-900">{{ item.name }}</h3><span v-if="item.equipped" class="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-teal-800">Equipped</span><span v-else class="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-semibold">×{{ item.quantity }}</span></div>
              <p class="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">{{ item.rarity }} · {{ item.equipment?.slot || item.itemType }}</p>
            </div>
          </div>
          <p class="mt-2 text-xs leading-5 text-stone-500">{{ item.description }}</p>
          <p v-if="item.equipment" class="mt-2 text-xs font-semibold text-teal-700">{{ equipmentStats(item.equipment) }}</p>
          <p v-if="item.consumable" class="mt-2 text-xs font-semibold text-teal-700">Restore {{ item.consumable.effectValue }} {{ item.consumable.effectType === 'RESTORE_HP' ? 'HP' : 'MP' }}</p>
          <button v-if="item.itemType === 'CONSUMABLE'" type="button" :disabled="!!usingId" class="mt-auto self-end rounded-md bg-teal-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" @click="useItem(item)">
            <LoaderCircle v-if="usingId === item.inventoryItemId" class="mr-1 inline size-3 animate-spin" />Use
          </button>
          <button v-else type="button" :disabled="!!changingEquipmentId" :class="['mt-auto self-end rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50', item.equipped ? 'border border-stone-300 text-stone-600' : 'bg-teal-800 text-white']" @click="changeEquipment(item)">
            <LoaderCircle v-if="changingEquipmentId === item.inventoryItemId" class="mr-1 inline size-3 animate-spin" />{{ item.equipped ? 'Unequip' : 'Equip' }}
          </button>
        </article>
      </div>
    </div>
  </ModalShell>
</template>
