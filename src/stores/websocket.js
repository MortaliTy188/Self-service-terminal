import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApiConfigStore } from './apiConfig'
import { useOrdersStore } from './orders'
import { useDeviceStore } from './device'
import { useWaiterStore } from './waiter'

export const useWebSocketStore = defineStore('websocket', () => {
  const apiConfigStore = useApiConfigStore()

  // State для WebSocket заказов
  const socket = ref(null)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const connectionError = ref(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = ref(5)
  const reconnectInterval = ref(null)

  // State для WebSocket вызовов официанта
  const waiterSocket = ref(null)
  const waiterIsConnected = ref(false)
  const waiterIsConnecting = ref(false)
  const waiterConnectionError = ref(null)
  const waiterReconnectAttempts = ref(0)
  const waiterReconnectInterval = ref(null)

  // State для WebSocket статуса устройств
  const deviceStatusSocket = ref(null)
  const deviceStatusIsConnected = ref(false)
  const deviceStatusIsConnecting = ref(false)
  const deviceStatusConnectionError = ref(null)
  const deviceStatusReconnectAttempts = ref(0)
  const deviceStatusReconnectInterval = ref(null)

  // Getters
  const connectionStatus = computed(() => {
    if (isConnected.value) return 'connected'
    if (isConnecting.value) return 'connecting'
    if (connectionError.value) return 'error'
    return 'disconnected'
  })

  const deviceStatusConnectionStatus = computed(() => {
    if (deviceStatusIsConnected.value) return 'connected'
    if (deviceStatusIsConnecting.value) return 'connecting'
    if (deviceStatusConnectionError.value) return 'error'
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

            // Обновляем информацию на клиентском устройстве
            if (deviceStore.androidId && msg.device.android_id === deviceStore.androidId) {
              deviceStore.shortId = msg.device.short_id
              deviceStore.deviceInfo = msg.device
              deviceStore.saveDeviceToStorage()
              console.log('✅ Информация об устройстве обновлена')
            }

            // Обновляем список устройств в админ-панели
            deviceStore.updateDeviceInList(msg.device.android_id, msg.device)
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

  /**
   * Подключение к WebSocket для уведомлений о вызове официанта
   */
  const connectWaiterSocket = () => {
    if (
      waiterSocket.value &&
      (waiterSocket.value.readyState === WebSocket.CONNECTING ||
        waiterSocket.value.readyState === WebSocket.OPEN)
    ) {
      console.log('WebSocket официанта уже подключен или подключается')
      return
    }

    waiterIsConnecting.value = true
    waiterConnectionError.value = null

    try {
      console.log('🔌 Подключение к WebSocket официанта: ws://83.222.9.90:8080/ws/waiter')

      waiterSocket.value = new WebSocket('ws://83.222.9.90:8080/ws/waiter')

      waiterSocket.value.onopen = () => {
        console.log('✅ WebSocket официанта подключен')
        waiterIsConnected.value = true
        waiterIsConnecting.value = false
        waiterConnectionError.value = null
        waiterReconnectAttempts.value = 0

        if (waiterReconnectInterval.value) {
          clearInterval(waiterReconnectInterval.value)
          waiterReconnectInterval.value = null
        }
      }

      waiterSocket.value.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          console.log('📨 WebSocket сообщение от официанта:', msg)

          // Получаем waiter store во время выполнения
          const waiterStore = useWaiterStore()

          if (msg.type === 'waiter_call') {
            console.log('🔔 Получен вызов официанта:', msg)

            // Добавляем уведомление в store
            waiterStore.addNotificationFromWebSocket(msg)
          }
        } catch (e) {
          console.error('❌ Ошибка парсинга WebSocket сообщения официанта:', e)
        }
      }

      waiterSocket.value.onclose = (event) => {
        console.log('🔌 WebSocket официанта закрыт:', event.code, event.reason)
        waiterIsConnected.value = false
        waiterIsConnecting.value = false

        if (event.code !== 1000) {
          scheduleWaiterReconnect()
        }
      }

      waiterSocket.value.onerror = (error) => {
        console.error('❌ WebSocket официанта ошибка:', error)
        waiterConnectionError.value = 'Ошибка подключения к серверу'
        waiterIsConnecting.value = false
      }
    } catch (error) {
      console.error('❌ Ошибка создания WebSocket официанта:', error)
      waiterConnectionError.value = error.message
      waiterIsConnecting.value = false
    }
  }

  /**
   * Отключение WebSocket официанта
   */
  const disconnectWaiterSocket = () => {
    if (waiterReconnectInterval.value) {
      clearInterval(waiterReconnectInterval.value)
      waiterReconnectInterval.value = null
    }

    if (waiterSocket.value) {
      waiterSocket.value.close(1000, 'Client disconnect')
      waiterSocket.value = null
    }

    waiterIsConnected.value = false
    waiterIsConnecting.value = false
    waiterConnectionError.value = null
    waiterReconnectAttempts.value = 0
  }

  /**
   * Планирование переподключения WebSocket официанта
   */
  const scheduleWaiterReconnect = () => {
    if (waiterReconnectAttempts.value >= maxReconnectAttempts.value) {
      console.error(
        '❌ Превышено максимальное количество попыток переподключения WebSocket официанта',
      )
      waiterConnectionError.value = 'Не удалось подключиться к серверу'
      return
    }

    waiterReconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, waiterReconnectAttempts.value), 30000)

    console.log(
      `🔄 Попытка переподключения WebSocket официанта ${waiterReconnectAttempts.value}/${maxReconnectAttempts.value} через ${delay}ms`,
    )

    waiterReconnectInterval.value = setTimeout(() => {
      connectWaiterSocket()
    }, delay)
  }

  /**
   * Подключение к WebSocket статуса устройств
   */
  const connectDeviceStatusSocket = () => {
    if (
      deviceStatusSocket.value &&
      (deviceStatusSocket.value.readyState === WebSocket.CONNECTING ||
        deviceStatusSocket.value.readyState === WebSocket.OPEN)
    ) {
      console.log('WebSocket статуса устройств уже подключен или подключается')
      return
    }

    deviceStatusIsConnecting.value = true
    deviceStatusConnectionError.value = null

    try {
      console.log(
        '🔌 Подключение к WebSocket статуса устройств: ws://83.222.9.90:8080/ws/deviceStatus',
      )

      deviceStatusSocket.value = new WebSocket('ws://83.222.9.90:8080/ws/deviceStatus')

      deviceStatusSocket.value.onopen = () => {
        console.log('✅ WebSocket статуса устройств подключен')
        deviceStatusIsConnected.value = true
        deviceStatusIsConnecting.value = false
        deviceStatusReconnectAttempts.value = 0
        deviceStatusConnectionError.value = null

        if (deviceStatusReconnectInterval.value) {
          clearTimeout(deviceStatusReconnectInterval.value)
          deviceStatusReconnectInterval.value = null
        }
      }

      deviceStatusSocket.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'device_status' && data.device) {
            const deviceStore = useDeviceStore()
            const { android_id, is_active, last_seen, battery } = data.device

            // Обновляем устройство в списке всех устройств (для админ-панели)
            deviceStore.updateDeviceInList(android_id, {
              is_active,
              last_seen,
              battery,
            })

            // Если это текущее устройство, обновляем его данные
            if (deviceStore.androidId === android_id) {
              deviceStore.isActive = is_active
              deviceStore.battery = battery
              deviceStore.lastSeen = last_seen

              if (deviceStore.deviceInfo) {
                deviceStore.deviceInfo = {
                  ...deviceStore.deviceInfo,
                  is_active,
                  last_seen,
                  battery,
                }
                deviceStore.saveDeviceToStorage()
              }
            }

            console.log('Обновлен статус устройства:', {
              android_id,
              is_active,
              battery,
              last_seen,
            })
          }
        } catch (error) {
          console.error('Ошибка парсинга сообщения WebSocket статуса устройств:', error)
        }
      }

      deviceStatusSocket.value.onclose = (event) => {
        console.log('WebSocket статуса устройств отключен', event.code, event.reason)
        deviceStatusIsConnected.value = false
        deviceStatusIsConnecting.value = false

        if (event.code !== 1000) {
          scheduleDeviceStatusReconnect()
        }
      }

      deviceStatusSocket.value.onerror = (error) => {
        console.error('Ошибка WebSocket статуса устройств:', error)
        deviceStatusConnectionError.value = 'Ошибка подключения'
        deviceStatusIsConnecting.value = false
      }
    } catch (error) {
      console.error('Ошибка создания WebSocket статуса устройств:', error)
      deviceStatusConnectionError.value = error.message
      deviceStatusIsConnecting.value = false
      scheduleDeviceStatusReconnect()
    }
  }

  /**
   * Отключение WebSocket статуса устройств
   */
  const disconnectDeviceStatusSocket = () => {
    if (deviceStatusReconnectInterval.value) {
      clearTimeout(deviceStatusReconnectInterval.value)
      deviceStatusReconnectInterval.value = null
    }

    if (deviceStatusSocket.value) {
      deviceStatusSocket.value.close(1000, 'Закрыто пользователем')
      deviceStatusSocket.value = null
    }

    deviceStatusIsConnected.value = false
    deviceStatusIsConnecting.value = false
    deviceStatusConnectionError.value = null
    deviceStatusReconnectAttempts.value = 0
  }

  /**
   * Планирование переподключения для WebSocket статуса устройств
   */
  const scheduleDeviceStatusReconnect = () => {
    if (deviceStatusReconnectAttempts.value >= maxReconnectAttempts.value) {
      console.error(
        '❌ Превышено максимальное количество попыток переподключения WebSocket статуса устройств',
      )
      deviceStatusConnectionError.value = 'Не удалось подключиться к серверу'
      return
    }

    deviceStatusReconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, deviceStatusReconnectAttempts.value), 30000)

    console.log(
      `🔄 Попытка переподключения WebSocket статуса устройств ${deviceStatusReconnectAttempts.value}/${maxReconnectAttempts.value} через ${delay}ms`,
    )

    deviceStatusReconnectInterval.value = setTimeout(() => {
      connectDeviceStatusSocket()
    }, delay)
  }

  return {
    // State для WebSocket заказов
    isConnected,
    isConnecting,
    connectionError,
    connectionStatus,
    reconnectAttempts,
    maxReconnectAttempts,

    // State для WebSocket официанта
    waiterIsConnected,
    waiterIsConnecting,
    waiterConnectionError,
    waiterReconnectAttempts,

    // State для WebSocket статуса устройств
    deviceStatusIsConnected,
    deviceStatusIsConnecting,
    deviceStatusConnectionError,
    deviceStatusReconnectAttempts,
    deviceStatusConnectionStatus,

    // Actions
    connect,
    disconnect,
    sendMessage,
    scheduleReconnect,

    // Actions для WebSocket официанта
    connectWaiterSocket,
    disconnectWaiterSocket,
    scheduleWaiterReconnect,

    // Actions для WebSocket статуса устройств
    connectDeviceStatusSocket,
    disconnectDeviceStatusSocket,
    scheduleDeviceStatusReconnect,
  }
})
