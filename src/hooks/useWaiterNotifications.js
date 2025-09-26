import { ref } from 'vue'
import { apiClient } from './api.js'

const notifications = ref([])
const isLoading = ref(false)

export function useWaiterNotifications() {
  // Функция для вызова официанта
  const callWaiter = async (tableNumber) => {
    isLoading.value = true

    const requestData = {
      tableNumber: tableNumber,
      timestamp: new Date().toISOString(),
      type: 'waiter_call',
    }

    try {
      // Реальный запрос на сервер (закомментирован)
      // const response = await apiClient.request('/waiter/call', {
      //   method: 'POST',
      //   body: JSON.stringify(requestData)
      // })

      // Заглушка - имитируем успешный вызов официанта
      console.log('Вызов официанта:', requestData)

      // Имитируем небольшую задержку сервера
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return {
        success: true,
        message: 'Официант вызван успешно',
      }
    } catch (error) {
      console.error('Ошибка при вызове официанта:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Функция для получения уведомлений о вызове официанта
  const fetchWaiterNotifications = async () => {
    try {
      // Реальный запрос на сервер (закомментирован)
      // const response = await apiClient.request('/waiter/notifications')
      // notifications.value = response.data || []

      // Заглушка - имитируем получение уведомлений
      // В реальном приложении здесь будет WebSocket или long polling
      const mockNotifications = [
        {
          id: 1,
          tableNumber: 5,
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 минут назад
          type: 'waiter_call',
          status: 'pending',
          message: 'Клиент вызывает официанта',
        },
        {
          id: 2,
          tableNumber: 12,
          timestamp: new Date(Date.now() - 600000).toISOString(), // 10 минут назад
          type: 'waiter_call',
          status: 'resolved',
          message: 'Клиент вызывает официанта',
        },
      ]

      notifications.value = mockNotifications
    } catch (error) {
      console.error('Ошибка при получении уведомлений:', error)
      notifications.value = []
    }
  }

  // Функция для отметки уведомления как обработанного
  const markNotificationAsResolved = async (notificationId) => {
    try {
      // Реальный запрос на сервер (закомментирован)
      // await apiClient.request(`/waiter/notifications/${notificationId}/resolve`, {
      //   method: 'PATCH'
      // })

      // Заглушка - помечаем уведомление как обработанное
      const notification = notifications.value.find((n) => n.id === notificationId)
      if (notification) {
        notification.status = 'resolved'
      }
    } catch (error) {
      console.error('Ошибка при отметке уведомления:', error)
      throw error
    }
  }

  // Функция для удаления уведомления
  const removeNotification = async (notificationId) => {
    try {
      // Реальный запрос на сервер (закомментирован)
      // await apiClient.request(`/waiter/notifications/${notificationId}`, {
      //   method: 'DELETE'
      // })

      // Заглушка - удаляем уведомление из локального массива
      const index = notifications.value.findIndex((n) => n.id === notificationId)
      if (index !== -1) {
        notifications.value.splice(index, 1)
      }
    } catch (error) {
      console.error('Ошибка при удалении уведомления:', error)
      throw error
    }
  }

  // Функция для имитации получения нового уведомления (для тестирования)
  const simulateNewNotification = (tableNumber) => {
    const newNotification = {
      id: Date.now(),
      tableNumber: tableNumber,
      timestamp: new Date().toISOString(),
      type: 'waiter_call',
      status: 'pending',
      message: 'Клиент вызывает официанта',
    }

    notifications.value.unshift(newNotification)
    return newNotification
  }

  return {
    notifications,
    isLoading,
    callWaiter,
    fetchWaiterNotifications,
    markNotificationAsResolved,
    removeNotification,
    simulateNewNotification,
  }
}
