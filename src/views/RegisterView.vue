<script setup>
import { ref } from 'vue'
import { Eye, EyeOff, LoaderCircle, UserPlus } from 'lucide-vue-next'
import { RouterLink, useRouter } from 'vue-router'
import AuthShell from '@/components/auth/AuthShell.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const usernamePattern = /^[A-Za-z0-9_]+$/

const passwordByteLength = (value) => new TextEncoder().encode(value).length

const validate = () => {
  if (!usernamePattern.test(username.value) || username.value.length < 3 || username.value.length > 30) {
    return 'Username must be 3-30 characters using only letters, numbers or underscores.'
  }
  if (email.value.length > 254 || !emailPattern.test(email.value)) {
    return 'Enter a valid email address.'
  }
  if (password.value.length < 12 || password.value.length > 72 || passwordByteLength(password.value) > 72) {
    return 'Password must be 12-72 characters and no more than 72 UTF-8 bytes.'
  }
  if (confirmPassword.value !== password.value) {
    return 'Passwords do not match.'
  }
  return ''
}

const getRegisterError = (error) => {
  if (!error.response) return 'We could not reach the server. Check your connection and try again.'
  if (error.response.status === 409) return 'That email or username is already in use.'
  if (error.response.status === 400) return error.response.data?.message || 'Check the information you entered.'
  if (error.response.status >= 500) return 'The server is unavailable right now. Please try again.'
  return error.response.data?.message || 'We could not create your account. Please try again.'
}

const submit = async () => {
  errorMessage.value = validate()
  if (errorMessage.value) return

  loading.value = true

  try {
    await auth.register({
      username: username.value,
      email: email.value.trim(),
      password: password.value,
    })
    await router.replace({ name: 'login', query: { registered: '1' } })
  } catch (error) {
    errorMessage.value = getRegisterError(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell title="Create your account" subtitle="Set up a private space for your habits, tasks and rewards.">
    <form class="mt-7 grid gap-4" novalidate @submit.prevent="submit">
      <div class="grid gap-1.5">
        <label for="register-username" class="text-sm font-semibold text-stone-700">Username</label>
        <input
          id="register-username"
          v-model="username"
          type="text"
          autocomplete="username"
          maxlength="30"
          required
          class="h-11 rounded-md border border-stone-300 bg-white px-3 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          placeholder="your_username"
        />
      </div>

      <div class="grid gap-1.5">
        <label for="register-email" class="text-sm font-semibold text-stone-700">Email</label>
        <input
          id="register-email"
          v-model="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          maxlength="254"
          required
          class="h-11 rounded-md border border-stone-300 bg-white px-3 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          placeholder="you@example.com"
        />
      </div>

      <div class="grid gap-1.5">
        <label for="register-password" class="text-sm font-semibold text-stone-700">Password</label>
        <div class="relative">
          <input
            id="register-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            required
            class="h-11 w-full rounded-md border border-stone-300 bg-white px-3 pr-11 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            placeholder="At least 12 characters"
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

      <div class="grid gap-1.5">
        <label for="register-confirm-password" class="text-sm font-semibold text-stone-700">Confirm password</label>
        <div class="relative">
          <input
            id="register-confirm-password"
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            autocomplete="new-password"
            required
            class="h-11 w-full rounded-md border border-stone-300 bg-white px-3 pr-11 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            placeholder="Enter it again"
          />
          <button
            type="button"
            class="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <EyeOff v-if="showConfirmPassword" class="size-4" />
            <Eye v-else class="size-4" />
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="m-0 border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800" role="alert">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        class="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-800 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loading"
      >
        <LoaderCircle v-if="loading" class="size-4 animate-spin" />
        <UserPlus v-else class="size-4" />
        {{ loading ? 'Creating account...' : 'Create account' }}
      </button>

      <p class="m-0 text-center text-sm text-stone-500">
        Already have an account?
        <RouterLink class="font-semibold text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:text-teal-700" to="/login">
          Sign in
        </RouterLink>
      </p>
    </form>
  </AuthShell>
</template>
