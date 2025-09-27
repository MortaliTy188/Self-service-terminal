import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import defaultSplashImage from '@/assets/mainBackground.png'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const splashSettings = ref({
    currentImage: '',
    duration: 3,
    showOnStartup: true,
  })

  const apiSettings = ref({
    serverUrl: 'http://83.222.9.90:8080',
    apiKey: '',
    requestTimeout: 30,
    syncInterval: 300,
    isConnected: false,
  })

  const systemSettings = ref({
    language: 'ru',
    currency: 'RUB',
    timezone: 'Europe/Moscow',
    autoLogoutTimeout: 30,
    enableSounds: true,
    enableAnimations: true,
  })

  const deviceSettings = ref({
    devices: [
      {
        id: 1,
        tableNumber: 5,
        batteryLevel: 85,
        isOnline: true,
        model: 'Samsung Galaxy Tab A7',
        lastActivity: new Date(Date.now() - 1000 * 60 * 5),
        connectionKey: 'KEY-5-2024',
        ipAddress: '192.168.1.105',
      },
      {
        id: 2,
        tableNumber: 3,
        batteryLevel: 92,
        isOnline: true,
        model: 'iPad Air',
        lastActivity: new Date(Date.now() - 1000 * 60 * 2),
        connectionKey: 'KEY-3-2024',
        ipAddress: '192.168.1.103',
      },
      {
        id: 3,
        tableNumber: 7,
        batteryLevel: 45,
        isOnline: false,
        model: 'Samsung Galaxy Tab S7',
        lastActivity: new Date(Date.now() - 1000 * 60 * 30),
        connectionKey: 'KEY-7-2024',
        ipAddress: '192.168.1.107',
      },
    ],
  })

  // Constants
  const SPLASH_SETTINGS_KEY = 'splash-settings'
  const API_SETTINGS_KEY = 'api-settings'
  const SYSTEM_SETTINGS_KEY = 'system-settings'

  // Getters
  const backgroundImage = computed(() => {
    return splashSettings.value.currentImage || defaultSplashImage
  })

  const backgroundStyle = computed(() => {
    return {
      backgroundImage: `url(${backgroundImage.value})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  })

  const onlineDevices = computed(() => {
    return deviceSettings.value.devices.filter((device) => device.isOnline)
  })

  const offlineDevices = computed(() => {
    return deviceSettings.value.devices.filter((device) => !device.isOnline)
  })

  const lowBatteryDevices = computed(() => {
    return deviceSettings.value.devices.filter((device) => device.batteryLevel < 20)
  })

  // Actions
  const loadSplashSettings = () => {
    try {
      const saved = localStorage.getItem(SPLASH_SETTINGS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        splashSettings.value = { ...splashSettings.value, ...parsed }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек заставки:', error)
    }
  }

  const saveSplashSettings = () => {
    try {
      localStorage.setItem(SPLASH_SETTINGS_KEY, JSON.stringify(splashSettings.value))
    } catch (error) {
      console.error('Ошибка сохранения настроек заставки:', error)
    }
  }

  const updateSplashImage = (imageFile) => {
    return new Promise((resolve, reject) => {
      if (!imageFile) {
        splashSettings.value.currentImage = ''
        saveSplashSettings()
        resolve()
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        splashSettings.value.currentImage = e.target.result
        saveSplashSettings()
        resolve(e.target.result)
      }
      reader.onerror = reject
      reader.readAsDataURL(imageFile)
    })
  }

  // Функция для обновления изображения заставки из base64 строки
  const updateSplashImageBase64 = (base64String) => {
    splashSettings.value.currentImage = base64String
    saveSplashSettings()
  }

  const updateSplashDuration = (duration) => {
    splashSettings.value.duration = Math.max(1, Math.min(10, duration))
    saveSplashSettings()
  }

  const updateShowOnStartup = (show) => {
    splashSettings.value.showOnStartup = show
    saveSplashSettings()
  }

  const loadApiSettings = () => {
    try {
      const saved = localStorage.getItem(API_SETTINGS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        apiSettings.value = { ...apiSettings.value, ...parsed }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек API:', error)
    }
  }

  const saveApiSettings = () => {
    try {
      localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(apiSettings.value))
    } catch (error) {
      console.error('Ошибка сохранения настроек API:', error)
    }
  }

  const updateApiSettings = (newSettings) => {
    apiSettings.value = { ...apiSettings.value, ...newSettings }
    saveApiSettings()
  }

  const testApiConnection = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        apiSettings.value.requestTimeout * 1000,
      )

      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiSettings.value.apiKey && { Authorization: `Bearer ${apiSettings.value.apiKey}` }),
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        apiSettings.value.isConnected = true
        return { success: true, message: 'Соединение установлено' }
      } else {
        apiSettings.value.isConnected = false
        return { success: false, message: `Ошибка сервера: ${response.status}` }
      }
    } catch (error) {
      apiSettings.value.isConnected = false

      if (error.name === 'AbortError') {
        return { success: false, message: 'Превышено время ожидания' }
      }

      return { success: false, message: error.message || 'Ошибка подключения' }
    }
  }

  const loadSystemSettings = () => {
    try {
      const saved = localStorage.getItem(SYSTEM_SETTINGS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        systemSettings.value = { ...systemSettings.value, ...parsed }
      }
    } catch (error) {
      console.error('Ошибка загрузки системных настроек:', error)
    }
  }

  const saveSystemSettings = () => {
    try {
      localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(systemSettings.value))
    } catch (error) {
      console.error('Ошибка сохранения системных настроек:', error)
    }
  }

  const updateSystemSettings = (newSettings) => {
    systemSettings.value = { ...systemSettings.value, ...newSettings }
    saveSystemSettings()
  }

  const getDeviceById = (id) => {
    return deviceSettings.value.devices.find((device) => device.id === id)
  }

  const updateDeviceStatus = (id, status) => {
    const device = getDeviceById(id)
    if (device) {
      device.isOnline = status
      device.lastActivity = new Date()
    }
  }

  const updateDeviceBattery = (id, batteryLevel) => {
    const device = getDeviceById(id)
    if (device) {
      device.batteryLevel = Math.max(0, Math.min(100, batteryLevel))
    }
  }

  const updateConnectionKey = (id, newKey) => {
    const device = getDeviceById(id)
    if (device) {
      device.connectionKey = newKey
    }
  }

  const removeDevice = (id) => {
    const index = deviceSettings.value.devices.findIndex((device) => device.id === id)
    if (index > -1) {
      deviceSettings.value.devices.splice(index, 1)
    }
  }

  const addDevice = (deviceData) => {
    const newDevice = {
      id: Date.now(),
      batteryLevel: 100,
      isOnline: true,
      lastActivity: new Date(),
      connectionKey: `KEY-${deviceData.tableNumber}-${new Date().getFullYear()}`,
      ...deviceData,
    }
    deviceSettings.value.devices.push(newDevice)
    return newDevice
  }

  // Initialize settings
  const initializeSettings = () => {
    loadSplashSettings()
    loadApiSettings()
    loadSystemSettings()
  }

  // Auto-save when settings change
  const exportSettings = () => {
    return {
      splash: splashSettings.value,
      api: apiSettings.value,
      system: systemSettings.value,
      devices: deviceSettings.value.devices,
    }
  }

  const importSettings = (settings) => {
    if (settings.splash) {
      splashSettings.value = { ...splashSettings.value, ...settings.splash }
      saveSplashSettings()
    }
    if (settings.api) {
      apiSettings.value = { ...apiSettings.value, ...settings.api }
      saveApiSettings()
    }
    if (settings.system) {
      systemSettings.value = { ...systemSettings.value, ...settings.system }
      saveSystemSettings()
    }
    if (settings.devices) {
      deviceSettings.value.devices = settings.devices
    }
  }

  return {
    // State
    splashSettings,
    apiSettings,
    systemSettings,
    deviceSettings,

    // Getters
    backgroundImage,
    backgroundStyle,
    onlineDevices,
    offlineDevices,
    lowBatteryDevices,

    // Actions
    loadSplashSettings,
    saveSplashSettings,
    updateSplashImage,
    updateSplashImageBase64,
    updateSplashDuration,
    updateShowOnStartup,
    loadApiSettings,
    saveApiSettings,
    updateApiSettings,
    testApiConnection,
    loadSystemSettings,
    saveSystemSettings,
    updateSystemSettings,
    getDeviceById,
    updateDeviceStatus,
    updateDeviceBattery,
    updateConnectionKey,
    removeDevice,
    addDevice,
    initializeSettings,
    exportSettings,
    importSettings,
  }
})

// Инициализируем настройки сразу при создании store
setTimeout(() => {
  const store = useSettingsStore()
  store.initializeSettings()
}, 0)
