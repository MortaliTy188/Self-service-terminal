import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useApiConfigStore = defineStore('apiConfig', () => {
  // State
  const config = ref({
    api_login: '',
    organization_id: '',
    terminal_group_id: '',
    payment_type_id: '',
  })

  const isLoading = ref(false)
  const error = ref(null)
  const lastUpdated = ref(null)

  // Режимы работы
  const serverMode = ref('local') // 'local' или 'public'
  const useProxy = ref(false) // Флаг для использования прокси (для обхода CORS)

  // Constants
  const SERVER_CONFIGS = {
    local: {
      url: 'http://localhost:8080',
      name: 'Локальный сервер',
    },
    public: {
      url: 'http://83.222.9.90:8080',
      name: 'Публичный сервер',
    },
  }

  // Getters
  const currentServerConfig = computed(() => {
    return SERVER_CONFIGS[serverMode.value] || SERVER_CONFIGS.local
  })

  const baseUrl = computed(() => {
    // Если включен режим прокси, используем относительные URL
    if (useProxy.value && import.meta.env.DEV) {
      return '' // Относительные URL - проходят через Vite прокси
    }

    // Если приложение запущено через HTTPS (zrok туннель), используем относительные URL для прохождения через Vite прокси
    if (window.location.protocol === 'https:' && window.location.hostname.includes('zrok.io')) {
      return '' // Относительные URL - проходят через Vite прокси
    }

    // В остальных случаях используем прямое подключение к выбранному серверу
    return currentServerConfig.value.url
  })
  const isConfigured = computed(() => {
    return (
      config.value.api_login &&
      config.value.organization_id &&
      config.value.terminal_group_id &&
      config.value.payment_type_id
    )
  })

  const isFullyConfigured = computed(() => {
    const result = Object.values(config.value).every((value) => value && value.trim().length > 0)
    console.log('isFullyConfigured проверка:')
    console.log('- config.value:', config.value)
    console.log('- все значения заполнены:', result)
    return result
  })

  // Actions
  const switchServerMode = (mode) => {
    if (SERVER_CONFIGS[mode]) {
      serverMode.value = mode
      console.log(`🔄 Переключено на ${SERVER_CONFIGS[mode].name}: ${SERVER_CONFIGS[mode].url}`)

      // Сохраняем выбор в localStorage
      localStorage.setItem('serverMode', mode)
    }
  }

  const toggleProxy = () => {
    useProxy.value = !useProxy.value
    console.log(`🔄 Прокси ${useProxy.value ? 'включен' : 'выключен'}`)
    localStorage.setItem('useProxy', useProxy.value.toString())
  }

  const loadServerMode = async () => {
    // Сначала проверяем переменные окружения (из .env.local)
    const envMode = import.meta.env.VITE_SERVER_MODE
    const envUrl = import.meta.env.VITE_SERVER_URL
    const envName = import.meta.env.VITE_SERVER_NAME

    if (envMode && SERVER_CONFIGS[envMode]) {
      serverMode.value = envMode
      console.log(
        `📂 Загружен режим из переменных окружения: ${envName || SERVER_CONFIGS[envMode].name} (${envUrl || SERVER_CONFIGS[envMode].url})`,
      )
      return
    }

    // Если переменные окружения не установлены, используем localStorage
    const savedMode = localStorage.getItem('serverMode')
    if (savedMode && SERVER_CONFIGS[savedMode]) {
      serverMode.value = savedMode
      console.log(`📂 Загружен режим из localStorage: ${SERVER_CONFIGS[savedMode].name}`)
    } else {
      console.log(`📂 Использован режим по умолчанию: ${SERVER_CONFIGS.local.name}`)
    }

    // Загружаем настройку прокси
    const savedProxy = localStorage.getItem('useProxy')
    if (savedProxy !== null) {
      useProxy.value = savedProxy === 'true'
      console.log(`📂 Загружена настройка прокси: ${useProxy.value ? 'включен' : 'выключен'}`)
    }
  }

  const fetchConfig = async () => {
    isLoading.value = true
    error.value = null

    try {
      console.log('Запрашиваем конфигурацию с сервера...')
      const response = await fetch(`${baseUrl.value}/api/config`)

      if (!response.ok) {
        if (response.status === 404) {
          // Конфигурации нет - устанавливаем пустую
          console.log('Конфигурация не найдена на сервере (404)')
          config.value = {
            api_login: '',
            organization_id: '',
            terminal_group_id: '',
            payment_type_id: '',
          }
          return { success: true, data: null, configured: false }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Ответ сервера:', result)

      // Сервер возвращает данные напрямую, не в поле data
      if (result && result.api_login) {
        config.value = {
          api_login: result.api_login || '',
          organization_id: result.organization_id || '',
          terminal_group_id: result.terminal_group_id || '',
          payment_type_id: result.payment_type_id || '',
        }
        lastUpdated.value = result.updated_at
        console.log('Конфигурация обновлена:', config.value)
      } else {
        // Нет данных в ответе
        console.log('Нет данных в ответе сервера')
        config.value = {
          api_login: '',
          organization_id: '',
          terminal_group_id: '',
          payment_type_id: '',
        }
      }

      return { success: true, data: result }
    } catch (err) {
      console.error('Ошибка загрузки конфигурации:', err)
      error.value = err.message

      // В случае ошибки устанавливаем пустую конфигурацию
      config.value = {
        api_login: '',
        organization_id: '',
        terminal_group_id: '',
        payment_type_id: '',
      }

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  const saveExtendedConfig = async (configData) => {
    isLoading.value = true
    error.value = null

    try {
      console.log('Сохраняем конфигурацию:', configData)
      const response = await fetch(`${baseUrl.value}/api/config/extended`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Ответ сервера при сохранении:', result)

      if (result.data) {
        // Сразу обновляем локальное состояние
        config.value = {
          api_login: result.data.api_login || '',
          organization_id: result.data.organization_id || '',
          terminal_group_id: result.data.terminal_group_id || '',
          payment_type_id: result.data.payment_type_id || '',
        }
        lastUpdated.value = result.data.updated_at
        console.log('Локальная конфигурация обновлена:', config.value)
        console.log('Статус isFullyConfigured:', isFullyConfigured.value)
      }

      return {
        success: true,
        data: result.data,
        message: result.message || 'Конфигурация обновлена успешно',
      }
    } catch (err) {
      console.error('Ошибка сохранения конфигурации:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  const testConnection = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${baseUrl.value}/api/test-connection`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return { success: true, data: result }
    } catch (err) {
      console.error('Ошибка тестирования подключения:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  const getTerminalGroups = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${baseUrl.value}/api/terminal-groups`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return { success: true, data: result.data || [] }
    } catch (err) {
      console.error('Ошибка загрузки терминальных групп:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  const resetConfig = () => {
    config.value = {
      api_login: '',
      organization_id: '',
      terminal_group_id: '',
      payment_type_id: '',
    }
    error.value = null
    lastUpdated.value = null
  }

  const clearError = () => {
    error.value = null
  }

  // Вспомогательная функция для получения безопасных URL
  const getSecureUrl = (path = '') => {
    // Если приложение запущено через HTTPS (zrok туннель), используем относительные URL
    if (window.location.protocol === 'https:' && window.location.hostname.includes('zrok.io')) {
      return path // Относительный URL проходит через Vite прокси
    }

    return `${baseUrl.value}${path}`
  }

  return {
    // State
    config,
    isLoading,
    error,
    lastUpdated,
    serverMode,
    useProxy,

    // Getters
    isConfigured,
    isFullyConfigured,
    currentServerConfig,
    baseUrl,

    // Actions
    switchServerMode,
    loadServerMode,
    toggleProxy,
    fetchConfig,
    saveExtendedConfig,
    testConnection,
    getTerminalGroups,
    resetConfig,
    clearError,
    getSecureUrl,
  }
})
