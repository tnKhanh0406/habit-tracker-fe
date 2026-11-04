<script setup>
import { computed, ref, onUnmounted } from 'vue'
import ModalShell from '@/components/common/ModalShell.vue'
import { updateProfile, uploadProfileAvatar } from '@/api/profileApi'
import { selectCharacterClass } from '@/api/characterApi'
import { useAuthStore } from '@/stores/auth'
const props = defineProps({ character: Object })
const emit = defineEmits(['close', 'character-updated'])
const auth = useAuthStore()
const form = ref({ username: auth.user?.username || '', avatarUrl: auth.user?.avatarUrl || '', timezone: auth.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone })
const selectedClass = ref(props.character?.characterClass || 'WARRIOR')
const busy = ref(false)
const error = ref('')
const message = ref('')
const avatarFile = ref(null)
const avatarPreview = ref(form.value.avatarUrl)
let localPreviewUrl = null
const now = ref(Date.now())
const timer = setInterval(() => { now.value = Date.now() }, 1000)
onUnmounted(() => {
  clearInterval(timer)
  if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
})
const remaining = computed(() => Math.max(0, new Date(props.character?.nextClassChangeAt || 0).getTime() - now.value))
const waitLabel = computed(() => {
  const hours = Math.ceil(remaining.value / 3600000)
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
})
const save = async () => {
  busy.value = true; error.value = ''; message.value = ''
  try { auth.user = (await updateProfile(form.value)).data; message.value = 'Profile saved.' }
  catch (e) { error.value = e.response?.data?.message || 'Could not save profile.' }
  finally { busy.value = false }
}
const selectAvatar = (event) => {
  const file = event.target.files?.[0]
  error.value = ''
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    error.value = 'Choose a JPEG, PNG, or WebP image up to 5 MB.'
    event.target.value = ''
    return
  }
  if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
  localPreviewUrl = URL.createObjectURL(file)
  avatarPreview.value = localPreviewUrl
  avatarFile.value = file
}
const uploadAvatar = async () => {
  if (!avatarFile.value) return
  busy.value = true; error.value = ''; message.value = ''
  try {
    auth.user = (await uploadProfileAvatar(avatarFile.value)).data
    form.value.avatarUrl = auth.user.avatarUrl || ''
    avatarPreview.value = auth.user.avatarUrl
    avatarFile.value = null
    message.value = 'Avatar uploaded.'
  } catch (e) { error.value = e.response?.data?.message || 'Could not upload avatar.' }
  finally { busy.value = false }
}
const changeClass = async () => {
  busy.value = true; error.value = ''; message.value = ''
  try { emit('character-updated', (await selectCharacterClass(selectedClass.value)).data); message.value = 'Class updated.' }
  catch (e) { error.value = e.response?.data?.message || 'Could not change class.' }
  finally { busy.value = false }
}
</script>
<template>
  <ModalShell title="Profile" subtitle="Manage your account and character class." @close="emit('close')">
    <div class="space-y-5 p-5">
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <p v-if="message" role="status" class="text-sm text-teal-700">{{ message }}</p>
      <form class="grid gap-3" @submit.prevent="save">
        <div class="flex items-center gap-4 rounded border border-stone-200 bg-stone-50 p-3">
          <div class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-stone-800 text-xl font-semibold text-white">
            <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar preview" class="size-full object-cover" />
            <span v-else>{{ form.username.slice(0, 1).toUpperCase() }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <label class="block text-sm font-semibold text-stone-700">Profile photo</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" class="mt-1 block w-full text-xs text-stone-500 file:mr-3 file:rounded file:border-0 file:bg-stone-200 file:px-3 file:py-2 file:font-semibold" @change="selectAvatar" />
            <p class="mt-1 text-xs text-stone-500">JPEG, PNG or WebP · maximum 5 MB</p>
            <button v-if="avatarFile" type="button" :disabled="busy" class="mt-2 rounded bg-teal-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" @click="uploadAvatar">{{ busy ? 'Uploading…' : 'Upload photo' }}</button>
          </div>
        </div>
        <label class="grid gap-1 text-sm">Email<input :value="auth.user?.email" disabled class="rounded border border-stone-200 bg-stone-100 p-2" /></label>
        <label class="grid gap-1 text-sm">Display name<input v-model="form.username" required maxlength="100" class="rounded border border-stone-300 p-2" /></label>
        <label class="grid gap-1 text-sm">Timezone<input v-model="form.timezone" required placeholder="Asia/Ho_Chi_Minh" class="rounded border border-stone-300 p-2" /></label>
        <button :disabled="busy" class="justify-self-end rounded bg-teal-800 px-4 py-2 text-sm text-white disabled:opacity-50">Save profile</button>
      </form>
      <section v-if="character" class="space-y-3 border-t border-stone-200 pt-4">
        <h3 class="font-semibold">Character class</h3>
        <p class="text-sm text-stone-500">You can change class once every 7 days. Changing class ends your active skill effects.</p>
        <select v-model="selectedClass" :disabled="busy || remaining > 0" class="w-full rounded border border-stone-300 p-2">
          <option v-for="item in ['WARRIOR', 'MAGE', 'RANGER', 'CLERIC']" :key="item" :value="item">{{ item }}</option>
        </select>
        <p v-if="remaining > 0" class="text-sm text-stone-500">Available in {{ waitLabel }} · {{ new Date(character.nextClassChangeAt).toLocaleString() }}</p>
        <button :disabled="busy || remaining > 0 || selectedClass === character.characterClass" class="rounded bg-teal-800 px-4 py-2 text-sm text-white disabled:opacity-50" @click="changeClass">Change class</button>
      </section>
    </div>
  </ModalShell>
</template>
