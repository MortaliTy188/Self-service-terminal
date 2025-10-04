import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useApiConfigStore } from './stores/apiConfig'

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

app.mount('#app')
