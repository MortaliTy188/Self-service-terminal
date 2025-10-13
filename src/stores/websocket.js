import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApiConfigStore } from './apiConfig'
import { useOrdersStore } from './orders'
import { useDeviceStore } from './device'

export const useWebSocketStore = defineStore('websocket', () => {
  const apiConfigStore = useApiConfigStore()

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
      console.log('🔌 Подключение к WebSocket: ws://83.222.9.90:8080/ws/orders')

      socket.value = new WebSocket('ws://83.222.9.90:8080/ws/orders')

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
          const msg = JSON.parse(event.data)
          console.log('📨 WebSocket сообщение:', msg)

          if (msg.type === 'order_created') {
            console.log('📋 Получен новый заказ, обновляем список заказов')
            const ordersStore = useOrdersStore()
            ordersStore.fetchOrders()
          }

          if (msg.type === 'table_changed' && msg.device) {
            console.log('🪑 Изменение стола:', msg.device)
            const deviceStore = useDeviceStore()
            if (deviceStore.androidId && msg.device.android_id === deviceStore.androidId) {
              deviceStore.shortId = msg.device.short_id
              deviceStore.deviceInfo = msg.device
              deviceStore.saveDeviceToStorage()
              console.log('✅ Информация об устройстве обновлена')
            }
          }
        } catch (e) {
          console.error('❌ Ошибка парсинга WebSocket сообщения:', e)
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
  }
})
