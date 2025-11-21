import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMainStore } from './main'
import { useApiConfigStore } from './apiConfig'

export const useWaiterStore = defineStore('waiter', () => {
  const mainStore = useMainStore()
  const apiConfigStore = useApiConfigStore()

  // State
  const notifications = ref([])
  const allNotifications = ref([]) // Полный список всех уведомлений для вкладки
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
      // В будущем здесь будет реальный API
      // const response = await fetch('/api/waiter/notifications')
      // const data = await response.json()
      console.log('Загружаем уведомления официанта...')
    } catch (err) {
      error.value = err.message
      console.error('Error fetching waiter notifications:', err)
      mainStore.setGlobalError(err.message)
    }
  }

  const callWaiter = async (tableNumber, message = '') => {
    isLoading.value = true
    error.value = null

    const requestData = {
      table_id: String(tableNumber),
      message: message || `Вызов официанта от стола ${tableNumber}`,
      type: 'call_waiter',
    }

    console.log('📞 Вызов официанта:', requestData)
    console.log('🔗 API URL:', `${apiConfigStore.baseUrl}/api/notifications`)

    try {
      const response = await fetch(`${apiConfigStore.baseUrl}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Ошибка ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      // Добавляем в историю вызовов используя данные из ответа API
      const callRecord = {
        id: result.id || Date.now(),
        tableNumber: parseInt(tableNumber),
        message: result.message || requestData.message,
        timestamp: result.created_at || new Date().toISOString(),
        type: 'waiter_call',
        status: result.status || 'new',
      }

      callHistory.value.unshift(callRecord)

      mainStore.addNotification({
        type: 'success',
        title: 'Официант вызван',
        message: `Вызов отправлен для стола ${tableNumber}`,
        duration: 3000,
      })

      console.log('✅ Официант успешно вызван:', result)
      return { success: true, message: 'Вызов отправлен', data: result }
    } catch (err) {
      console.error('❌ Ошибка при вызове официанта:', err)
      error.value = err.message

      mainStore.addNotification({
        type: 'error',
        title: 'Ошибка вызова',
        message: err.message || 'Не удалось вызвать официанта',
        duration: 5000,
      })

      return { success: false, error: err.message }
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

  /**
   * Добавление уведомления из WebSocket
   */
  const addNotificationFromWebSocket = (wsData) => {
    try {
      const notification = {
        id: wsData.id || Date.now(),
        tableNumber: parseInt(wsData.table_id || wsData.tableNumber),
        message: wsData.message || `Вызов от стола ${wsData.table_id}`,
        timestamp: wsData.timestamp || new Date().toISOString(),
        type: wsData.type || 'waiter_call',
        resolved: false,
        priority: wsData.priority || 'normal',
      }

      // Проверяем, нет ли уже такого уведомления
      const existingIndex = notifications.value.findIndex((n) => n.id === notification.id)

      if (existingIndex === -1) {
        // Используем unshift для добавления в начало массива
        // Vue 3 реактивно отслеживает это
        notifications.value = [notification, ...notifications.value]

        console.log('🔔 Новое уведомление о вызове официанта:', notification)
        console.log('📋 Всего уведомлений сейчас:', notifications.value.length)

        // Показываем системное уведомление
        mainStore.addNotification({
          type: 'warning',
          title: 'Вызов официанта',
          message: `Стол ${notification.tableNumber}: ${notification.message}`,
          duration: 0, // Не закрывать автоматически
        })

        // Воспроизводим звук (если нужно)
        playNotificationSound()
      } else {
        console.log('📋 Уведомление уже существует, пропускаем')
      }
    } catch (error) {
      console.error('❌ Ошибка добавления уведомления из WebSocket:', error)
    }
  }

  /**
   * Воспроизведение звука уведомления
   */
  const playNotificationSound = () => {
    try {
      // Можно добавить звуковое уведомление если нужно
      // const audio = new Audio('/notification.mp3')
      // audio.play()
    } catch (error) {
      console.error('❌ Ошибка воспроизведения звука:', error)
    }
  }

  /**
   * Установка полного списка уведомлений (для вкладки "Все уведомления")
   * Используется с WebSocket /ws/notifications/all
   */
  const setAllNotifications = (notificationsList) => {
    try {
      console.log('📋 Установка полного списка уведомлений:', notificationsList.length)

      // Преобразуем формат API в формат store
      allNotifications.value = notificationsList.map((notif) => ({
        id: notif.id,
        tableNumber: parseInt(notif.table_id) || 0,
        message: notif.message,
        type: notif.type, // call_waiter, payment_request, problem
        status: notif.status, // new, resolved, etc
        timestamp: notif.created_at,
        resolved: notif.status !== 'new',
        resolvedAt: notif.updated_at !== notif.created_at ? notif.updated_at : null,
        priority: 'normal',
      }))

      console.log('✅ Список уведомлений обновлен')
    } catch (error) {
      console.error('❌ Ошибка установки списка уведомлений:', error)
    }
  }

  /**
   * Загрузка всех уведомлений с сервера
   */
  const loadAllNotifications = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiConfigStore.baseUrl}/api/notifications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📥 Загружены все уведомления:', data)

      // Используем метод setAllNotifications для обработки
      setAllNotifications(data)

      return { success: true, data }
    } catch (err) {
      console.error('❌ Ошибка загрузки уведомлений:', err)
      error.value = err.message
      mainStore.addNotification({
        type: 'error',
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить уведомления',
        duration: 5000,
      })
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Обновление статуса уведомления
   */
  const updateNotificationStatus = async (notificationId, newStatus) => {
    try {
      console.log('🔄 Обновление статуса уведомления:', notificationId, newStatus)

      const response = await fetch(
        `${apiConfigStore.baseUrl}/api/notifications/${notificationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Ошибка ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Статус уведомления обновлен:', result)

      // Обновляем локально
      const notification = allNotifications.value.find((n) => n.id === notificationId)
      if (notification) {
        notification.status = newStatus
        notification.resolved = newStatus !== 'new'
        notification.resolvedAt = newStatus !== 'new' ? new Date().toISOString() : null
      }

      mainStore.addNotification({
        type: 'success',
        title: 'Статус обновлен',
        message:
          newStatus === 'resolved' ? 'Уведомление отмечено как обработанное' : 'Статус изменен',
        duration: 3000,
      })

      return { success: true, data: result }
    } catch (err) {
      console.error('❌ Ошибка обновления статуса:', err)
      error.value = err.message
      mainStore.addNotification({
        type: 'error',
        title: 'Ошибка',
        message: err.message || 'Не удалось обновить статус',
        duration: 5000,
      })
      return { success: false, error: err.message }
    }
  }

  return {
    // State
    notifications,
    allNotifications,
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
    addNotificationFromWebSocket,
    playNotificationSound,
    setAllNotifications,
    loadAllNotifications,
    updateNotificationStatus,
  }
})
