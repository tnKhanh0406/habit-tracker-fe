import { createRouter, createWebHistory } from 'vue-router'
import HabitView from '../views/HabitView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import ShopView from '@/views/ShopView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'habits',
      component: HabitView,
      meta: { requiresAuth: true },
    },
    {
      path: '/shop',
      name: 'shop',
      component: ShopView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { public: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized && !auth.authError) {
    await auth.loadCurrentUser()
  }

  if (to.meta.public) {
    if (auth.isAuthenticated) return { name: 'habits' }
    return true
  }

  if (auth.isAuthenticated || auth.authError) return true

  return {
    name: 'login',
    query: { redirect: to.fullPath },
  }
})

if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    if (router.currentRoute.value.meta.public) return
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
  })
}

export default router
