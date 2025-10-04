import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMainStore } from './main'
import { useApiConfigStore } from './apiConfig'

export const useWaiterStore = defineStore('waiter', () => {
  const mainStore = useMainStore()
  const apiConfigStore = useApiConfigStore()

  // State
  const notifications = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const callHistory = ref([])

  // Getters
  const activeNotifications = computed(() => {
    return notifications.value.filter((notification) => !notification.resolved)
  })

  const resolvedNotifications = computed(() => {
    return notifications.value.filter((notification) => notification.resolved)
  })

  const notificationsByTable = computed(() => {
    const grouped = {}
    notifications.value.forEach((notification) => {
      const table = notification.tableNumber
      if (!grouped[table]) {
        grouped[table] = []
      }
      grouped[table].push(notification)
    })
    return grouped
  })

  const urgentNotifications = computed(() => {
    const now = Date.now()
    return notifications.value.filter(
      (notification) =>
        !notification.resolved && now - new Date(notification.timestamp).getTime() > 5 * 60 * 1000, // 5 минут
    )
  })

  // Actions
  const fetchNotifications = async () => {
    await fetchWaiterNotifications()
  }

  const fetchWaiterNotifications = async () => {
    try {
      // Имитация API запроса
      // const response = await fetch('/api/waiter/notifications')
      // const data = await response.json()

      // Добавляем некоторые demo уведомления
      if (notifications.value.length === 0) {
        notifications.value = [
          {
            id: 1,
            tableNumber: 5,
            reason: 'Помощь с заказом',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            resolved: false,
            urgent: false,
          },
          {
            id: 2,
            tableNumber: 3,
            reason: 'Счёт',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            resolved: true,
            urgent: false,
          },
          {
            id: 3,
            tableNumber: 7,
            reason: 'Жалоба',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            resolved: false,
            urgent: true,
          },
        ]
      }

      // Используем локальные данные
      console.log('Загружаем уведомления официанта...')
    } catch (err) {
      error.value = err.message
      console.error('Error fetching waiter notifications:', err)
      mainStore.setGlobalError(err.message)
    }
  }

  const callWaiter = async (tableNumber) => {
    isLoading.value = true

    const requestData = {
      tableNumber: parseInt(tableNumber),
      timestamp: new Date().toISOString(),
      type: 'waiter_call',
    }

    try {
      // Реальный запрос на сервер (закомментирован)
      // const response = await fetch('/api/waiter/call', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(requestData)
      // })

      // Имитируем успешный вызов
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Добавляем в историю вызовов
      const callRecord = {
        id: Date.now(),
        ...requestData,
        status: 'sent',
      }

      callHistory.value.unshift(callRecord)

      // Имитируем получение нового уведомления через некоторое время
      setTimeout(() => {
        simulateNewNotification(tableNumber)
      }, 2000)

      mainStore.addNotification({
        type: 'success',
        title: 'Официант вызван',
        message: `Вызов отправлен для стола ${tableNumber}`,
        duration: 3000,
      })

      return { success: true, message: 'Вызов отправлен' }
    } catch (error) {
      console.error('Ошибка при вызове официанта:', error)
      mainStore.setGlobalError('Не удалось вызвать официанта')
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  const simulateNewNotification = (tableNumber) => {
    const notification = {
      id: Date.now(),
      tableNumber: parseInt(tableNumber),
      message: `Стол ${tableNumber} требует обслуживания`,
      type: 'waiter_call',
      priority: 'normal',
      timestamp: new Date().toISOString(),
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
    }

    notifications.value.unshift(notification)

    // Показываем системное уведомление
    mainStore.addNotification({
      type: 'warning',
      title: 'Новый вызов официанта',
      message: `Стол ${tableNumber} требует обслуживания`,
      duration: 10000,
    })

    console.log('Новое уведомление официанта:', notification)
  }

  const markNotificationAsResolved = async (notificationId, resolvedBy = 'Admin') => {
    try {
      const notification = notifications.value.find((n) => n.id === notificationId)

      if (!notification) {
        throw new Error('Уведомление не найдено')
      }

      // Имитация API запроса
      // const response = await fetch(`/api/waiter/notifications/${notificationId}/resolve`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ resolvedBy })
      // })

      // Обновляем локально
      notification.resolved = true
      notification.resolvedAt = new Date().toISOString()
      notification.resolvedBy = resolvedBy

      mainStore.addNotification({
        type: 'success',
        title: 'Вызов обработан',
        message: `Вызов со стола ${notification.tableNumber} отмечен как обработанный`,
        duration: 3000,
      })

      return { success: true }
    } catch (error) {
      console.error('Ошибка при обработке уведомления:', error)
      mainStore.setGlobalError('Не удалось обработать уведомление')
      return { success: false, error: error.message }
    }
  }

  const resolveNotification = async (notificationId, resolvedBy = 'Admin') => {
    return await markNotificationAsResolved(notificationId, resolvedBy)
  }

  const clearResolvedNotifications = () => {
    const resolvedCount = resolvedNotifications.value.length
    notifications.value = notifications.value.filter((n) => !n.resolved)

    if (resolvedCount > 0) {
      mainStore.addNotification({
        type: 'info',
        title: 'История очищена',
        message: `Удалено ${resolvedCount} обработанных уведомлений`,
        duration: 2000,
      })
    }
  }

  const clearAllNotifications = () => {
    const count = notifications.value.length
    notifications.value = []

    if (count > 0) {
      mainStore.addNotification({
        type: 'info',
        title: 'Все уведомления удалены',
        message: `Удалено ${count} уведомлений`,
        duration: 2000,
      })
    }
  }

  const getNotificationById = (id) => {
    return notifications.value.find((notification) => notification.id === id)
  }

  const getNotificationsByTable = (tableNumber) => {
    return notifications.value.filter(
      (notification) => notification.tableNumber === parseInt(tableNumber),
    )
  }

  const getCallHistory = () => {
    return [...callHistory.value].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  const clearCallHistory = () => {
    const count = callHistory.value.length
    callHistory.value = []

    if (count > 0) {
      mainStore.addNotification({
        type: 'info',
        title: 'История вызовов очищена',
        message: `Удалено ${count} записей`,
        duration: 2000,
      })
    }
  }

  return {
    // State
    notifications,
    isLoading,
    error,
    callHistory,

    // Getters
    activeNotifications,
    resolvedNotifications,
    notificationsByTable,
    urgentNotifications,

    // Actions
    fetchNotifications,
    fetchWaiterNotifications,
    callWaiter,
    simulateNewNotification,
    markNotificationAsResolved,
    resolveNotification,
    clearResolvedNotifications,
    clearAllNotifications,
    getNotificationById,
    getNotificationsByTable,
    getCallHistory,
    clearCallHistory,
  }
})
