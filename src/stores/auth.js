import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const isAuthenticated = ref(false)
  const sessionId = ref(null)
  const sessionExpiry = ref(null)
  const adminUser = ref(null)

  // Constants
  const BASE_URL = 'http://localhost:8080'
  const VALID_ADMIN_KEYS = ['admin123', 'terminal-admin', 'management-key', 'settings-access']

  // Getters
  const isSessionValid = computed(() => {
    if (!sessionId.value || !sessionExpiry.value) return false
    return Date.now() < sessionExpiry.value
  })

  // Actions
  const verifyAdminKey = async (adminKey) => {
    try {
      console.log('Проверка админ-ключа на сервере...')

      const response = await fetch(`${BASE_URL}/admin/verify`, {
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
        // Преобразуем дату в timestamp
        const expiryDate = new Date(result.expiresAt)
        sessionExpiry.value = expiryDate.getTime()
        isAuthenticated.value = true

        console.log('Админ-ключ успешно подтвержден сервером')
        return {
          success: true,
          message: result.message || 'Доступ к админ-панели получен',
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

  const promptForAdminKey = async () => {
    const adminKey = prompt('Введите админ-ключ для доступа к панели управления:')

    if (!adminKey) {
      return { success: false, cancelled: true }
    }

    if (adminKey.trim().length < 3) {
      alert('Админ-ключ слишком короткий')
      return { success: false, error: 'Слишком короткий ключ' }
    }

    return await verifyAdminKey(adminKey.trim())
  }

  const validateSession = async () => {
    if (!sessionId.value) {
      return false
    }

    // Проверяем локальное время истечения
    if (!isSessionValid.value) {
      console.log('Сессия истекла (локальная проверка)')
      logout()
      return false
    }

    // Дополнительно проверяем на сервере
    try {
      const response = await fetch(`${BASE_URL}/admin/validate-session`, {
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
          console.log('Сервер отклонил сессию')
          logout()
          return false
        }
      } else {
        console.log('Ошибка при проверке сессии на сервере')
        logout()
        return false
      }
    } catch (error) {
      console.error('Ошибка проверки сессии на сервере:', error)
      // В случае ошибки сети, используем локальную проверку
      return isSessionValid.value
    }
  }

  const logout = () => {
    isAuthenticated.value = false
    sessionId.value = null
    sessionExpiry.value = null
    adminUser.value = null
    console.log('Выход из системы')
  }

  const checkAdminAccess = async () => {
    // Проверяем действительность текущей сессии
    if (isAuthenticated.value && (await validateSession())) {
      return { success: true, message: 'Доступ уже получен' }
    }

    // Запрашиваем админ-ключ
    return await promptForAdminKey()
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
  }
})
