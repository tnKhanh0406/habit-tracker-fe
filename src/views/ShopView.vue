<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ArrowLeft, Box, Coins, Droplets, Gem, Heart, LoaderCircle,
  PackageOpen, Search, Shield, ShoppingBag, Sparkles, Sword,
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/dashboard/Navbar.vue'
import ProfileModal from '@/components/ProfileModal.vue'
import InventoryModal from '@/components/inventory/InventoryModal.vue'
import { getCharacter } from '@/api/characterApi'
import { getShopListings, purchaseShopItem } from '@/api/shopApi'

const character = ref(null)
const listings = ref([])
const loading = ref(true)
const error = ref('')
const message = ref('')
const search = ref('')
const filter = ref('ALL')
const buyingId = ref(null)
const quantities = ref({})
const showingProfile = ref(false)
const showingInventory = ref(false)

const filters = ['ALL', 'EQUIPMENT', 'CONSUMABLE']
const visibleListings = computed(() => listings.value.filter((listing) => {
  const matchesType = filter.value === 'ALL' || listing.itemType === filter.value
  const query = search.value.trim().toLocaleLowerCase()
  const matchesQuery = !query || `${listing.name} ${listing.description || ''} ${listing.rarity}`
    .toLocaleLowerCase().includes(query)
  return matchesType && matchesQuery
}))

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [shopResponse, characterResponse] = await Promise.all([getShopListings(), getCharacter()])
    listings.value = shopResponse.data || []
    character.value = characterResponse.data
    listings.value.forEach((listing) => { quantities.value[listing.listingId] ||= 1 })
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Could not load the shop.'
  } finally { loading.value = false }
}

const refreshListings = async () => {
  listings.value = (await getShopListings()).data || []
}

const handleCharacterUpdated = async (updatedCharacter) => {
  character.value = { ...character.value, ...updatedCharacter }
  await refreshListings()
}

const buy = async (listing) => {
  buyingId.value = listing.listingId
  error.value = ''
  message.value = ''
  const quantity = listing.itemType === 'CONSUMABLE' ? Number(quantities.value[listing.listingId] || 1) : 1
  const idempotencyKey = crypto.randomUUID()
  try {
    const result = (await purchaseShopItem(listing.listingId, quantity, idempotencyKey)).data
    character.value = { ...character.value, coin: result.coin, gem: result.gem }
    message.value = `Purchased ${quantity > 1 ? `${quantity} × ` : ''}${listing.name}.`
    await refreshListings()
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Purchase failed.'
  } finally { buyingId.value = null }
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
  ].filter(([, value]) => Number(value) > 0).map(([name, value]) => `+${value} ${name}`)
  if (Number(equipment.bossDamagePercent) > 0) stats.push(`+${equipment.bossDamagePercent}% boss damage`)
  return stats.join(' · ')
}

const rarityClass = (rarity) => ({
  COMMON: 'bg-stone-100 text-stone-600', UNCOMMON: 'bg-emerald-50 text-emerald-700',
  RARE: 'bg-blue-50 text-blue-700', EPIC: 'bg-violet-50 text-violet-700',
  LEGENDARY: 'bg-amber-50 text-amber-700',
}[rarity] || 'bg-stone-100 text-stone-600')

onMounted(load)
</script>

