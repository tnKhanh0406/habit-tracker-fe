<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ArrowLeft, Check, Clipboard, Crown, DoorOpen, LoaderCircle,
  LogIn, Pencil, RefreshCw, ShieldCheck, Trash2, UserMinus, Users,
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/dashboard/Navbar.vue'
import ProfileModal from '@/components/ProfileModal.vue'
import InventoryModal from '@/components/inventory/InventoryModal.vue'
import { getCharacter } from '@/api/characterApi'
import {
  createParty, disbandParty, getCurrentParty, joinParty, kickPartyMember,
  leaveParty, refreshPartyInviteCode, transferPartyLeadership, updateParty,
} from '@/api/partyApi'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const character = ref(null)
const party = ref(null)
const loading = ref(true)
const action = ref('')
const error = ref('')
const message = ref('')
const createName = ref('')
const inviteCode = ref('')
const editingName = ref(false)
const partyName = ref('')
const copied = ref(false)
const showingProfile = ref(false)
const showingInventory = ref(false)

const currentUserId = computed(() => auth.user?.id)

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [partyResponse, characterResponse] = await Promise.all([getCurrentParty(), getCharacter()])
    party.value = partyResponse.status === 204 ? null : partyResponse.data
    character.value = characterResponse.data
    partyName.value = party.value?.name || ''
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Could not load party information.'
  } finally { loading.value = false }
}

const run = async (name, request, successMessage) => {
  action.value = name
  error.value = ''
  message.value = ''
  try {
    const response = await request()
    if (response?.status !== 204) {
      party.value = response.data
      partyName.value = party.value?.name || ''
    }
    message.value = successMessage
    return true
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Party action failed.'
    return false
  } finally { action.value = '' }
}

const submitCreate = async () => {
  if (!createName.value.trim()) return
  if (await run('create', () => createParty(createName.value.trim()), 'Party created.')) createName.value = ''
}

const submitJoin = async () => {
  if (!inviteCode.value.trim()) return
  if (await run('join', () => joinParty(inviteCode.value.trim()), 'Joined party.')) inviteCode.value = ''
}

const saveName = async () => {
  if (!partyName.value.trim()) return
  if (await run('rename', () => updateParty(partyName.value.trim()), 'Party name updated.')) editingName.value = false
}

const copyInvite = async () => {
  await navigator.clipboard.writeText(party.value.inviteCode)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1500)
}

const refreshInvite = () => run('invite', refreshPartyInviteCode, 'Invite code refreshed.')

const kick = (member) => {
  if (!window.confirm(`Remove ${member.username} from the party?`)) return
  run(`kick-${member.userId}`, () => kickPartyMember(member.userId), `${member.username} was removed.`)
}

const transfer = (member) => {
  if (!window.confirm(`Transfer party leadership to ${member.username}?`)) return
  run(`transfer-${member.userId}`, () => transferPartyLeadership(member.userId), `${member.username} is now the leader.`)
}

const leave = async () => {
  if (!window.confirm('Leave this party?')) return
  if (await run('leave', leaveParty, 'You left the party.')) party.value = null
}

const disband = async () => {
  if (!window.confirm('Disband this party for every member? This cannot be undone.')) return
  if (await run('disband', disbandParty, 'Party disbanded.')) party.value = null
}

const handleCharacterUpdated = (updated) => { character.value = { ...character.value, ...updated } }

onMounted(load)
</script>

