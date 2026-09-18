<script setup>
import { computed, ref } from 'vue'
import { Eye, EyeOff, LoaderCircle, LogIn } from 'lucide-vue-next'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AuthShell from '@/components/auth/AuthShell.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const registeredMessage = computed(() => route.query.registered === '1'
  ? 'Your account is ready. Sign in to continue.'
  : '')

const safeRedirect = () => {
  const redirect = route.query.redirect
  if (typeof redirect !== 'string') return '/'
  if (!redirect.startsWith('/') || redirect.startsWith('//') || redirect.startsWith('/login') || redirect.startsWith('/register')) return '/'
  return redirect
}

const getLoginError = (error) => {
  if (!error.response) return 'We could not reach the server. Check your connection and try again.'
  if (error.response.status === 401) return 'That email or password is not correct, or the account is unavailable.'
  if (error.response.status === 400) return error.response.data?.message || 'Check your email and password.'
  if (error.response.status >= 500) return 'The server is unavailable right now. Please try again.'
  return error.response.data?.message || 'We could not sign you in. Please try again.'
}

const submit = async () => {
  errorMessage.value = ''

  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Enter your email and password.'
    return
  }

  loading.value = true

  try {
    await auth.login({ email: email.value.trim(), password: password.value })
    await router.replace(safeRedirect())
  } catch (error) {
    errorMessage.value = getLoginError(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell title="Welcome back" subtitle="Sign in to return to your daily workspace.">
    <form class="mt-7 grid gap-5" novalidate @submit.prevent="submit">
      <div v-if="registeredMessage" class="border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800" role="status">
        {{ registeredMessage }}
      </div>

      <div class="grid gap-1.5">
        <label for="login-email" class="text-sm font-semibold text-stone-700">Email</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          required
          class="h-11 rounded-md border border-stone-300 bg-white px-3 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          placeholder="you@example.com"
        />
      </div>

      <div class="grid gap-1.5">
        <label for="login-password" class="text-sm font-semibold text-stone-700">Password</label>
        <div class="relative">
          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
            class="h-11 w-full rounded-md border border-stone-300 bg-white px-3 pr-11 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            placeholder="Enter your password"
          />
          <button
            type="button"
            class="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="size-4" />
            <Eye v-else class="size-4" />
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="m-0 border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800" role="alert">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        class="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-800 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loading"
      >
        <LoaderCircle v-if="loading" class="size-4 animate-spin" />
        <LogIn v-else class="size-4" />
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </button>

      <p class="m-0 text-center text-sm text-stone-500">
        New here?
        <RouterLink class="font-semibold text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:text-teal-700" to="/register">
          Create an account
        </RouterLink>
      </p>
    </form>
  </AuthShell>
</template>
