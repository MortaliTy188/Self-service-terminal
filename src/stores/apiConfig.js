import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useApiConfigStore = defineStore('apiConfig', () => {
  // State
  const config = ref({
    api_login: '',
    organization_id: '',
    terminal_group_id: '',
    payment_type_id: '',
    table_id: '',
  })

  const isLoading = ref(false)
  const error = ref(null)
  const lastUpdated = ref(null)

  // Constants
  const BASE_URL = 'http://localhost:8080'

  // Getters
  const isConfigured = computed(() => {
    return (
      config.value.api_login &&
      config.value.organization_id &&
      config.value.terminal_group_id &&
      config.value.payment_type_id &&
      config.value.table_id
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
  const fetchConfig = async () => {
    isLoading.value = true
    error.value = null

    try {
      console.log('Запрашиваем конфигурацию с сервера...')
      const response = await fetch(`${BASE_URL}/api/config`)

      if (!response.ok) {
        if (response.status === 404) {
          // Конфигурации нет - устанавливаем пустую
          console.log('Конфигурация не найдена на сервере (404)')
          config.value = {
            api_login: '',
            organization_id: '',
            terminal_group_id: '',
            payment_type_id: '',
            table_id: '',
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
          table_id: result.table_id || '',
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
          table_id: '',
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
        table_id: '',
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
      const response = await fetch(`${BASE_URL}/api/config/extended`, {
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
          table_id: result.data.table_id || '',
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
      const response = await fetch(`${BASE_URL}/api/test-connection`, {
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
      const response = await fetch(`${BASE_URL}/api/terminal-groups`)

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

  const clearConfig = () => {
    config.value = {
      api_login: '',
      organization_id: '',
      terminal_group_id: '',
      payment_type_id: '',
      table_id: '',
    }
    error.value = null
    lastUpdated.value = null
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    config,
    isLoading,
    error,
    lastUpdated,

    // Getters
    isConfigured,
    isFullyConfigured,

    // Actions
    fetchConfig,
    saveExtendedConfig,
    testConnection,
    getTerminalGroups,
    clearConfig,
    clearError,
  }
})
