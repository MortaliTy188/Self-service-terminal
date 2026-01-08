<script setup>
import { useRouter } from 'vue-router'
import { useSettingsStore, useApiConfigStore, useImagesStore, useWebSocketStore } from '@/stores'
import { onMounted, onUnmounted, computed } from 'vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const apiConfigStore = useApiConfigStore()
const imagesStore = useImagesStore()
const webSocketStore = useWebSocketStore()

// Computed свойство для фона с изображением
const backgroundStyle = computed(() => {
  // Получаем URL изображения, убеждаясь что это строка
  let imageUrl = imagesStore.currentSplashImage

  // Если это объект, извлекаем URL
  if (imageUrl && typeof imageUrl === 'object') {
    imageUrl = imageUrl.url || ''
    console.warn('⚠️ currentSplashImage содержит объект, извлекаем URL:', imageUrl)
  }

  // Используем изображение с сервера или fallback
  const finalImageUrl = imageUrl || settingsStore.backgroundImage.value

  return {
    backgroundImage: `url(${finalImageUrl})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})

const goToMainPage = async () => {
  console.log('Попытка перехода на главную страницу...')

  // Принудительно перезагружаем конфигурацию
  await apiConfigStore.fetchConfig()

  console.log('Текущая конфигурация после загрузки:', apiConfigStore.config)
  console.log('Статус настройки:', apiConfigStore.isFullyConfigured)

  if (!apiConfigStore.isFullyConfigured) {
    alert('Настройте терминал')
    console.log('Переход отклонен - терминал не настроен')
    return
  }

  console.log('Переход разрешен - терминал настроен')
  router.push('/main')
}

// Загружаем конфигурацию при монтировании
onMounted(async () => {
  console.log('Greetings mounted - загружаем конфигурацию...')
  await apiConfigStore.fetchConfig()
  console.log('Конфигурация загружена:', apiConfigStore.config)

  // Загружаем активное изображение заставки с сервера
  // Используем новый API GET /api/images/active
  const result = await imagesStore.fetchActiveImage()
  if (result.success && result.data) {
    console.log('✅ Активное изображение загружено:', result.data)
  } else {
    // Если нет активного изображения, пробуем загрузить из localStorage
    imagesStore.loadCurrentSplashImage()
    console.log('📱 Загружено изображение из localStorage:', imagesStore.currentSplashImage)
  }

  // Подключаем WebSocket для обновления изображения в реальном времени
  console.log('🔌 Подключение WebSocket изображений на странице приветствия...')
  webSocketStore.connectImagesSocket()
})

// Очистка при размонтировании
onUnmounted(() => {
  console.log('🔌 Отключение WebSocket изображений на странице приветствия...')
  webSocketStore.disconnectImagesSocket()
})
</script>

<template>
  <main :style="backgroundStyle">
    <button
      class="start-button"
      @click="goToMainPage"
      :disabled="!apiConfigStore.isFullyConfigured"
      :class="{ disabled: !apiConfigStore.isFullyConfigured }"
    >
      Начать
    </button>
  </main>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
  width: 100vw;
}

.greetings {
  font-weight: bold;
  font-size: clamp(2rem, 8vw, 5rem);
  color: #1c1c1c;
}

.container {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  width: 95%;
  height: clamp(50px, 10vh, 100px);
  margin-bottom: 1rem;
  border-radius: 25px;
}

.start-button {
  width: 424px;
  height: 121px;
  padding: 40px 100px;
  border-radius: 20px;
  font-size: 36px;
  border: none;
  color: white;
  margin: 25px 50px 50px auto;
  background-color: #151515;
  cursor: pointer;
}

.start-button.disabled {
  background: #383838;
  color: #666;
  cursor: not-allowed;
  opacity: 0.6;
}

.start-button:not(.disabled):hover {
  background: #383838;
  transform: translateY(-2px);
}

.config-warning {
  background: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 15px;
  padding: 1rem 2rem;
  margin: 1rem;
  color: #92400e;
  font-size: clamp(1rem, 3vw, 1.5rem);
  font-weight: 600;
  text-align: center;
  max-width: 600px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@media (max-width: 768px) {
  .container {
    width: 95%;
    margin-bottom: 0.5rem;
  }
  .start-button {
    margin-bottom: 1rem;
  }
}

@media (max-width: 1280px) {
  .greetings {
    font-size: 5rem;
  }
  .start-button {
    margin-bottom: 100px;
  }
}
</style>
