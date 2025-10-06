import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApiConfigStore } from './apiConfig'
import { useAuthStore } from './auth'

export const useDeviceStore = defineStore('device', () => {
  const apiConfigStore = useApiConfigStore()

  // State для текущего устройства (планшет)
  const deviceInfo = ref(null) // Информация о текущем устройстве
  const deviceToken = ref(null) // Токен устройства
  const androidId = ref(null) // Android ID устройства
  const shortId = ref(null) // Короткий номер стола
  const isRegistered = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

  // State для списка всех устройств (админ-панель)
  const allDevices = ref([]) // Список всех устройств
  const devicesLoading = ref(false)
  const devicesError = ref(null)

  // Getters
  const hasDeviceToken = computed(() => !!deviceToken.value)
  const hasShortId = computed(() => !!shortId.value)
  const isDeviceReady = computed(
    () => isRegistered.value && hasDeviceToken.value && hasShortId.value,
  )

  // Геттеры для списка устройств
  const devicesCount = computed(() => allDevices.value.length)
  const activeDevices = computed(() =>
    allDevices.value.filter((device) => device.is_active !== false),
  )
  const devicesWithShortId = computed(() => allDevices.value.filter((device) => device.short_id))
  const devicesWithoutShortId = computed(() =>
    allDevices.value.filter((device) => !device.short_id),
  )

  // Actions

  /**
   * Регистрация устройства на сервере
   * @param {Object} deviceData - Данные устройства
   * @returns {Object} - Результат регистрации
   */
  const registerDevice = async (deviceData) => {
    isLoading.value = true
    error.value = null

    try {
      const requestBody = {
        android_id: deviceData.android_id,
        model: deviceData.model || 'Unknown Device',
        os_version: deviceData.os_version || 'Unknown',
        app_version: deviceData.app_version || '1.0.0',
      }

      console.log('📱 Регистрация устройства:', requestBody)

      const headers = {
        'Content-Type': 'application/json',
      }

      // Добавляем X-Admin-Session если есть админская сессия
      const authStore = useAuthStore()
      if (authStore.sessionId) {
        headers['X-Admin-Session'] = authStore.sessionId
        console.log('🔑 Используем Admin Session для регистрации устройства')
      } else {
        console.log('⚠️ Нет Admin Session для регистрации устройства')
      }

      const response = await fetch(apiConfigStore.getSecureUrl('/api/devices/register'), {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Устройство зарегистрировано:', result)

      // Сохраняем данные устройства
      deviceInfo.value = result.device || result
      deviceToken.value = result.device_token || result.token
      androidId.value = deviceData.android_id
      isRegistered.value = true

      // Сохраняем в localStorage
      saveDeviceToStorage()

      return {
        success: true,
        data: result,
        message: 'Устройство успешно зарегистрировано',
      }
    } catch (err) {
      console.error('❌ Ошибка регистрации устройства:', err)
      error.value = err.message
      return {
        success: false,
        error: err.message,
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Принудительное обновление информации об устройстве с сервера
   * Используется когда нужно получить актуальный shortId после назначения стола
   */
  const refreshDeviceInfo = async () => {
    if (!androidId.value) {
      console.log('⚠️ Нет androidId для обновления информации')
      return { success: false, error: 'No android_id' }
    }

    try {
      console.log('🔄 Принудительное обновление информации об устройстве...')
      const result = await getDeviceInfo(androidId.value)

      if (result.success) {
        console.log('✅ Информация об устройстве обновлена:', {
          shortId: shortId.value,
          deviceInfo: deviceInfo.value,
        })
        saveDeviceToStorage()
        return { success: true, data: result.data }
      } else {
        console.log('❌ Не удалось обновить информацию об устройстве')
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('❌ Ошибка обновления информации об устройстве:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Получение информации об устройстве
   * @param {String} android_id - Android ID устройства
   * @returns {Object} - Информация об устройстве
   */
  const getDeviceInfo = async (android_id) => {
    isLoading.value = true
    error.value = null

    try {
      console.log(`📱 Получение информации об устройстве: ${android_id}`)

      // Подготавливаем заголовки
      const headers = {
        'Content-Type': 'application/json',
      }

      // Добавляем заголовок авторизации если есть админская сессия
      const authStore = useAuthStore()
      if (authStore.sessionId) {
        headers['X-Admin-Session'] = authStore.sessionId
        console.log(
          '🔑 Используем Admin Session для получения информации об устройстве:',
          authStore.sessionId,
        )
      } else {
        console.log('⚠️ Нет админской сессии для запроса информации об устройстве')
      }

      const response = await fetch(apiConfigStore.getSecureUrl(`/api/devices/${android_id}`), {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Информация об устройстве:', result)

      deviceInfo.value = result.device || result
      shortId.value = result.device?.short_id || result.short_id

      return {
        success: true,
        data: result,
      }
    } catch (err) {
      console.error('❌ Ошибка получения информации об устройстве:', err)
      error.value = err.message
      return {
        success: false,
        error: err.message,
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Обновление статуса устройства
   * @param {Object} statusData - Данные статуса (battery, status)
   * @returns {Object} - Результат обновления
   */
  const updateDeviceStatus = async (statusData) => {
    if (!androidId.value || !deviceToken.value) {
      return {
        success: false,
        error: 'Устройство не зарегистрировано',
      }
    }

    try {
      const requestBody = {
        battery: statusData.battery || 100,
        status: statusData.status || 'active',
      }

      console.log('📱 Обновление статуса устройства:', requestBody)

      const response = await fetch(
        apiConfigStore.getSecureUrl(`/api/devices/${androidId.value}/status`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deviceToken.value}`,
          },
          body: JSON.stringify(requestBody),
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Статус устройства обновлен:', result)

      return {
        success: true,
        data: result,
      }
    } catch (err) {
      console.error('❌ Ошибка обновления статуса устройства:', err)
      return {
        success: false,
        error: err.message,
      }
    }
  }

  /**
   * Назначение короткого номера устройству (только для админа)
   * @param {String} android_id - Android ID устройства
   * @param {String} short_id - Короткий номер стола
   * @returns {Object} - Результат назначения
   */
  const assignShortId = async (android_id, short_id) => {
    isLoading.value = true
    error.value = null

    try {
      const requestBody = {
        android_id,
        short_id: short_id.toString(),
      }

      console.log('📱 Назначение short_id устройству:', requestBody)

      // Получаем заголовки авторизации
      const headers = {
        'Content-Type': 'application/json',
      }

      // Добавляем X-Admin-Session если авторизованы
      const authStore = useAuthStore()
      if (authStore.sessionId) {
        headers['X-Admin-Session'] = authStore.sessionId
        console.log('🔑 Используем Admin Session для назначения short_id')
      }

      const response = await fetch(apiConfigStore.getSecureUrl('/api/admin/assign-device'), {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Short ID назначен:', result)

      // Если это текущее устройство, обновляем shortId
      if (android_id === androidId.value) {
        shortId.value = short_id.toString()
        saveDeviceToStorage()
      }

      return {
        success: true,
        data: result,
        message: `Номер стола ${short_id} назначен устройству`,
      }
    } catch (err) {
      console.error('❌ Ошибка назначения short_id:', err)
      error.value = err.message
      return {
        success: false,
        error: err.message,
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Получение списка всех устройств (только для админа)
   * Требует X-Admin-Session заголовок
   * @param {Boolean} forceRefresh - Принудительное обновление списка
   * @returns {Object} - Список устройств
   */
  const getAllDevices = async (forceRefresh = false) => {
    // Если данные уже загружены и не требуется обновление, возвращаем кешированные
    if (!forceRefresh && allDevices.value.length > 0) {
      return {
        success: true,
        data: allDevices.value,
      }
    }

    devicesLoading.value = true
    devicesError.value = null

    try {
      console.log('📱 Загрузка списка всех устройств...')

      const authStore = useAuthStore()

      const headers = {
        'Content-Type': 'application/json',
      }

      // Добавляем X-Admin-Session заголовок
      if (authStore.sessionId) {
        headers['X-Admin-Session'] = authStore.sessionId
        console.log('🔑 Используем Admin Session для получения списка устройств')
      } else {
        throw new Error('Требуется авторизация администратора')
      }

      const response = await fetch(apiConfigStore.getSecureUrl('/api/devices'), {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const devices = await response.json()

      // Сохраняем в state
      allDevices.value = devices

      console.log('✅ Список устройств загружен:', {
        count: devices.length,
        devices,
      })

      return {
        success: true,
        data: devices,
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки списка устройств:', err)
      devicesError.value = err.message
      return {
        success: false,
        error: err.message,
        data: [],
      }
    } finally {
      devicesLoading.value = false
    }
  }

  /**
   * Получить устройство по android_id из кеша или с сервера
   * @param {String} android_id - Android ID устройства
   * @returns {Object|null} - Информация об устройстве
   */
  const getDeviceById = (android_id) => {
    return allDevices.value.find((device) => device.android_id === android_id) || null
  }

  /**
   * Обновить данные устройства в списке
   * @param {String} android_id - Android ID устройства
   * @param {Object} updates - Обновляемые поля
   */
  const updateDeviceInList = (android_id, updates) => {
    const index = allDevices.value.findIndex((device) => device.android_id === android_id)
    if (index !== -1) {
      allDevices.value[index] = { ...allDevices.value[index], ...updates }
      console.log('✅ Устройство обновлено в списке:', allDevices.value[index])
    }
  }

  /**
   * Удалить устройство из списка
   * @param {String} android_id - Android ID устройства
   */
  const removeDeviceFromList = (android_id) => {
    const index = allDevices.value.findIndex((device) => device.android_id === android_id)
    if (index !== -1) {
      allDevices.value.splice(index, 1)
      console.log('✅ Устройство удалено из списка:', android_id)
    }
  }

  /**
   * Генерация стабильного Android ID для браузера
   */
  const generateBrowserAndroidId = () => {
    // Проверяем, есть ли уже сохраненный ID в localStorage
    const savedId = localStorage.getItem('browser_android_id')
    if (savedId) {
      console.log('📱 Используем сохраненный android_id:', savedId)
      return savedId
    }

    // Создаем стабильный fingerprint браузера
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Browser fingerprint for device ID', 2, 2)

    // Собираем стабильные характеристики браузера
    const fingerprint = canvas.toDataURL()
    const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const language = navigator.language
    const platform = navigator.platform
    const userAgent = navigator.userAgent

    // Создаем стабильную строку из всех характеристик (без случайных элементов)
    const stableData = `${fingerprint}${screenInfo}${timezone}${language}${platform}${userAgent}`

    // Генерируем стабильный хэш
    let hash = 0
    for (let i = 0; i < stableData.length; i++) {
      const char = stableData.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }

    // Создаем стабильный суффикс из части хэша
    const stableSuffix = Math.abs(hash).toString(36).substring(0, 10)
    const androidId = `browser_${Math.abs(hash)}_${stableSuffix}`

    // Сохраняем ID в localStorage для будущих использований
    localStorage.setItem('browser_android_id', androidId)
    console.log('📱 Создан новый стабильный android_id:', androidId)

    return androidId
  }

  /**
   * Определение модели устройства из User Agent
   */
  const getBrowserDeviceInfo = () => {
    const ua = navigator.userAgent
    let model = 'Unknown Device'
    let os = 'Unknown OS'

    // Определяем модель планшета/телефона
    if (ua.includes('iPad')) {
      model = 'iPad'
      os = 'iOS'
    } else if (ua.includes('iPhone')) {
      model = 'iPhone'
      os = 'iOS'
    } else if (ua.includes('Android')) {
      os = 'Android'
      // Пытаемся извлечь модель из User Agent
      const modelMatch = ua.match(/;\s*([^;)]+)\s*Build/)
      if (modelMatch) {
        model = modelMatch[1].trim()
      } else {
        model = 'Android Device'
      }
    } else if (ua.includes('Windows')) {
      model = 'Windows Device'
      os = 'Windows'
    } else if (ua.includes('Mac')) {
      model = 'Mac Device'
      os = 'macOS'
    }

    return { model, os }
  }

  /**
   * Инициализация устройства при загрузке приложения
   */
  const initializeDevice = async () => {
    console.log('📱 Инициализация устройства...')

    // Загружаем админскую сессию для планшетов
    const authStore = useAuthStore()
    authStore.loadSessionFromStorage()

    // Пробуем загрузить данные из localStorage
    loadDeviceFromStorage()

    // Если есть сохраненные данные И device_token, считаем устройство уже зарегистрированным
    if (androidId.value && deviceToken.value) {
      console.log('✅ Устройство уже зарегистрировано, проверяем актуальность данных')

      // Проверяем, есть ли shortId - если нет, пытаемся обновить с сервера
      if (!shortId.value) {
        console.log('⚠️ shortId отсутствует, пытаемся получить с сервера...')
        try {
          const authStore = useAuthStore()
          if (authStore.adminSessionId) {
            // Если есть админская сессия, получаем актуальную информацию
            const result = await getDeviceInfo(androidId.value)
            if (result.success) {
              console.log('✅ Информация об устройстве обновлена с сервера')
              saveDeviceToStorage()
            }
          }
        } catch (err) {
          console.log('⚠️ Не удалось обновить информацию об устройстве:', err.message)
        }
      }

      isRegistered.value = true
      return true
    }

    // Если есть только android_id без токена, проверяем на сервере (требует админ авторизации)
    if (androidId.value && !deviceToken.value) {
      console.log('⚠️ Найден android_id без токена, попытка получить информацию с сервера')
      const result = await getDeviceInfo(androidId.value)
      if (result.success) {
        console.log('✅ Устройство найдено на сервере, обновляем данные')
        deviceToken.value = result.data.device_token || result.data.token
        isRegistered.value = true
        saveDeviceToStorage()
        return true
      }
    }

    // Пытаемся получить android_id из Android приложения
    if (window.Android && typeof window.Android.getAndroidId === 'function') {
      try {
        const android_id = window.Android.getAndroidId()
        console.log('📱 Android ID получен из приложения:', android_id)

        // Проверяем, зарегистрировано ли устройство
        const result = await getDeviceInfo(android_id)

        if (result.success) {
          androidId.value = android_id
          deviceToken.value = result.data.device_token || result.data.token
          isRegistered.value = true
          saveDeviceToStorage()
          return true
        } else {
          // Устройство не зарегистрировано, регистрируем
          const deviceData = {
            android_id,
            model: window.Android.getModel ? window.Android.getModel() : 'Unknown',
            os_version: window.Android.getOSVersion ? window.Android.getOSVersion() : 'Unknown',
            app_version: window.Android.getAppVersion ? window.Android.getAppVersion() : '1.0.0',
          }

          await registerDevice(deviceData)
          return true
        }
      } catch (err) {
        console.error('❌ Ошибка получения Android ID:', err)
      }
    }

    // ТЕСТОВЫЙ РЕЖИМ: Автоматическая регистрация для браузера
    console.log('⚠️ Устройство работает в режиме браузера - запускаем автоматическую регистрацию')

    try {
      const browserAndroidId = generateBrowserAndroidId()
      const deviceInfo = getBrowserDeviceInfo()

      console.log('🔧 Генерируем тестовое устройство:', {
        android_id: browserAndroidId,
        model: deviceInfo.model,
        os_version: deviceInfo.os,
      })

      // Проверяем, может это устройство уже зарегистрировано
      const existingResult = await getDeviceInfo(browserAndroidId)

      if (existingResult.success) {
        console.log('✅ Браузерное устройство уже зарегистрировано')
        androidId.value = browserAndroidId
        deviceToken.value = existingResult.data.device_token || existingResult.data.token
        isRegistered.value = true
        saveDeviceToStorage()
        return true
      }

      // Сохраняем данные для регистрации после авторизации админа
      const pendingDeviceData = {
        android_id: browserAndroidId,
        model: `${deviceInfo.model} (Browser)`,
        os_version: deviceInfo.os,
        app_version: '1.0.0-browser',
      }

      // Сохраняем в localStorage для последующей регистрации
      localStorage.setItem('pending_device_registration', JSON.stringify(pendingDeviceData))

      console.log('� Данные устройства сохранены для регистрации после авторизации админа')
      console.log('ℹ️ Устройство будет автоматически зарегистрировано при входе в админ-панель')

      // Устанавливаем временные данные
      androidId.value = browserAndroidId
      deviceInfo.value = pendingDeviceData

      return true
    } catch (err) {
      console.error('❌ Ошибка подготовки к регистрации:', err)
    }

    return false
  }

  /**
   * Регистрация отложенного устройства после авторизации админа
   */
  const registerPendingDevice = async () => {
    try {
      const pendingData = localStorage.getItem('pending_device_registration')
      if (!pendingData) {
        return { success: true, message: 'Нет отложенной регистрации' }
      }

      const deviceData = JSON.parse(pendingData)
      console.log('📱 Регистрируем отложенное устройство:', deviceData)

      const result = await registerDevice(deviceData)

      if (result.success) {
        // Удаляем данные отложенной регистрации
        localStorage.removeItem('pending_device_registration')
        console.log('✅ Отложенное устройство успешно зарегистрировано!')

        return result
      } else {
        console.error('❌ Ошибка регистрации отложенного устройства:', result.error)
        return result
      }
    } catch (err) {
      console.error('❌ Ошибка обработки отложенной регистрации:', err)
      return {
        success: false,
        error: err.message,
      }
    }
  }

  /**
   * Создание заказа с авторизацией устройства
   * @param {Object} orderData - Данные заказа
   * @returns {Object} - Результат создания заказа
   */
  const createDeviceOrder = async (orderData) => {
    if (!isDeviceReady.value) {
      return {
        success: false,
        error: 'Устройство не готово для создания заказа',
      }
    }

    try {
      const requestBody = {
        device_android_id: androidId.value,
        table_short_id: shortId.value,
        items: orderData.items,
        total: orderData.total,
      }

      console.log('📱 Создание заказа от устройства:', requestBody)

      // Подготавливаем заголовки
      const headers = {
        'Content-Type': 'application/json',
      }

      // Добавляем заголовок авторизации
      const authStore = useAuthStore()
      if (authStore.sessionId) {
        headers['X-Admin-Session'] = authStore.sessionId
        console.log('🔑 Используем Admin Session для создания заказа')
      }

      // Также добавляем device token
      if (deviceToken.value) {
        headers['Authorization'] = `Bearer ${deviceToken.value}`
        console.log('🔑 Добавляем Device Token для создания заказа')
      }

      const response = await fetch(apiConfigStore.getSecureUrl('/api/orders'), {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Заказ создан:', result)

      return {
        success: true,
        data: result,
        message: 'Заказ успешно создан',
      }
    } catch (err) {
      console.error('❌ Ошибка создания заказа:', err)
      return {
        success: false,
        error: err.message,
      }
    }
  }

  /**
   * Сохранение данных устройства в localStorage
   */
  const saveDeviceToStorage = () => {
    const deviceData = {
      androidId: androidId.value,
      deviceToken: deviceToken.value,
      shortId: shortId.value,
      deviceInfo: deviceInfo.value,
      isRegistered: isRegistered.value,
    }
    localStorage.setItem('device_data', JSON.stringify(deviceData))
    console.log('💾 Данные устройства сохранены в localStorage')
  }

  /**
   * Загрузка данных устройства из localStorage
   */
  const loadDeviceFromStorage = () => {
    try {
      const savedData = localStorage.getItem('device_data')
      if (savedData) {
        const deviceData = JSON.parse(savedData)
        androidId.value = deviceData.androidId
        deviceToken.value = deviceData.deviceToken
        shortId.value = deviceData.shortId
        deviceInfo.value = deviceData.deviceInfo
        isRegistered.value = deviceData.isRegistered
        console.log('📂 Данные устройства загружены из localStorage')
        console.log('📱 Загруженный shortId:', shortId.value)
        console.log('📱 Загруженный androidId:', androidId.value)
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки данных устройства:', err)
    }
  }

  /**
   * Очистка данных устройства
   */
  const clearDeviceData = () => {
    deviceInfo.value = null
    deviceToken.value = null
    androidId.value = null
    shortId.value = null
    isRegistered.value = false
    localStorage.removeItem('device_data')
    console.log('🗑️ Данные устройства очищены')
  }

  /**
   * Проверка, работает ли приложение в Android WebView
   */
  const isAndroidApp = computed(() => {
    return !!(window.Android && typeof window.Android.getAndroidId === 'function')
  })

  return {
    // State - текущее устройство
    deviceInfo,
    deviceToken,
    androidId,
    shortId,
    isRegistered,
    isLoading,
    error,

    // State - список всех устройств
    allDevices,
    devicesLoading,
    devicesError,

    // Getters - текущее устройство
    hasDeviceToken,
    hasShortId,
    isDeviceReady,
    isAndroidApp,

    // Getters - список устройств
    devicesCount,
    activeDevices,
    devicesWithShortId,
    devicesWithoutShortId,

    // Actions - текущее устройство
    registerDevice,
    getDeviceInfo,
    updateDeviceStatus,
    initializeDevice,
    createDeviceOrder,
    saveDeviceToStorage,
    loadDeviceFromStorage,
    clearDeviceData,

    // Actions - управление списком устройств
    getAllDevices,
    getDeviceById,
    updateDeviceInList,
    removeDeviceFromList,
    assignShortId,
    registerPendingDevice,
    refreshDeviceInfo,
  }
})
