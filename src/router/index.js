import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/components/Greetings.vue'),
    },
    {
      path: '/main',
      name: 'Main',
      component: () => import('@/components/MainPage.vue'),
    },
  ],
})

export default router
