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
    {
      path: '/admin',
      name: 'Orders',
      component: () => import('@/views/OrdersPage.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Глобальный навигационный гард для защищенных маршрутов
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    // Импортируем useAdminAuth динамически внутри функции
    const { useAdminAuth } = await import('@/hooks')
    const { requestAdminAccess } = useAdminAuth()
    const authResult = await requestAdminAccess()

    if (!authResult.success) {
      if (authResult.cancelled) {
        // Пользователь отменил ввод ключа
        return { name: 'Home' }
      } else {
        // Показываем ошибку и перенаправляем
        alert(authResult.error || 'Доступ запрещен')
        return { name: 'Home' }
      }
    }
  }

  return true
})

export default router
