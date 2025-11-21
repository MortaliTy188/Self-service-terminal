import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApiConfigStore } from './apiConfig'
import { useOrdersStore } from './orders'
import { useDeviceStore } from './device'
import { useWaiterStore } from './waiter'
import { useMenuStore } from './menu'
import { useImagesStore } from './images'

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

  // State для WebSocket уведомлений (notifications)
  const notificationsSocket = ref(null)
  const notificationsIsConnected = ref(false)
  const notificationsIsConnecting = ref(false)
  const notificationsConnectionError = ref(null)
  const notificationsReconnectAttempts = ref(0)
  const notificationsReconnectInterval = ref(null)

  // State для WebSocket всех уведомлений (notifications/all)
  const allNotificationsSocket = ref(null)
  const allNotificationsIsConnected = ref(false)
  const allNotificationsIsConnecting = ref(false)
  const allNotificationsConnectionError = ref(null)
  const allNotificationsReconnectAttempts = ref(0)
  const allNotificationsReconnectInterval = ref(null)

  // State для WebSocket изображений (images)
  const imagesSocket = ref(null)
  const imagesIsConnected = ref(false)
  const imagesIsConnecting = ref(false)
  const imagesConnectionError = ref(null)
  const imagesReconnectAttempts = ref(0)
  const imagesReconnectInterval = ref(null)

  // State для WebSocket меню (menu)
  const menuSocket = ref(null)
  const menuIsConnected = ref(false)
  const menuIsConnecting = ref(false)
  const menuConnectionError = ref(null)
  const menuReconnectAttempts = ref(0)
  const menuReconnectInterval = ref(null)

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
          console.log('📨 WebSocket /ws/orders сообщение получено:', msg)
          console.log('📨 Тип события:', msg.type)
          console.log('📨 Данные заказа:', msg.order)

          const ordersStore = useOrdersStore()
          const deviceStore = useDeviceStore()

          // Обработка событий заказов - перезагружаем все заказы для получения полной структуры
          if (msg.type === 'order_created') {
            console.log('✅ Обрабатываем order_created - перезагружаем все заказы')
            // Перезагружаем все заказы с сервера для получения полной структуры
            ordersStore.fetchOrders()
          } else if (msg.type === 'order_updated') {
            console.log('✅ Обрабатываем order_updated - перезагружаем все заказы')
            // Перезагружаем все заказы с сервера
            ordersStore.fetchOrders()
          } else if (msg.type === 'order_status_changed') {
            console.log('✅ Обрабатываем order_status_changed - перезагружаем все заказы')
            // Перезагружаем все заказы с сервера
            ordersStore.fetchOrders()
          }

          // Обработка событий корзины (для планшетов)
          if (msg.type === 'cart_updated') {
            console.log('🛒 Корзина обновлена для стола:', msg.table_id)
            // TODO: Обновить корзину если это текущий стол
            if (deviceStore.shortId === msg.table_id) {
              // Обновляем локальную корзину
              console.log('🛒 Обновление корзины текущего устройства')
            }
          }

          // Обработка изменения стола устройства
          if (msg.type === 'table_changed' && msg.device) {
            console.log('🪑 Изменение стола:', msg.device)

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
        console.error('❌ WebSocket /ws/orders ошибка:', error)
        console.error('❌ Детали ошибки:', {
          type: error.type,
          target: error.target,
          readyState: error.target?.readyState,
          url: error.target?.url,
        })
        console.error('❌ Сервер не доступен по адресу: ws://83.222.9.90:8080/ws/orders')
        console.error('❌ Проверьте:')
        console.error('   1. Запущен ли WebSocket сервер на бэкенде')
        console.error('   2. Правильный ли путь эндпоинта')
        console.error('   3. Нет ли блокировки firewall/CORS')

        connectionError.value = 'WebSocket сервер недоступен'
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
   * Подключение к WebSocket для уведомлений (вызов официанта, оплата, проблемы)
   * Используется в админ-панели для получения новых уведомлений
   */
  const connectNotificationsSocket = () => {
    if (
      notificationsSocket.value &&
      (notificationsSocket.value.readyState === WebSocket.CONNECTING ||
        notificationsSocket.value.readyState === WebSocket.OPEN)
    ) {
      console.log('WebSocket уведомлений уже подключен или подключается')
      return
    }

    notificationsIsConnecting.value = true
    notificationsConnectionError.value = null

    try {
      console.log('🔌 Подключение к WebSocket уведомлений: ws://83.222.9.90:8080/ws/notifications')

      notificationsSocket.value = new WebSocket('ws://83.222.9.90:8080/ws/notifications')

      notificationsSocket.value.onopen = () => {
        console.log('✅ WebSocket уведомлений подключен')
        notificationsIsConnected.value = true
        notificationsIsConnecting.value = false
        notificationsConnectionError.value = null
        notificationsReconnectAttempts.value = 0

        if (notificationsReconnectInterval.value) {
          clearInterval(notificationsReconnectInterval.value)
          notificationsReconnectInterval.value = null
        }
      }

      notificationsSocket.value.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          console.log('📨 WebSocket уведомление:', msg)

          const waiterStore = useWaiterStore()

          if (msg.type === 'notification_new' && msg.notification) {
            console.log('🔔 Получено новое уведомление:', msg.notification)

            // Добавляем уведомление в store
            waiterStore.addNotificationFromWebSocket({
              ...msg.notification,
              type: msg.notification.type, // call_waiter, payment_request, problem
            })
          }
        } catch (e) {
          console.error('❌ Ошибка парсинга WebSocket сообщения уведомлений:', e)
        }
      }

      notificationsSocket.value.onclose = (event) => {
        console.log('🔌 WebSocket уведомлений закрыт:', event.code, event.reason)
        notificationsIsConnected.value = false
        notificationsIsConnecting.value = false

        if (event.code !== 1000) {
          scheduleNotificationsReconnect()
        }
      }

      notificationsSocket.value.onerror = (error) => {
        console.error('❌ WebSocket уведомлений ошибка:', error)
        notificationsConnectionError.value = 'Ошибка подключения к серверу'
        notificationsIsConnecting.value = false
      }
    } catch (error) {
      console.error('❌ Ошибка создания WebSocket уведомлений:', error)
      notificationsConnectionError.value = error.message
      notificationsIsConnecting.value = false
    }
  }

  /**
   * Отключение WebSocket уведомлений
   */
  const disconnectNotificationsSocket = () => {
    if (notificationsReconnectInterval.value) {
      clearInterval(notificationsReconnectInterval.value)
      notificationsReconnectInterval.value = null
    }

    if (notificationsSocket.value) {
      notificationsSocket.value.close(1000, 'Client disconnect')
      notificationsSocket.value = null
    }

    notificationsIsConnected.value = false
    notificationsIsConnecting.value = false
    notificationsConnectionError.value = null
    notificationsReconnectAttempts.value = 0
  }

  /**
   * Планирование переподключения WebSocket уведомлений
   */
  const scheduleNotificationsReconnect = () => {
    if (notificationsReconnectAttempts.value >= maxReconnectAttempts.value) {
      console.error(
        '❌ Превышено максимальное количество попыток переподключения WebSocket уведомлений',
      )
      notificationsConnectionError.value = 'Не удалось подключиться к серверу'
      return
    }

    notificationsReconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, notificationsReconnectAttempts.value), 30000)

    console.log(
      `🔄 Попытка переподключения WebSocket уведомлений ${notificationsReconnectAttempts.value}/${maxReconnectAttempts.value} через ${delay}ms`,
    )

    notificationsReconnectInterval.value = setTimeout(() => {
      connectNotificationsSocket()
    }, delay)
  }

  /**
   * Подключение к WebSocket для получения полного списка уведомлений
   * Используется для отображения вкладки со всеми уведомлениями
   */
  const connectAllNotificationsSocket = () => {
    if (
      allNotificationsSocket.value &&
      (allNotificationsSocket.value.readyState === WebSocket.CONNECTING ||
        allNotificationsSocket.value.readyState === WebSocket.OPEN)
    ) {
      console.log('WebSocket всех уведомлений уже подключен или подключается')
      return
    }

    allNotificationsIsConnecting.value = true
    allNotificationsConnectionError.value = null

    try {
      console.log(
        '🔌 Подключение к WebSocket всех уведомлений: ws://83.222.9.90:8080/ws/notifications/all',
      )

      allNotificationsSocket.value = new WebSocket('ws://83.222.9.90:8080/ws/notifications/all')

      allNotificationsSocket.value.onopen = () => {
        console.log('✅ WebSocket всех уведомлений подключен')
        allNotificationsIsConnected.value = true
        allNotificationsIsConnecting.value = false
        allNotificationsConnectionError.value = null
        allNotificationsReconnectAttempts.value = 0

        if (allNotificationsReconnectInterval.value) {
          clearInterval(allNotificationsReconnectInterval.value)
          allNotificationsReconnectInterval.value = null
        }
      }

      allNotificationsSocket.value.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          console.log('📨 WebSocket список уведомлений:', msg)

          const waiterStore = useWaiterStore()

          if (msg.type === 'notifications_list' && Array.isArray(msg.notifications)) {
            console.log('📋 Получен полный список уведомлений:', msg.notifications.length)

            // Обновляем список всех уведомлений в store
            waiterStore.setAllNotifications(msg.notifications)
          }
        } catch (e) {
          console.error('❌ Ошибка парсинга WebSocket списка уведомлений:', e)
        }
      }

      allNotificationsSocket.value.onclose = (event) => {
        console.log('🔌 WebSocket всех уведомлений закрыт:', event.code, event.reason)
        allNotificationsIsConnected.value = false
        allNotificationsIsConnecting.value = false

        if (event.code !== 1000) {
          scheduleAllNotificationsReconnect()
        }
      }

      allNotificationsSocket.value.onerror = (error) => {
        console.error('❌ WebSocket всех уведомлений ошибка:', error)
        allNotificationsConnectionError.value = 'Ошибка подключения к серверу'
        allNotificationsIsConnecting.value = false
      }
    } catch (error) {
      console.error('❌ Ошибка создания WebSocket всех уведомлений:', error)
      allNotificationsConnectionError.value = error.message
      allNotificationsIsConnecting.value = false
    }
  }

  /**
   * Отключение WebSocket всех уведомлений
   */
  const disconnectAllNotificationsSocket = () => {
    if (allNotificationsReconnectInterval.value) {
      clearInterval(allNotificationsReconnectInterval.value)
      allNotificationsReconnectInterval.value = null
    }

    if (allNotificationsSocket.value) {
      allNotificationsSocket.value.close(1000, 'Client disconnect')
      allNotificationsSocket.value = null
    }

    allNotificationsIsConnected.value = false
    allNotificationsIsConnecting.value = false
    allNotificationsConnectionError.value = null
    allNotificationsReconnectAttempts.value = 0
  }

  /**
   * Планирование переподключения WebSocket всех уведомлений
   */
  const scheduleAllNotificationsReconnect = () => {
    if (allNotificationsReconnectAttempts.value >= maxReconnectAttempts.value) {
      console.error(
        '❌ Превышено максимальное количество попыток переподключения WebSocket всех уведомлений',
      )
      allNotificationsConnectionError.value = 'Не удалось подключиться к серверу'
      return
    }

    allNotificationsReconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, allNotificationsReconnectAttempts.value), 30000)

    console.log(
      `🔄 Попытка переподключения WebSocket всех уведомлений ${allNotificationsReconnectAttempts.value}/${maxReconnectAttempts.value} через ${delay}ms`,
    )

    allNotificationsReconnectInterval.value = setTimeout(() => {
      connectAllNotificationsSocket()
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

  /**
   * Подключение к WebSocket изображений
   */
  const connectImagesSocket = () => {
    if (
      imagesSocket.value &&
      (imagesSocket.value.readyState === WebSocket.CONNECTING ||
        imagesSocket.value.readyState === WebSocket.OPEN)
    ) {
      console.log('WebSocket изображений уже подключен или подключается')
      return
    }

    imagesIsConnecting.value = true
    imagesConnectionError.value = null

    try {
      console.log('🔌 Подключение к WebSocket изображений: ws://83.222.9.90:8080/ws/images')

      imagesSocket.value = new WebSocket('ws://83.222.9.90:8080/ws/images')

      imagesSocket.value.onopen = () => {
        console.log('✅ WebSocket изображений подключен')
        imagesIsConnected.value = true
        imagesIsConnecting.value = false
        imagesConnectionError.value = null
        imagesReconnectAttempts.value = 0

        if (imagesReconnectInterval.value) {
          clearTimeout(imagesReconnectInterval.value)
          imagesReconnectInterval.value = null
        }
      }

      imagesSocket.value.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          console.log('📨 WebSocket изображение обновлено:', msg)

          if (msg.type === 'image_updated' && msg.image) {
            console.log('🖼️ Обновлена стартовая картинка:', msg.image)

            // Используем новый метод для обработки WebSocket события
            const imagesStore = useImagesStore()
            imagesStore.updateImageFromWebSocket(msg.image)
          }
        } catch (e) {
          console.error('❌ Ошибка парсинга WebSocket сообщения изображений:', e)
        }
      }

      imagesSocket.value.onclose = (event) => {
        console.log('🔌 WebSocket изображений закрыт:', event.code, event.reason)
        imagesIsConnected.value = false
        imagesIsConnecting.value = false

        if (event.code !== 1000) {
          scheduleImagesReconnect()
        }
      }

      imagesSocket.value.onerror = (error) => {
        console.error('❌ WebSocket изображений ошибка:', error)
        imagesConnectionError.value = 'Ошибка подключения к серверу'
        imagesIsConnecting.value = false
      }
    } catch (error) {
      console.error('❌ Ошибка создания WebSocket изображений:', error)
      imagesConnectionError.value = error.message
      imagesIsConnecting.value = false
    }
  }

  const disconnectImagesSocket = () => {
    if (imagesReconnectInterval.value) {
      clearTimeout(imagesReconnectInterval.value)
      imagesReconnectInterval.value = null
    }

    if (imagesSocket.value) {
      imagesSocket.value.close(1000, 'Client disconnect')
      imagesSocket.value = null
    }

    imagesIsConnected.value = false
    imagesIsConnecting.value = false
    imagesConnectionError.value = null
    imagesReconnectAttempts.value = 0
  }

  const scheduleImagesReconnect = () => {
    if (imagesReconnectAttempts.value >= maxReconnectAttempts.value) {
      console.error(
        '❌ Превышено максимальное количество попыток переподключения WebSocket изображений',
      )
      imagesConnectionError.value = 'Не удалось подключиться к серверу'
      return
    }

    imagesReconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, imagesReconnectAttempts.value), 30000)

    console.log(
      `🔄 Попытка переподключения WebSocket изображений ${imagesReconnectAttempts.value}/${maxReconnectAttempts.value} через ${delay}ms`,
    )

    imagesReconnectInterval.value = setTimeout(() => {
      connectImagesSocket()
    }, delay)
  }

  /**
   * Подключение к WebSocket меню
   */
  const connectMenuSocket = () => {
    if (
      menuSocket.value &&
      (menuSocket.value.readyState === WebSocket.CONNECTING ||
        menuSocket.value.readyState === WebSocket.OPEN)
    ) {
      console.log('WebSocket меню уже подключен или подключается')
      return
    }

    menuIsConnecting.value = true
    menuConnectionError.value = null

    try {
      console.log('🔌 Подключение к WebSocket меню: ws://83.222.9.90:8080/ws/menu')

      menuSocket.value = new WebSocket('ws://83.222.9.90:8080/ws/menu')

      menuSocket.value.onopen = () => {
        console.log('✅ WebSocket меню подключен')
        menuIsConnected.value = true
        menuIsConnecting.value = false
        menuConnectionError.value = null
        menuReconnectAttempts.value = 0

        if (menuReconnectInterval.value) {
          clearTimeout(menuReconnectInterval.value)
          menuReconnectInterval.value = null
        }
      }

      menuSocket.value.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          console.log('📨 WebSocket меню обновлено:', msg)

          if (msg.type === 'menu_item_status_changed') {
            console.log('🍽️ Изменен статус блюда:', msg.id, 'is_active:', msg.is_active)

            // Обновляем статус блюда в меню
            const menuStore = useMenuStore()
            menuStore.updateMenuItemStatusFromWebSocket(msg.id, msg.is_active)
          }
        } catch (e) {
          console.error('❌ Ошибка парсинга WebSocket сообщения меню:', e)
        }
      }

      menuSocket.value.onclose = (event) => {
        console.log('🔌 WebSocket меню закрыт:', event.code, event.reason)
        menuIsConnected.value = false
        menuIsConnecting.value = false

        if (event.code !== 1000) {
          scheduleMenuReconnect()
        }
      }

      menuSocket.value.onerror = (error) => {
        console.error('❌ WebSocket меню ошибка:', error)
        menuConnectionError.value = 'Ошибка подключения к серверу'
        menuIsConnecting.value = false
      }
    } catch (error) {
      console.error('❌ Ошибка создания WebSocket меню:', error)
      menuConnectionError.value = error.message
      menuIsConnecting.value = false
    }
  }

  const disconnectMenuSocket = () => {
    if (menuReconnectInterval.value) {
      clearTimeout(menuReconnectInterval.value)
      menuReconnectInterval.value = null
    }

    if (menuSocket.value) {
      menuSocket.value.close(1000, 'Client disconnect')
      menuSocket.value = null
    }

    menuIsConnected.value = false
    menuIsConnecting.value = false
    menuConnectionError.value = null
    menuReconnectAttempts.value = 0
  }

  const scheduleMenuReconnect = () => {
    if (menuReconnectAttempts.value >= maxReconnectAttempts.value) {
      console.error('❌ Превышено максимальное количество попыток переподключения WebSocket меню')
      menuConnectionError.value = 'Не удалось подключиться к серверу'
      return
    }

    menuReconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, menuReconnectAttempts.value), 30000)

    console.log(
      `🔄 Попытка переподключения WebSocket меню ${menuReconnectAttempts.value}/${maxReconnectAttempts.value} через ${delay}ms`,
    )

    menuReconnectInterval.value = setTimeout(() => {
      connectMenuSocket()
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

    // State для WebSocket уведомлений (notifications)
    notificationsIsConnected,
    notificationsIsConnecting,
    notificationsConnectionError,
    notificationsReconnectAttempts,

    // State для WebSocket всех уведомлений (notifications/all)
    allNotificationsIsConnected,
    allNotificationsIsConnecting,
    allNotificationsConnectionError,
    allNotificationsReconnectAttempts,

    // State для WebSocket изображений
    imagesIsConnected,
    imagesIsConnecting,
    imagesConnectionError,
    imagesReconnectAttempts,

    // State для WebSocket меню
    menuIsConnected,
    menuIsConnecting,
    menuConnectionError,
    menuReconnectAttempts,

    // State для WebSocket статуса устройств
    deviceStatusIsConnected,
    deviceStatusIsConnecting,
    deviceStatusConnectionError,
    deviceStatusReconnectAttempts,
    deviceStatusConnectionStatus,

    // Actions для WebSocket заказов
    connect,
    disconnect,
    sendMessage,
    scheduleReconnect,

    // Actions для WebSocket уведомлений
    connectNotificationsSocket,
    disconnectNotificationsSocket,
    scheduleNotificationsReconnect,

    // Actions для WebSocket всех уведомлений
    connectAllNotificationsSocket,
    disconnectAllNotificationsSocket,
    scheduleAllNotificationsReconnect,

    // Actions для WebSocket изображений
    connectImagesSocket,
    disconnectImagesSocket,
    scheduleImagesReconnect,

    // Actions для WebSocket меню
    connectMenuSocket,
    disconnectMenuSocket,
    scheduleMenuReconnect,

    // Actions для WebSocket статуса устройств
    connectDeviceStatusSocket,
    disconnectDeviceStatusSocket,
    scheduleDeviceStatusReconnect,
  }
})
