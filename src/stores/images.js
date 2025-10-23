import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApiConfigStore } from './apiConfig'
import { useAuthStore } from './auth'

export const useImagesStore = defineStore('images', () => {
  const apiConfigStore = useApiConfigStore()
  const authStore = useAuthStore()

  // State
  const images = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const currentSplashImage = ref(null)

  /**
   * Загрузить изображение на сервер
   * @param {File} file - Файл изображения
   * @returns {Object} - Результат загрузки
   */
  const uploadImage = async (file) => {
    isLoading.value = true
    error.value = null

    try {
      console.log('📤 Загружаем изображение на сервер:', file.name)

      const formData = new FormData()
      formData.append('image', file)

      // Получаем заголовки авторизации
      const headers = {}
      if (authStore.sessionId) {
        headers['X-Admin-Session'] = authStore.sessionId
        console.log('🔑 Используем Admin Session для загрузки изображения')
      }

      const response = await fetch(apiConfigStore.getSecureUrl('/api/images/upload'), {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Изображение загружено:', result)

      // Обновляем список изображений
      await fetchImages()

      return {
        success: true,
        data: result,
        message: 'Изображение успешно загружено',
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки изображения:', err)
      error.value = err.message
      return {
        success: false,
        error: err.message,
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Получить список всех изображений
   * Доступно без авторизации для всех устройств
   * @returns {Object} - Список изображений
   */
  const fetchImages = async () => {
    isLoading.value = true
    error.value = null

    try {
      console.log('📥 Загружаем список изображений...')

      // GET /api/images доступен без авторизации
      const response = await fetch(apiConfigStore.getSecureUrl('/api/images'), {
        method: 'GET',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Список изображений загружен:', result)

      images.value = result

      // Если есть изображения, устанавливаем первое как текущее (если не установлено)
      if (result.length > 0 && !currentSplashImage.value) {
        // Сохраняем полный URL с baseUrl
        const firstImageUrl = apiConfigStore.getSecureUrl(result[0].url)
        currentSplashImage.value = firstImageUrl
        setCurrentSplashImage(firstImageUrl)
      }

      return {
        success: true,
        data: result,
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки списка изображений:', err)
      error.value = err.message
      return {
        success: false,
        error: err.message,
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Удалить изображение
   * @param {Number} id - ID изображения
   * @returns {Object} - Результат удаления
   */
  const deleteImage = async (id) => {
    isLoading.value = true
    error.value = null

    try {
      console.log('🗑️ Удаляем изображение:', id)

      const headers = {}
      if (authStore.sessionId) {
        headers['X-Admin-Session'] = authStore.sessionId
      }

      const response = await fetch(apiConfigStore.getSecureUrl(`/api/images/${id}`), {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Изображение удалено:', result)

      // Обновляем список изображений
      await fetchImages()

      return {
        success: true,
        data: result,
        message: 'Изображение успешно удалено',
      }
    } catch (err) {
      console.error('❌ Ошибка удаления изображения:', err)
      error.value = err.message
      return {
        success: false,
        error: err.message,
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Установить текущее изображение для заставки
   * @param {String} imageUrl - URL изображения
   */
  const setCurrentSplashImage = (imageUrl) => {
    // Убеждаемся, что сохраняем строку, а не объект
    const urlString = typeof imageUrl === 'string' ? imageUrl : imageUrl?.url || ''
    currentSplashImage.value = urlString
    // Сохраняем в localStorage для быстрого доступа
    localStorage.setItem('current_splash_image', urlString)
    console.log('✅ Установлено изображение заставки:', urlString)
  }

  /**
   * Загрузить текущее изображение заставки из localStorage
   */
  const loadCurrentSplashImage = () => {
    const saved = localStorage.getItem('current_splash_image')
    if (saved) {
      // Проверяем, что это строка URL, а не JSON объект
      try {
        // Если это JSON, парсим и извлекаем URL
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && parsed.url) {
          currentSplashImage.value = parsed.url
          // Исправляем localStorage, сохраняя только URL
          localStorage.setItem('current_splash_image', parsed.url)
          console.log('📱 Загружено сохраненное изображение заставки (из объекта):', parsed.url)
        } else {
          currentSplashImage.value = saved
          console.log('📱 Загружено сохраненное изображение заставки:', saved)
        }
      } catch (e) {
        // Это не JSON, значит это простая строка URL
        currentSplashImage.value = saved
        console.log('📱 Загружено сохраненное изображение заставки:', saved)
      }
    }
  }

  /**
   * Получить URL изображения для отображения
   * @param {String} filename - Имя файла
   * @returns {String} - Полный URL изображения
   */
  const getImageUrl = (filename) => {
    return apiConfigStore.getSecureUrl(`/api/images/${filename}`)
  }

  /**
   * Проверить и обновить изображение заставки с сервера
   * Автоматически обновляет текущее изображение если на сервере появилось новое
   * @returns {Object} - Результат проверки
   */
  const checkAndUpdateSplashImage = async () => {
    try {
      console.log('🔄 Проверяем обновления изображения заставки...')

      const result = await fetchImages()

      if (result.success && result.data.length > 0) {
        // Берем первое изображение из списка (самое свежее)
        const latestImage = result.data[0]
        const latestImageUrl = apiConfigStore.getSecureUrl(latestImage.url)

        // Проверяем, отличается ли от текущего
        if (currentSplashImage.value !== latestImageUrl) {
          console.log('🆕 Обнаружено новое изображение, обновляем...')
          console.log('Старое:', currentSplashImage.value)
          console.log('Новое:', latestImageUrl)

          setCurrentSplashImage(latestImageUrl)

          return {
            success: true,
            updated: true,
            newImageUrl: latestImageUrl,
          }
        } else {
          console.log('✅ Изображение актуально')
          return {
            success: true,
            updated: false,
          }
        }
      }

      return {
        success: false,
        error: 'Нет доступных изображений',
      }
    } catch (err) {
      console.error('❌ Ошибка проверки обновлений изображения:', err)
      return {
        success: false,
        error: err.message,
      }
    }
  }

  /**
   * Запустить периодическую проверку обновлений изображения
   * @param {Number} intervalMinutes - Интервал проверки в минутах (по умолчанию 5)
   * @returns {Number} - ID интервала для остановки
   */
  const startAutoUpdate = (intervalMinutes = 5) => {
    const intervalMs = intervalMinutes * 60 * 1000
    console.log(`🔄 Запущена автоматическая проверка изображения каждые ${intervalMinutes} мин`)

    // Сразу проверяем при запуске
    checkAndUpdateSplashImage()

    // Затем проверяем периодически
    const intervalId = setInterval(() => {
      checkAndUpdateSplashImage()
    }, intervalMs)

    return intervalId
  }

  /**
   * Остановить автоматическую проверку
   * @param {Number} intervalId - ID интервала
   */
  const stopAutoUpdate = (intervalId) => {
    if (intervalId) {
      clearInterval(intervalId)
      console.log('⏹️ Автоматическая проверка изображения остановлена')
    }
  }

  // Инициализация - загружаем сохраненное изображение
  loadCurrentSplashImage()

  return {
    // State
    images,
    isLoading,
    error,
    currentSplashImage,

    // Actions
    uploadImage,
    fetchImages,
    deleteImage,
    setCurrentSplashImage,
    loadCurrentSplashImage,
    getImageUrl,
    checkAndUpdateSplashImage,
    startAutoUpdate,
    stopAutoUpdate,
  }
})
