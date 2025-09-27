// Остальные хуки
export { useSplashSettings } from './useSplashSettings.js'

// Прямой доступ к stores
export {
  useMainStore,
  useAuthStore,
  useMenuStore,
  useOrdersStore,
  useSettingsStore,
  useWaiterStore,
} from '@/stores'

// API клиент
export { apiClient, BASE_URL } from './api.js'
