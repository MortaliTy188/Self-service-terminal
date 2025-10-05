import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useApiConfigStore } from './stores/apiConfig'
import { useDeviceStore } from './stores/device'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Инициализируем режим сервера после создания Pinia
const apiConfigStore = useApiConfigStore()
apiConfigStore.loadServerMode().then(() => {
  console.log(`🚀 Приложение запущено в режиме: ${apiConfigStore.currentServerConfig.name}`)
  console.log(`🔗 API URL: ${apiConfigStore.baseUrl}`)
})

// Инициализируем устройство (проверяем, работает ли в Android WebView)
const deviceStore = useDeviceStore()
deviceStore.initializeDevice().then((initialized) => {
  if (initialized) {
    console.log('✅ Устройство инициализировано')
  } else {
    console.log('⚠️ Работает в режиме браузера')
  }
})

app.mount('#app')
