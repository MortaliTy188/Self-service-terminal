import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApiConfigStore } from './apiConfig'

export const useAuthStore = defineStore('auth', () => {
  const apiConfigStore = useApiConfigStore()

  // State
  const isAuthenticated = ref(false)
  const sessionId = ref(null)
  const sessionExpiry = ref(null)
  const adminUser = ref(null)

  // Constants
  const VALID_ADMIN_KEYS = ['admin123', 'terminal-admin', 'management-key', 'settings-access']

  // Getters
  const isSessionValid = computed(() => {
    if (!sessionId.value || !sessionExpiry.value) return false
    return Date.now() < sessionExpiry.value
  })

  // Загрузка сохраненной админской сессии из localStorage
  const loadSessionFromStorage = () => {
    try {
      const savedSession = localStorage.getItem('admin_session')
      if (savedSession) {
        const sessionData = JSON.parse(savedSession)

        // Проверяем, что сессия не истекла
        if (sessionData.sessionExpiry && Date.now() < sessionData.sessionExpiry) {
          sessionId.value = sessionData.sessionId
          sessionExpiry.value = sessionData.sessionExpiry
          isAuthenticated.value = true
          console.log('🔄 Админская сессия восстановлена из localStorage')
          console.log('🔑 Session ID:', sessionId.value)
          console.log('⏰ Действует до:', new Date(sessionExpiry.value))
          return true
        } else {
          console.log('⚠️ Сохраненная админская сессия истекла')
          localStorage.removeItem('admin_session')
        }
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки админской сессии:', err)
      localStorage.removeItem('admin_session')
    }
    return false
  }

  // Actions
  const verifyAdminKey = async (adminKey) => {
    try {
      console.log('Авторизация администратора на сервере...')

      const response = await fetch(apiConfigStore.getSecureUrl('/admin/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminKey }),
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

        // Сохраняем сессию в localStorage для планшетов
        localStorage.setItem(
          'admin_session',
          JSON.stringify({
            sessionId: sessionId.value,
            sessionExpiry: sessionExpiry.value,
          }),
        )

        console.log('Администратор успешно авторизован')
        console.log('🔑 Session ID сохранен:', sessionId.value)
        console.log('⏰ Срок действия:', new Date(sessionExpiry.value))
        console.log('💾 Админская сессия сохранена в localStorage')

        // Регистрируем отложенное устройство, если есть
        try {
          const { useDeviceStore } = await import('./device')
          const deviceStore = useDeviceStore()
          await deviceStore.registerPendingDevice()

          // Обновляем информацию об устройстве (в т.ч. shortId)
          await deviceStore.refreshDeviceInfo()
        } catch (err) {
          console.log('ℹ️ Нет отложенной регистрации устройства или ошибка:', err.message)
        }

        return {
          success: true,
          message: result.message || 'Доступ к админ-панели получен',
        }
      } else {
        console.log('Сервер отклонил пароль администратора')
        return {
          success: false,
          error: result.message || 'Неверный пароль администратора',
        }
      }
    } catch (error) {
      console.error('Ошибка при авторизации администратора:', error)
      return {
        success: false,
        error: 'Ошибка подключения к серверу',
      }
    }
  }

  const promptForAdminKey = async () => {
    const adminPassword = prompt('Введите пароль администратора для доступа к панели управления:')

    if (!adminPassword) {
      return { success: false, cancelled: true }
    }

    if (adminPassword.trim().length < 3) {
      alert('Пароль администратора слишком короткий')
      return { success: false, error: 'Слишком короткий пароль' }
    }

    return await verifyAdminKey(adminPassword.trim())
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
      const response = await fetch(apiConfigStore.getSecureUrl('/admin/validate-session'), {
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
    loadSessionFromStorage,
  }
})
