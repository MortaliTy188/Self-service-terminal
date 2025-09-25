import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Greetings.vue'),
    },
    {
      path: '/main',
      name: 'Main',
      component: () => import('@/views/MainPage.vue'),
    },
  ],
})

export default router