<template>
  <div class="min-h-dvh pb-14 text-stone-800 antialiased">
    <Navbar :character="character" @open-profile="showingProfile = true" @open-inventory="showingInventory = true" />
    <ProfileModal v-if="showingProfile" :character="character" @close="showingProfile = false" @character-updated="handleCharacterUpdated" />
    <InventoryModal v-if="showingInventory" @close="showingInventory = false" @character-updated="handleCharacterUpdated" />

    <main class="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:py-10">
      <div class="flex flex-col justify-between gap-5 border-b border-stone-300 pb-6 sm:flex-row sm:items-end">
        <div>
          <RouterLink to="/" class="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-teal-800"><ArrowLeft class="size-3.5" />Dashboard</RouterLink>
          <div class="flex items-center gap-3">
            <div class="grid size-11 place-items-center rounded-md bg-teal-900 text-white"><ShoppingBag class="size-5" /></div>
            <div><h1 class="m-0 text-2xl font-semibold tracking-tight text-stone-950">Adventurer's Shop</h1><p class="m-0 mt-1 text-sm text-stone-500">Spend rewards on supplies and class equipment.</p></div>
          </div>
        </div>
        <div class="flex gap-2">
          <div class="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800"><Coins class="size-4" />{{ character?.coin?.toLocaleString() ?? '—' }}</div>
          <div class="flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-800"><Gem class="size-4" />{{ character?.gem?.toLocaleString() ?? '—' }}</div>
        </div>
      </div>

      <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex gap-1 rounded-md bg-stone-200/70 p-1">
          <button v-for="option in filters" :key="option" type="button" :class="['rounded px-4 py-2 text-xs font-bold transition', filter === option ? 'bg-white text-teal-900 shadow-sm' : 'text-stone-500 hover:text-stone-800']" @click="filter = option">{{ option === 'ALL' ? 'All items' : option === 'EQUIPMENT' ? 'Equipment' : 'Consumables' }}</button>
        </div>
        <label class="flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 sm:w-72"><Search class="size-4 text-stone-400" /><input v-model="search" type="search" placeholder="Search shop…" class="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none" /></label>
      </div>

      <p v-if="error" role="alert" class="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ error }}</p>
      <p v-if="message" role="status" class="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{{ message }}</p>

      <div v-if="loading" class="flex items-center justify-center gap-2 py-24 text-sm font-semibold text-stone-500"><LoaderCircle class="size-5 animate-spin" />Loading shop…</div>
      <div v-else-if="!visibleListings.length" class="grid place-items-center gap-2 py-24 text-center text-stone-500"><PackageOpen class="size-10 text-stone-300" /><p class="m-0 text-sm font-semibold">No items match this filter.</p></div>
      <div v-else class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="listing in visibleListings" :key="listing.listingId" class="flex min-h-64 flex-col rounded-lg border border-stone-200 bg-[#fbfaf7] p-4 shadow-[0_8px_24px_rgba(41,37,36,0.04)]">
          <div class="flex items-start gap-3">
            <div class="grid size-12 shrink-0 place-items-center rounded-md border border-stone-200 bg-white"><component :is="itemIcon(listing)" class="size-5 text-teal-800" /></div>
            <div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-2"><h2 class="m-0 text-base font-semibold text-stone-950">{{ listing.name }}</h2><span :class="['rounded px-1.5 py-0.5 text-[10px] font-bold uppercase', rarityClass(listing.rarity)]">{{ listing.rarity }}</span></div><p class="m-0 mt-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">{{ listing.equipment?.slot || listing.itemType }} · Owned {{ listing.ownedQuantity }}/{{ listing.maxStack }}</p></div>
          </div>
          <p class="mt-3 text-sm leading-5 text-stone-600">{{ listing.description }}</p>
          <p v-if="listing.equipment" class="mt-2 text-xs font-bold text-teal-700">{{ equipmentStats(listing.equipment) }}</p>
          <p v-if="listing.consumable" class="mt-2 text-xs font-bold text-teal-700">Restores {{ listing.consumable.effectValue }} {{ listing.consumable.effectType === 'RESTORE_HP' ? 'HP' : 'MP' }}</p>
          <div class="mt-auto flex items-end justify-between gap-3 pt-5">
            <div><div class="flex gap-2 text-sm font-bold"><span v-if="listing.priceCoin" class="inline-flex items-center gap-1 text-amber-700"><Coins class="size-4" />{{ listing.priceCoin }}</span><span v-if="listing.priceGem" class="inline-flex items-center gap-1 text-teal-700"><Gem class="size-4" />{{ listing.priceGem }}</span></div><p v-if="listing.unavailableReason" class="m-0 mt-1 text-xs font-semibold text-red-600">{{ listing.unavailableReason }}</p><p v-else-if="listing.requiredLevel > 1" class="m-0 mt-1 text-xs text-stone-400">Level {{ listing.requiredLevel }}+</p></div>
            <div class="flex items-center gap-2">
              <select v-if="listing.itemType === 'CONSUMABLE' && listing.canPurchase" v-model.number="quantities[listing.listingId]" class="rounded-md border border-stone-300 bg-white px-2 py-2 text-xs font-semibold"><option v-for="amount in Math.min(5, listing.maxStack - listing.ownedQuantity)" :key="amount" :value="amount">×{{ amount }}</option></select>
              <button type="button" :disabled="!listing.canPurchase || !!buyingId" class="rounded-md bg-teal-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300" @click="buy(listing)"><LoaderCircle v-if="buyingId === listing.listingId" class="mr-1 inline size-3 animate-spin" />Buy</button>
            </div>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>
