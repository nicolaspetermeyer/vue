import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../views/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: AppLayout,
    },
  ],
})

export default router
