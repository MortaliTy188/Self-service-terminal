import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMainStore = defineStore('main', () => {
  // State
  const isLoading = ref(false)
  const appTitle = ref('Self Service Terminal')
  const currentRoute = ref(null)

  // Theme settings
  const theme = ref({
    primaryColor: '#4caf50',
    secondaryColor: '#ff6b35',
    backgroundColor: '#f5f5f5',
  })

  // Error handling
  const globalError = ref(null)
  const notifications = ref([])

  // Getters
  const hasNotifications = computed(() => notifications.value.length > 0)
  const notificationCount = computed(() => notifications.value.length)

  // Actions
  const setLoading = (loading) => {
    isLoading.value = loading
  }

  const setGlobalError = (error) => {
    globalError.value = error
    if (error) {
      console.error('Global error:', error)
    }
  }

  const addNotification = (notification) => {
    const id = Date.now().toString()
    notifications.value.push({
      id,
      type: 'info',
      title: '',
      message: '',
      duration: 5000,
      ...notification,
    })
    return id
  }

  const removeNotification = (id) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  const updateTheme = (newTheme) => {
    theme.value = { ...theme.value, ...newTheme }
  }

  return {
    // State
    isLoading,
    appTitle,
    currentRoute,
    theme,
    globalError,
    notifications,

    // Getters
    hasNotifications,
    notificationCount,

    // Actions
    setLoading,
    setGlobalError,
    addNotification,
    removeNotification,
    clearNotifications,
    updateTheme,
  }
})
