import { ref, computed } from 'vue'

// Глобальное состояние аутентификации
const isAuthenticated = ref(false)
const sessionId = ref(null)
const sessionExpiry = ref(null)

// URL сервера для аутентификации
const BASE_URL = 'http://83.222.9.90:8080'

// Список допустимых админ-ключей (в будущем будет проверяться на сервере)
const VALID_ADMIN_KEYS = ['admin123', 'terminal-admin', 'management-key', 'settings-access']

export function useAuth() {
  // Проверка админ-ключа на сервере (ЗАКОММЕНТИРОВАНО - эндпоинт не готов)
  const verifyAdminKeyServer = async (adminKey) => {
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
        // Сохраняем только sessionId, не сам ключ
        sessionId.value = result.sessionId
        sessionExpiry.value = result.expiresAt || Date.now() + 2 * 60 * 60 * 1000 // 2 часа по умолчанию
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

  // Проверка сессии на сервере (ЗАКОММЕНТИРОВАНО - эндпоинт не готов)
  const validateSessionServer = async () => {
    if (!sessionId.value) {
      return false
    }

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
          // Сессия недействительна на сервере
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

  // Проверка админ-ключа (клиентская версия - используется пока нет сервера)
  const verifyAdminKey = (adminKey) => {
    console.log('Проверка админ-ключа (клиентская версия)...')

    // В будущем здесь будет вызов verifyAdminKeyServer(adminKey)
    // return await verifyAdminKeyServer(adminKey)

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

  // Запрос админ-ключа у пользователя
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

  // Проверка действительности сессии (клиентская версия - используется пока нет сервера)
  const validateSession = () => {
    if (!sessionId.value || !sessionExpiry.value) {
      return false
    }

    // В будущем здесь будет вызов validateSessionServer()
    // return await validateSessionServer()

    // Проверяем, не истекла ли сессия
    if (Date.now() > sessionExpiry.value) {
      console.log('Сессия истекла (клиентская проверка)')
      logout()
      return false
    }

    return true
  }

  // Выход из системы
  const logout = () => {
    isAuthenticated.value = false
    sessionId.value = null
    sessionExpiry.value = null
    console.log('Выход из системы')
  }

  // Проверка и запрос доступа к админ-панели
  const checkAdminAccess = () => {
    // Проверяем действительность текущей сессии
    if (isAuthenticated.value && validateSession()) {
      return { success: true, message: 'Доступ уже получен' }
    }

    // Запрашиваем админ-ключ
    return promptForAdminKey()
  }

  return {
    // Состояние
    isAuthenticated: computed(() => isAuthenticated.value),
    sessionId: computed(() => sessionId.value),
    sessionExpiry: computed(() => sessionExpiry.value),

    // Методы (активные)
    checkAdminAccess,
    verifyAdminKey,
    validateSession,
    logout,

    // Методы для сервера (готовы к использованию, но пока закомментированы)
    // verifyAdminKeyServer,
    // validateSessionServer,
  }
}
