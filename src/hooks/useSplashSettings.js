import { ref, computed } from 'vue'
import defaultSplashImage from '@/assets/mainBackground.png'

// Глобальное состояние настроек заставки
const splashSettings = ref({
  currentImage: '',
  duration: 3,
  showOnStartup: true,
})

// Ключ для localStorage
const SPLASH_SETTINGS_KEY = 'splash-settings'

export function useSplashSettings() {
  // Загрузка настроек из localStorage при инициализации
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(SPLASH_SETTINGS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        splashSettings.value = { ...splashSettings.value, ...parsed }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек заставки:', error)
    }
  }

  // Сохранение настроек в localStorage
  const saveSettings = (newSettings) => {
    try {
      splashSettings.value = { ...splashSettings.value, ...newSettings }
      localStorage.setItem(SPLASH_SETTINGS_KEY, JSON.stringify(splashSettings.value))
      console.log('Настройки заставки сохранены:', splashSettings.value)
    } catch (error) {
      console.error('Ошибка сохранения настроек заставки:', error)
    }
  }

  // Обновление изображения заставки
  const updateSplashImage = (imageData) => {
    const newSettings = { ...splashSettings.value, currentImage: imageData }
    saveSettings(newSettings)
  }

  // Обновление продолжительности показа
  const updateDuration = (duration) => {
    const newSettings = { ...splashSettings.value, duration }
    saveSettings(newSettings)
  }

  // Обновление настройки показа при запуске
  const updateShowOnStartup = (showOnStartup) => {
    const newSettings = { ...splashSettings.value, showOnStartup }
    saveSettings(newSettings)
  }

  // Получение текущего изображения фона
  const backgroundImage = computed(() => {
    return splashSettings.value.currentImage || defaultSplashImage
  })

  // CSS стиль для фона
  const backgroundStyle = computed(() => {
    const image = splashSettings.value.currentImage || defaultSplashImage
    return {
      backgroundImage: `url(${image})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  })

  // Инициализация - загружаем сохраненные настройки
  loadSettings()

  return {
    splashSettings: computed(() => splashSettings.value),
    backgroundImage,
    backgroundStyle,
    loadSettings,
    saveSettings,
    updateSplashImage,
    updateDuration,
    updateShowOnStartup,
  }
}
