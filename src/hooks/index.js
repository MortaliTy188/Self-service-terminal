// Остальные хуки
export { useSplashSettings } from './useSplashSettings.js'
export { useAdminAuth } from './useAdminAuth.js'

// Прямой доступ к stores
export {
  useMainStore,
  useAuthStore,
  useMenuStore,
  useOrdersStore,
  useSettingsStore,
  useWaiterStore,
  useApiConfigStore,
} from '@/stores'

// API клиент
export { apiClient, BASE_URL } from './api.js'