<template>
  <div class="min-h-dvh pb-14 text-stone-800 antialiased">
    <Navbar :character="character" @open-profile="showingProfile = true" @open-inventory="showingInventory = true" />
    <ProfileModal v-if="showingProfile" :character="character" @close="showingProfile = false" @character-updated="handleCharacterUpdated" />
    <InventoryModal v-if="showingInventory" @close="showingInventory = false" @character-updated="handleCharacterUpdated" />

    <main class="mx-auto max-w-[1100px] px-4 py-7 sm:px-6 lg:py-10">
      <div class="border-b border-stone-300 pb-6">
        <RouterLink to="/" class="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-teal-800"><ArrowLeft class="size-3.5" />Dashboard</RouterLink>
        <div class="flex items-center gap-3">
          <div class="grid size-11 place-items-center rounded-md bg-teal-900 text-white"><Users class="size-5" /></div>
          <div><h1 class="m-0 text-2xl font-semibold tracking-tight text-stone-950">Party</h1><p class="m-0 mt-1 text-sm text-stone-500">Build a team of up to five adventurers.</p></div>
        </div>
      </div>

      <p v-if="error" role="alert" class="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ error }}</p>
      <p v-if="message" role="status" class="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{{ message }}</p>

      <div v-if="loading" class="flex items-center justify-center gap-2 py-24 text-sm font-semibold text-stone-500"><LoaderCircle class="size-5 animate-spin" />Loading party…</div>

      <div v-else-if="!party" class="mt-7 grid gap-5 md:grid-cols-2">
        <section class="rounded-lg border border-stone-200 bg-[#fbfaf7] p-6 shadow-[0_8px_24px_rgba(41,37,36,0.04)]">
          <div class="grid size-10 place-items-center rounded-md bg-teal-100 text-teal-800"><Crown class="size-5" /></div>
          <h2 class="mb-0 mt-4 text-lg font-semibold text-stone-950">Create a party</h2>
          <p class="mt-1 text-sm leading-6 text-stone-500">You become the leader and receive an invite code to share.</p>
          <form class="mt-5" @submit.prevent="submitCreate">
            <label class="text-xs font-bold uppercase tracking-wide text-stone-500">Party name</label>
            <input v-model="createName" maxlength="80" placeholder="The Habit Guild" class="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-700" />
            <button type="submit" :disabled="!createName.trim() || !!action" class="mt-4 inline-flex items-center gap-2 rounded-md bg-teal-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><LoaderCircle v-if="action === 'create'" class="size-4 animate-spin" /><Crown v-else class="size-4" />Create party</button>
          </form>
        </section>

        <section class="rounded-lg border border-stone-200 bg-[#fbfaf7] p-6 shadow-[0_8px_24px_rgba(41,37,36,0.04)]">
          <div class="grid size-10 place-items-center rounded-md bg-amber-100 text-amber-800"><LogIn class="size-5" /></div>
          <h2 class="mb-0 mt-4 text-lg font-semibold text-stone-950">Join a party</h2>
          <p class="mt-1 text-sm leading-6 text-stone-500">Enter the eight-character code shared by a party member.</p>
          <form class="mt-5" @submit.prevent="submitJoin">
            <label class="text-xs font-bold uppercase tracking-wide text-stone-500">Invite code</label>
            <input v-model="inviteCode" maxlength="12" placeholder="AB7K2P9X" class="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 font-mono text-sm uppercase tracking-[0.18em] outline-none focus:border-teal-700" />
            <button type="submit" :disabled="!inviteCode.trim() || !!action" class="mt-4 inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><LoaderCircle v-if="action === 'join'" class="size-4 animate-spin" /><LogIn v-else class="size-4" />Join party</button>
          </form>
        </section>
      </div>

      <div v-else class="mt-7 grid items-start gap-5 lg:grid-cols-[1fr_20rem]">
        <section class="rounded-lg border border-stone-200 bg-[#fbfaf7] shadow-[0_8px_24px_rgba(41,37,36,0.04)]">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-5">
            <div>
              <div v-if="editingName" class="flex items-center gap-2"><input v-model="partyName" maxlength="80" class="rounded-md border border-stone-300 bg-white px-3 py-2 text-base font-semibold outline-none focus:border-teal-700" @keyup.enter="saveName" /><button type="button" class="grid size-9 place-items-center rounded-md bg-teal-800 text-white" @click="saveName"><Check class="size-4" /></button></div>
              <div v-else class="flex items-center gap-2"><h2 class="m-0 text-xl font-semibold text-stone-950">{{ party.name }}</h2><button v-if="party.currentUserLeader" type="button" class="text-stone-400 hover:text-teal-800" aria-label="Rename party" @click="editingName = true"><Pencil class="size-4" /></button></div>
              <p class="m-0 mt-1 text-xs font-semibold uppercase tracking-wide text-stone-400">{{ party.memberCount }} / {{ party.maxMembers }} members</p>
            </div>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800"><ShieldCheck class="size-3.5" />Active party</span>
          </div>

          <div class="divide-y divide-stone-200 px-5">
            <article v-for="member in party.members" :key="member.userId" class="flex items-center gap-3 py-4">
              <div class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md bg-stone-800 text-sm font-bold text-white"><img v-if="member.avatarUrl" :src="member.avatarUrl" alt="" class="size-full object-cover" /><span v-else>{{ member.username.slice(0, 1).toUpperCase() }}</span></div>
              <div class="min-w-0 flex-1"><div class="flex items-center gap-2"><p class="m-0 truncate text-sm font-semibold text-stone-900">{{ member.username }}</p><span v-if="member.userId === currentUserId" class="text-[10px] font-bold uppercase text-stone-400">You</span></div><p class="m-0 mt-0.5 text-xs text-stone-400">Joined {{ new Date(member.joinedAt).toLocaleDateString() }}</p></div>
              <span v-if="member.role === 'LEADER'" class="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase text-amber-700"><Crown class="size-3" />Leader</span>
              <div v-else-if="party.currentUserLeader" class="flex gap-1"><button type="button" :disabled="!!action" class="rounded-md border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-50" @click="transfer(member)">Make leader</button><button type="button" :disabled="!!action" class="grid size-8 place-items-center rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50" aria-label="Remove member" @click="kick(member)"><UserMinus class="size-4" /></button></div>
            </article>
          </div>
        </section>

        <aside class="space-y-4">
          <section class="rounded-lg border border-stone-200 bg-[#fbfaf7] p-5">
            <p class="m-0 text-xs font-bold uppercase tracking-wide text-stone-400">Invite code</p>
            <div class="mt-3 flex items-center gap-2"><code class="min-w-0 flex-1 rounded-md bg-stone-100 px-3 py-2.5 text-center text-base font-bold tracking-[0.16em] text-stone-900">{{ party.inviteCode }}</code><button type="button" class="grid size-10 place-items-center rounded-md border border-stone-300 bg-white text-stone-600 hover:text-teal-800" @click="copyInvite"><Check v-if="copied" class="size-4" /><Clipboard v-else class="size-4" /></button></div>
            <button v-if="party.currentUserLeader" type="button" :disabled="!!action" class="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-teal-800 disabled:opacity-50" @click="refreshInvite"><RefreshCw :class="['size-3.5', action === 'invite' && 'animate-spin']" />Generate a new code</button>
          </section>

          <section class="rounded-lg border border-stone-200 bg-[#fbfaf7] p-5">
            <p class="m-0 text-xs font-bold uppercase tracking-wide text-stone-400">Party management</p>
            <p class="mt-2 text-xs leading-5 text-stone-500">Only the leader can rename the party, remove members, refresh the invite code or transfer leadership.</p>
            <button v-if="party.currentUserLeader" type="button" :disabled="!!action" class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50" @click="disband"><Trash2 class="size-4" />Disband party</button>
            <button v-else type="button" :disabled="!!action" class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-50" @click="leave"><DoorOpen class="size-4" />Leave party</button>
          </section>
        </aside>
      </div>
    </main>
  </div>
</template>
