import { createRouter, createWebHistory } from 'vue-router'
import HabitView from '../views/HabitView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'habits',
      component: HabitView,
    },
  ],
})

export default router
