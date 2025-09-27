import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const isAuthenticated = ref(false)
  const sessionId = ref(null)
  const sessionExpiry = ref(null)
  const adminUser = ref(null)

  // Constants
  const BASE_URL = 'http://83.222.9.90:8080'
  const VALID_ADMIN_KEYS = ['admin123', 'terminal-admin', 'management-key', 'settings-access']

  // Getters
  const isSessionValid = computed(() => {
    if (!sessionId.value || !sessionExpiry.value) return false
    return Date.now() < sessionExpiry.value
  })

  // Actions
  const verifyAdminKey = (adminKey) => {
    console.log('Проверка админ-ключа (клиентская версия)...')

    if (VALID_ADMIN_KEYS.includes(adminKey)) {
      // Создаем сессию на 2 часа
      const expiryTime = new Date()
      expiryTime.setHours(expiryTime.getHours() + 2)

      sessionId.value = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionExpiry.value = expiryTime.getTime()
      isAuthenticated.value = true

      console.log('Админ-ключ успешно подтвержден (клиентская проверка)')
      return {
        success: true,
        message: 'Доступ к админ-панели получен',
      }
    } else {
      console.log('Неверный админ-ключ')
      return {
        success: false,
        error: 'Неверный админ-ключ',
      }
    }
  }

  const promptForAdminKey = () => {
    const adminKey = prompt('Введите админ-ключ для доступа к панели управления:')

    if (!adminKey) {
      return { success: false, cancelled: true }
    }

    if (adminKey.trim().length < 3) {
      alert('Админ-ключ слишком короткий')
      return { success: false, error: 'Слишком короткий ключ' }
    }

    return verifyAdminKey(adminKey.trim())
  }

  const validateSession = () => {
    if (!isSessionValid.value) {
      console.log('Сессия истекла (клиентская проверка)')
      logout()
      return false
    }
    return true
  }

  const logout = () => {
    isAuthenticated.value = false
    sessionId.value = null
    sessionExpiry.value = null
    adminUser.value = null
    console.log('Выход из системы')
  }

  const checkAdminAccess = () => {
    // Проверяем действительность текущей сессии
    if (isAuthenticated.value && validateSession()) {
      return { success: true, message: 'Доступ уже получен' }
    }

    // Запрашиваем админ-ключ
    return promptForAdminKey()
  }

  // Server methods (готовы к использованию, но закомментированы)
  const verifyAdminKeyServer = async (adminKey) => {
    try {
      console.log('Проверка админ-ключа на сервере...')

      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminKey }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.sessionId) {
        sessionId.value = result.sessionId
        sessionExpiry.value = result.expiresAt || Date.now() + 2 * 60 * 60 * 1000
        isAuthenticated.value = true
        console.log('Админ-ключ успешно подтвержден сервером')
        return {
          success: true,
          message: 'Доступ к админ-панели получен',
        }
      } else {
        console.log('Сервер отклонил админ-ключ')
        return {
          success: false,
          error: result.message || 'Неверный админ-ключ',
        }
      }
    } catch (error) {
      console.error('Ошибка при проверке админ-ключа на сервере:', error)
      return {
        success: false,
        error: 'Ошибка подключения к серверу',
      }
    }
  }

  const validateSessionServer = async () => {
    if (!sessionId.value) return false

    try {
      const response = await fetch('/api/admin/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: sessionId.value }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.valid) {
          return true
        } else {
          logout()
          return false
        }
      }
    } catch (error) {
      console.error('Ошибка проверки сессии на сервере:', error)
      return false
    }

    return false
  }

  return {
    // State
    isAuthenticated,
    sessionId,
    sessionExpiry,
    adminUser,

    // Getters
    isSessionValid,

    // Actions
    verifyAdminKey,
    promptForAdminKey,
    validateSession,
    logout,
    checkAdminAccess,

    // Server methods (готовы к использованию)
    verifyAdminKeyServer,
    validateSessionServer,
  }
})
