<script setup>
import { computed, ref } from 'vue'
import {
  Bell,
  Briefcase,
  CheckSquare,
  Coins,
  Crown,
  Gem,
  LayoutDashboard,
  ShoppingBag,
  Trophy,
  Users,
  LogOut,
  Menu,
  X,
} from 'lucide-vue-next'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const isMenuOpen = ref(false)

const props = defineProps({
  character: {
    type: Object,
    default: null,
  },
})

const displayName = computed(() => auth.user?.username || auth.user?.email || 'Account')
const initials = computed(() => displayName.value.slice(0, 1).toUpperCase())

const logout = async () => {
  auth.logout()
  isMenuOpen.value = false
  await router.replace({ name: 'login' })
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-stone-300/70 bg-[#f8f6f1]/90 backdrop-blur-md">
    <div class="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <div class="flex min-w-0 items-center gap-7">
        <div class="flex min-w-0 items-center gap-3">
          <div class="grid size-9 place-items-center rounded-md border border-teal-800/15 bg-teal-800 text-white">
            <Crown class="size-4.5" />
          </div>
          <span class="truncate text-lg font-semibold tracking-[-0.01em] text-stone-950">
            Habit Tracker
          </span>
        </div>

        <nav class="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 rounded-md bg-teal-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-800 active:translate-y-px"
          >
            <LayoutDashboard class="size-4" />
            Dashboard
          </RouterLink>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-stone-200/70 hover:text-stone-950 active:translate-y-px"
          >
            <CheckSquare class="size-4 text-stone-400" />
            Tasks
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-stone-200/70 hover:text-stone-950 active:translate-y-px"
          >
            <Trophy class="size-4 text-stone-400" />
            Achievements
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-stone-200/70 hover:text-stone-950 active:translate-y-px"
          >
            <Users class="size-4 text-stone-400" />
            Party
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-stone-200/70 hover:text-stone-950 active:translate-y-px"
          >
            <ShoppingBag class="size-4 text-stone-400" />
            Shop
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-stone-200/70 hover:text-stone-950 active:translate-y-px"
          >
            <Briefcase class="size-4 text-stone-400" />
            Inventory
          </button>
        </nav>
      </div>

      <div class="flex shrink-0 items-center gap-2 sm:gap-3">
        <div class="hidden items-center gap-3 border-r border-stone-300 pr-3 sm:flex">
          <div class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700">
            <Coins class="size-4 text-amber-600" />
            <span>{{ props.character?.coin?.toLocaleString() ?? '-' }}</span>
          </div>
          <div class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700">
            <Gem class="size-4 text-teal-700" />
            <span>{{ props.character?.gem?.toLocaleString() ?? '-' }}</span>
          </div>
        </div>

        <button
          type="button"
          class="relative grid size-9 place-items-center rounded-md text-stone-500 transition hover:bg-stone-200/70 hover:text-stone-900 active:translate-y-px"
          aria-label="Notifications"
        >
          <Bell class="size-5" />
          <span class="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-[#f8f6f1]"></span>
        </button>

        <div class="hidden items-center gap-2 sm:flex">
          <div class="grid size-9 place-items-center rounded-md bg-stone-900 text-sm font-semibold text-white">
            {{ initials }}
          </div>
          <span class="text-sm font-semibold text-stone-800">{{ displayName }}</span>
        </div>

        <button
          type="button"
          class="grid size-9 place-items-center rounded-md text-stone-500 transition hover:bg-stone-200/70 hover:text-stone-900 md:hidden"
          :aria-expanded="isMenuOpen"
          aria-label="Open navigation"
          @click="isMenuOpen = !isMenuOpen"
        >
          <X v-if="isMenuOpen" class="size-5" />
          <Menu v-else class="size-5" />
        </button>

        <button
          type="button"
          class="hidden items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-200/70 hover:text-stone-950 sm:flex"
          @click="logout"
        >
          <LogOut class="size-4" />
          Sign out
        </button>
      </div>
    </div>

    <nav v-if="isMenuOpen" class="border-t border-stone-300/70 px-4 py-3 md:hidden" aria-label="Mobile navigation">
      <RouterLink to="/" class="flex items-center gap-2 rounded-md bg-teal-900 px-3 py-2 text-sm font-semibold text-white" @click="isMenuOpen = false">
        <LayoutDashboard class="size-4" />
        Dashboard
      </RouterLink>
      <button type="button" class="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-200/70" @click="logout">
        <LogOut class="size-4" />
        Sign out
      </button>
    </nav>
  </header>
</template>
