<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const forbiddenMessage = ref('')
let forbiddenTimer

const handleUnauthorized = () => auth.handleUnauthorized()
const handleForbidden = (event) => {
  forbiddenMessage.value = event.detail?.message || 'You do not have permission to perform that action.'
  window.clearTimeout(forbiddenTimer)
  forbiddenTimer = window.setTimeout(() => {
    forbiddenMessage.value = ''
  }, 5000)
}

onMounted(() => {
  window.addEventListener('auth:unauthorized', handleUnauthorized)
  window.addEventListener('auth:forbidden', handleForbidden)
})

onUnmounted(() => {
  window.removeEventListener('auth:unauthorized', handleUnauthorized)
  window.removeEventListener('auth:forbidden', handleForbidden)
  window.clearTimeout(forbiddenTimer)
})
</script>

<template>
  <div v-if="auth.status === 'initializing' && !auth.authError" class="grid min-h-dvh place-items-center bg-[#f6f3ee] px-6 text-center text-stone-700">
    <div>
      <div class="mx-auto mb-4 grid size-12 place-items-center rounded-md bg-teal-800 text-white">HT</div>
      <p class="m-0 text-sm font-semibold">Checking your session...</p>
    </div>
  </div>

  <div v-else-if="auth.authError && !route.meta.public" class="grid min-h-dvh place-items-center bg-[#f6f3ee] px-6 text-center">
    <div class="max-w-md border border-red-200 bg-[#fbfaf7] p-6 shadow-[0_18px_40px_rgba(41,37,36,0.08)]">
      <p class="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-red-700">Connection problem</p>
      <h1 class="m-0 mt-2 text-xl font-semibold text-stone-950">We could not verify your session</h1>
      <p class="m-0 mt-2 text-sm leading-6 text-stone-600">{{ auth.authError }}</p>
      <button type="button" class="mt-5 rounded-md bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700" @click="auth.loadCurrentUser(true)">
        Try again
      </button>
    </div>
  </div>

  <div v-else class="relative">
    <div v-if="forbiddenMessage" class="fixed right-4 top-4 z-[70] max-w-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 shadow-[0_18px_40px_rgba(41,37,36,0.12)]" role="status">
      {{ forbiddenMessage }}
    </div>
    <RouterView />
  </div>
</template>
