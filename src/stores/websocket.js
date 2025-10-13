import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApiConfigStore } from './apiConfig'
import { useOrdersStore } from './orders'
import { useDeviceStore } from './device'

export const useWebSocketStore = defineStore('websocket', () => {
  const apiConfigStore = useApiConfigStore()
  const ordersStore = useOrdersStore()
  const deviceStore = useDeviceStore()

  // State
  const socket = ref(null)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const connectionError = ref(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = ref(5)
  const reconnectInterval = ref(null)

  // Getters
  const connectionStatus = computed(() => {
    if (isConnected.value) return 'connected'
    if (isConnecting.value) return 'connecting'
    if (connectionError.value) return 'error'
    return 'disconnected'
  })

  /**
   * Подключение к WebSocket серверу
   */
  const connect = () => {
    if (
      socket.value &&
      (socket.value.readyState === WebSocket.CONNECTING ||
        socket.value.readyState === WebSocket.OPEN)
    ) {
      console.log('WebSocket уже подключен или подключается')
      return
    }

    isConnecting.value = true
    connectionError.value = null

    try {
      // Получаем WebSocket URL из API конфигурации
      const wsUrl = getWebSocketUrl()
      console.log('🔌 Подключение к WebSocket:', wsUrl)

      socket.value = new WebSocket(wsUrl)

      socket.value.onopen = () => {
        console.log('✅ WebSocket подключен')
        isConnected.value = true
        isConnecting.value = false
        connectionError.value = null
        reconnectAttempts.value = 0

        // Очищаем интервал переподключения если он есть
        if (reconnectInterval.value) {
          clearInterval(reconnectInterval.value)
          reconnectInterval.value = null
        }
      }

      socket.value.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('📨 WebSocket сообщение:', message)
          handleMessage(message)
        } catch (error) {
          console.error('❌ Ошибка парсинга WebSocket сообщения:', error, event.data)
        }
      }

      socket.value.onclose = (event) => {
        console.log('🔌 WebSocket соединение закрыто:', event.code, event.reason)
        isConnected.value = false
        isConnecting.value = false

        // Если соединение закрыто не намеренно, пытаемся переподключиться
        if (event.code !== 1000) {
          // 1000 = normal closure
          scheduleReconnect()
        }
      }

      socket.value.onerror = (error) => {
        console.error('❌ WebSocket ошибка:', error)
        connectionError.value = 'Ошибка подключения к серверу'
        isConnecting.value = false
      }
    } catch (error) {
      console.error('❌ Ошибка создания WebSocket:', error)
      connectionError.value = error.message
      isConnecting.value = false
    }
  }

  /**
   * Отключение от WebSocket
   */
  const disconnect = () => {
    console.log('🔌 Отключение WebSocket')

    // Очищаем интервал переподключения
    if (reconnectInterval.value) {
      clearInterval(reconnectInterval.value)
      reconnectInterval.value = null
    }

    if (socket.value) {
      socket.value.close(1000, 'Manual disconnect')
      socket.value = null
    }

    isConnected.value = false
    isConnecting.value = false
    connectionError.value = null
    reconnectAttempts.value = 0
  }

  /**
   * Планирование переподключения
   */
  const scheduleReconnect = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts.value) {
      console.log('❌ Превышено максимальное количество попыток переподключения')
      connectionError.value = 'Не удалось подключиться к серверу'
      return
    }

    reconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000) // Exponential backoff, max 30s

    console.log(
      `🔄 Переподключение через ${delay}ms (попытка ${reconnectAttempts.value}/${maxReconnectAttempts.value})`,
    )

    reconnectInterval.value = setTimeout(() => {
      connect()
    }, delay)
  }

  /**
   * Получение URL для WebSocket подключения
   */
  const getWebSocketUrl = () => {
    const baseUrl = apiConfigStore.baseUrl

    // Если используется удаленный сервер
    if (baseUrl.includes('83.222.9.90')) {
      return 'ws://83.222.9.90:8080/ws'
    }

    // Если используется локальный сервер
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      return 'ws://localhost:8080/ws'
    }

    // По умолчанию удаленный сервер
    return 'ws://83.222.9.90:8080/ws'
  }

  /**
   * Обработка входящих сообщений WebSocket
   */
  const handleMessage = (message) => {
    switch (message.event) {
      case 'order_created':
        handleOrderCreated(message.order)
        break

      case 'order_updated':
        handleOrderUpdated(message.order)
        break

      case 'table_changed':
        handleTableChanged(message.android_id, message.short_id)
        break

      case 'cart_updated':
        handleCartUpdated(message.table_id, message.cart)
        break

      default:
        console.log('🔔 Неизвестное WebSocket событие:', message.event)
    }
  }

  /**
   * Обработка события создания заказа
   */
  const handleOrderCreated = (order) => {
    console.log('📋 Новый заказ создан:', order)

    // Добавляем заказ в список заказов
    ordersStore.addOrderFromWebSocket(order)
  }

  /**
   * Обработка события обновления заказа
   */
  const handleOrderUpdated = (order) => {
    console.log('📋 Заказ обновлен:', order)

    // Обновляем заказ в списке
    ordersStore.updateOrderFromWebSocket(order)
  }

  /**
   * Обработка события изменения стола
   */
  const handleTableChanged = (androidId, shortId) => {
    console.log('🪑 Изменен номер стола:', { androidId, shortId })

    // Обновляем информацию об устройстве
    deviceStore.updateDeviceTableFromWebSocket(androidId, shortId)
  }

  /**
   * Обработка события обновления корзины
   */
  const handleCartUpdated = (tableId, cart) => {
    console.log('🛒 Корзина обновлена:', { tableId, cart })

    // Здесь можно добавить логику обновления корзины если нужно
    // Например, показать уведомление админу о изменении корзины
  }

  /**
   * Отправка сообщения через WebSocket
   */
  const sendMessage = (message) => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(message))
      console.log('📤 WebSocket сообщение отправлено:', message)
    } else {
      console.warn('⚠️ WebSocket не подключен, сообщение не отправлено:', message)
    }
  }

  /**
   * Тестовая функция для имитации входящих сообщений (для разработки)
   */
  const simulateMessage = (event, data) => {
    const message = { event, ...data }
    console.log('🧪 Симуляция WebSocket сообщения:', message)
    handleMessage(message)
  }

  return {
    // State
    isConnected,
    isConnecting,
    connectionError,
    connectionStatus,
    reconnectAttempts,
    maxReconnectAttempts,

    // Actions
    connect,
    disconnect,
    sendMessage,
    scheduleReconnect,

    // Development helpers
    simulateMessage,
  }
})
