import { ref } from 'vue'
import { useAuthStore } from '@/stores'

// Глобальное состояние для управления модалом аутентификации
const showAuthModal = ref(false)
const authError = ref('')
const isAuthenticating = ref(false)
let authResolver = null

const useAdminAuth = () => {
  const authStore = useAuthStore()

  const requestAdminAccess = async () => {
    // Проверяем, есть ли уже действующая сессия
    if (authStore.isAuthenticated && (await authStore.validateSession())) {
      return { success: true, message: 'Доступ уже получен' }
    }

    // Показываем модал для ввода ключа
    return new Promise((resolve) => {
      authResolver = resolve
      showAuthModal.value = true
    })
  }

  const handleAdminKeySubmit = async (adminKey) => {
    isAuthenticating.value = true
    authError.value = ''

    try {
      const result = await authStore.verifyAdminKey(adminKey)

      if (result.success) {
        showAuthModal.value = false
        if (authResolver) {
          authResolver(result)
          authResolver = null
        }
      } else {
        authError.value = result.error || 'Неверный админ-ключ'
      }
    } catch (error) {
      console.error('Ошибка аутентификации:', error)
      authError.value = 'Ошибка подключения к серверу'
    } finally {
      isAuthenticating.value = false
    }
  }

  const closeAuthModal = () => {
    showAuthModal.value = false
    authError.value = ''

    if (authResolver) {
      authResolver({ success: false, cancelled: true })
      authResolver = null
    }
  }

  const logout = () => {
    authStore.logout()
  }

  return {
    // State
    showAuthModal,
    authError,
    isAuthenticating,
    isAuthenticated: authStore.isAuthenticated,

    // Methods
    requestAdminAccess,
    handleAdminKeySubmit,
    closeAuthModal,
    logout,
  }
}

export { useAdminAuth }
