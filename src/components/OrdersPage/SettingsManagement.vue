<template>
  <div class="settings-management">
    <div class="header">
      <h2>Настройки системы</h2>
      <div class="header-info">
        <span class="settings-info">Конфигурация терминала</span>
      </div>
    </div>

    <div class="settings-content">
      <div class="settings-grid">
        <!-- Кнопка Аккаунт -->
        <div class="settings-card">
          <div class="card-icon">👤</div>
          <div class="card-info">
            <h3>Аккаунт</h3>
            <p>Управление учетными записями и правами доступа</p>
          </div>
          <button class="settings-btn" @click="openAccountSettings">Настроить</button>
        </div>

        <!-- Кнопка API подключение -->
        <div class="settings-card">
          <div class="card-icon">🔌</div>
          <div class="card-info">
            <h3>API подключение</h3>
            <p>Настройка подключения к серверу и API endpoints</p>
          </div>
          <button class="settings-btn" @click="openApiSettings">Настроить</button>
        </div>

        <!-- Кнопка Изменить заставку -->
        <div class="settings-card">
          <div class="card-icon">🖼️</div>
          <div class="card-info">
            <h3>Изменить заставку</h3>
            <p>Загрузка и настройка стартового экрана</p>
          </div>
          <button class="settings-btn" @click="openSplashSettings">Настроить</button>
        </div>
      </div>
    </div>

    <!-- Popup для настроек аккаунта -->
    <div v-if="showAccountPopup" class="popup-overlay" @click="closeAccountPopup">
      <div class="settings-popup" @click.stop>
        <div class="popup-header">
          <h2>Настройки аккаунта</h2>
          <button class="close-btn" @click="closeAccountPopup">×</button>
        </div>

        <div class="popup-content">
          <div class="form-section">
            <h3>Администратор</h3>
            <div class="form-group">
              <label for="adminLogin">Логин администратора</label>
              <input
                id="adminLogin"
                v-model="accountSettings.adminLogin"
                type="text"
                class="form-input"
                placeholder="admin"
              />
            </div>
            <div class="form-group">
              <label for="adminPassword">Пароль администратора</label>
              <input
                id="adminPassword"
                v-model="accountSettings.adminPassword"
                type="password"
                class="form-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div class="form-section">
            <h3>Официант</h3>
            <div class="form-group">
              <label for="waiterCode">Код доступа официанта</label>
              <input
                id="waiterCode"
                v-model="accountSettings.waiterCode"
                type="text"
                class="form-input"
                placeholder="1234"
              />
            </div>
          </div>

          <div class="popup-actions">
            <button class="btn-cancel" @click="closeAccountPopup">Отмена</button>
            <button class="btn-save" @click="saveAccountSettings">Сохранить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Popup для настроек API -->
    <div v-if="showApiPopup" class="popup-overlay" @click="closeApiPopup">
      <div class="settings-popup" @click.stop>
        <div class="popup-header">
          <h2>Настройки API</h2>
          <button class="close-btn" @click="closeApiPopup">×</button>
        </div>

        <div class="popup-content">
          <div class="form-section">
            <h3>Основные настройки</h3>
            <div class="form-group">
              <label for="apiUrl">URL сервера</label>
              <input
                id="apiUrl"
                v-model="apiSettings.serverUrl"
                type="text"
                class="form-input"
                placeholder="http://83.222.9.90:8080"
              />
            </div>
            <div class="form-group">
              <label for="apiKey">API ключ</label>
              <input
                id="apiKey"
                v-model="apiSettings.apiKey"
                type="text"
                class="form-input"
                placeholder="your-api-key-here"
              />
            </div>
          </div>

          <div class="form-section">
            <h3>Таймауты и интервалы</h3>
            <div class="form-group">
              <label for="requestTimeout">Таймаут запросов (сек)</label>
              <input
                id="requestTimeout"
                v-model="apiSettings.requestTimeout"
                type="number"
                class="form-input"
                placeholder="30"
              />
            </div>
            <div class="form-group">
              <label for="syncInterval">Интервал синхронизации (сек)</label>
              <input
                id="syncInterval"
                v-model="apiSettings.syncInterval"
                type="number"
                class="form-input"
                placeholder="300"
              />
            </div>
          </div>

          <div class="connection-status">
            <div class="status-indicator" :class="{ online: isConnected }"></div>
            <span class="status-text">
              {{ isConnected ? 'Соединение установлено' : 'Нет соединения' }}
            </span>
            <button
              class="test-btn"
              @click="testConnection"
              :disabled="isTestingConnection"
              :class="{ testing: isTestingConnection }"
            >
              {{ isTestingConnection ? 'Проверяем...' : 'Проверить соединение' }}
            </button>
          </div>

          <div class="popup-actions">
            <button class="btn-cancel" @click="closeApiPopup">Отмена</button>
            <button class="btn-save" @click="saveApiSettings">Сохранить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Popup для настроек заставки -->
    <div v-if="showSplashPopup" class="popup-overlay" @click="closeSplashPopup">
      <div class="settings-popup" @click.stop>
        <div class="popup-header">
          <h2>Изменить заставку</h2>
          <button class="close-btn" @click="closeSplashPopup">×</button>
        </div>

        <div class="popup-content">
          <div class="form-section">
            <h3>Текущая заставка</h3>
            <div class="current-splash">
              <img
                :src="splashSettings.currentImage || placeholderImage"
                alt="Текущая заставка"
                class="splash-preview"
              />
            </div>
          </div>

          <div class="form-section">
            <h3>Загрузить новую заставку</h3>
            <div class="upload-area" @click="triggerFileUpload">
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                style="display: none"
              />
              <div class="upload-icon">📁</div>
              <div class="upload-text">
                <p>Нажмите для выбора изображения</p>
                <span>Поддерживаются форматы: JPG, PNG, GIF</span>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Настройки отображения</h3>
            <div class="form-group">
              <label for="splashDuration">Время показа заставки (сек)</label>
              <input
                id="splashDuration"
                v-model="splashSettings.duration"
                type="number"
                class="form-input"
                placeholder="3"
                min="1"
                max="10"
              />
            </div>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="splashSettings.showOnStartup" />
                <span class="checkbox-custom"></span>
                Показывать при запуске приложения
              </label>
            </div>
          </div>

          <div class="popup-actions">
            <button class="btn-cancel" @click="closeSplashPopup">Отмена</button>
            <button class="btn-save" @click="saveSplashSettings">Сохранить</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSplashSettings } from '@/hooks'
import { useSettingsStore } from '@/stores'
import placeholderImageSrc from '@/assets/mainBackground.png'

const emit = defineEmits(['save-settings'])

// Хук для управления настройками заставки
const {
  splashSettings: savedSplashSettings,
  updateSplashImage,
  updateDuration,
  updateShowOnStartup,
} = useSplashSettings()

// Settings store для прямого доступа к функциям
const settingsStore = useSettingsStore()

// Состояния попапов
const showAccountPopup = ref(false)
const showApiPopup = ref(false)
const showSplashPopup = ref(false)

// Состояние подключения
const isConnected = ref(false)
const isTestingConnection = ref(false)

// Ссылка на input файла
const fileInput = ref(null)

// Placeholder для изображения - используем стандартное изображение заставки
const placeholderImage = placeholderImageSrc

// Настройки аккаунта
const accountSettings = ref({
  adminLogin: 'admin',
  adminPassword: '',
  waiterCode: '1234',
})

// Настройки API
const apiSettings = ref({
  serverUrl: 'http://83.222.9.90:8080',
  apiKey: '',
  requestTimeout: 30,
  syncInterval: 300,
})

// Настройки заставки
const splashSettings = ref({
  currentImage: '',
  duration: 3,
  showOnStartup: true,
})

// Функции для открытия попапов
const openAccountSettings = () => {
  showAccountPopup.value = true
}

const openApiSettings = () => {
  showApiPopup.value = true
}

const openSplashSettings = () => {
  // Загружаем текущие сохраненные настройки при открытии попапа
  const currentSettings = savedSplashSettings.value || {
    currentImage: '',
    duration: 3,
    showOnStartup: true,
  }

  splashSettings.value = {
    currentImage: currentSettings.currentImage,
    duration: currentSettings.duration,
    showOnStartup: currentSettings.showOnStartup,
  }
  showSplashPopup.value = true
}

// Функции для закрытия попапов
const closeAccountPopup = () => {
  showAccountPopup.value = false
}

const closeApiPopup = () => {
  showApiPopup.value = false
}

const closeSplashPopup = () => {
  showSplashPopup.value = false
}

// Функции сохранения настроек
const saveAccountSettings = () => {
  console.log('Сохранение настроек аккаунта:', accountSettings.value)
  // Здесь будет API вызов для сохранения настроек аккаунта
  emit('save-settings', { type: 'account', data: accountSettings.value })
  closeAccountPopup()
}

const saveApiSettings = () => {
  console.log('Сохранение настроек API:', apiSettings.value)
  // Здесь будет API вызов для сохранения настроек API
  emit('save-settings', { type: 'api', data: apiSettings.value })
  closeApiPopup()
}

const saveSplashSettings = () => {
  console.log('Сохранение настроек заставки:', splashSettings.value)

  // Сохраняем настройки через store
  if (splashSettings.value.currentImage) {
    // Используем новую функцию для base64 строки
    settingsStore.updateSplashImageBase64(splashSettings.value.currentImage)
  }
  settingsStore.updateSplashDuration(splashSettings.value.duration)
  settingsStore.updateShowOnStartup(splashSettings.value.showOnStartup)

  // Также эмитим событие для родительского компонента
  emit('save-settings', { type: 'splash', data: splashSettings.value })

  alert(
    'Настройки заставки сохранены! Изменения будут видны при следующем переходе на стартовую страницу.',
  )
  closeSplashPopup()
}

// Функция тестирования соединения
const testConnection = async () => {
  try {
    console.log('Тестирование соединения с:', apiSettings.value.serverUrl)

    if (!apiSettings.value.serverUrl) {
      throw new Error('URL сервера не указан')
    }

    // Показываем состояние загрузки
    isTestingConnection.value = true

    // Реальная проверка соединения
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), apiSettings.value.requestTimeout * 1000)

    const response = await fetch('/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiSettings.value.apiKey && { Authorization: `Bearer ${apiSettings.value.apiKey}` }),
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      isConnected.value = true
      console.log('Соединение установлено успешно')

      // Попробуем также проверить основные эндпоинты
      const endpoints = ['/categories', '/menu']
      const endpointChecks = await Promise.allSettled(
        endpoints.map((endpoint) =>
          fetch(`${apiSettings.value.serverUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(apiSettings.value.apiKey && {
                Authorization: `Bearer ${apiSettings.value.apiKey}`,
              }),
            },
            signal: AbortSignal.timeout(5000), // 5 секунд таймаут для каждого эндпоинта
          }),
        ),
      )

      const workingEndpoints = endpointChecks.filter(
        (result) => result.status === 'fulfilled' && result.value.ok,
      ).length

      console.log(`Работает ${workingEndpoints} из ${endpoints.length} эндпоинтов`)

      // Показываем успешное уведомление
      alert(
        `Соединение установлено! Работает ${workingEndpoints} из ${endpoints.length} эндпоинтов API`,
      )
    } else {
      throw new Error(`Сервер вернул ошибку: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('Ошибка при проверке соединения:', error)
    isConnected.value = false

    // Показываем конкретную ошибку пользователю
    let errorMessage = 'Не удалось подключиться к серверу'
    if (error.name === 'AbortError') {
      errorMessage = 'Превышено время ожидания соединения'
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Сервер недоступен или неверный URL'
    } else if (error.message) {
      errorMessage = error.message
    }

    alert(`Ошибка подключения: ${errorMessage}`)
  } finally {
    // Убираем состояние загрузки
    isTestingConnection.value = false
  }
}

// Функции для работы с файлами
const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      splashSettings.value.currentImage = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Инициализация
onMounted(() => {
  console.log('SettingsManagement mounted')
  // Здесь можно загрузить сохраненные настройки
})
</script>

<style scoped>
.settings-management {
  height: 100%;
  overflow-y: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.settings-info {
  font-size: 14px;
  color: #6b7280;
  padding: 6px 12px;
  background: #f3f4f6;
  border-radius: 20px;
}

.settings-content {
  padding: 30px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 25px;
  width: 100%;
  margin: 0 auto;
  padding-bottom: 40px;
}

.settings-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  border: 2px solid #f0f0f0;
}

.settings-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 20px;
}

.card-info {
  text-align: center;
  margin-bottom: 25px;
}

.card-info h3 {
  font-size: 22px;
  color: #1f2937;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.card-info p {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.settings-btn {
  width: 100%;
  padding: 14px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.settings-btn:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-popup {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.popup-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.popup-content {
  padding: 25px;
}

.form-section {
  margin-bottom: 30px;
}

.form-section h3 {
  font-size: 18px;
  color: #1f2937;
  margin: 0 0 15px 0;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #374151;
  margin-bottom: 6px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 20px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dc2626;
}

.status-indicator.online {
  background: #16a34a;
}

.status-text {
  font-size: 14px;
  color: #374151;
  flex: 1;
}

.test-btn {
  padding: 6px 12px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.test-btn:hover {
  background: #e5e7eb;
}

.test-btn:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.test-btn.testing {
  background: #3b82f6;
  color: white;
  position: relative;
}

.test-btn.testing::after {
  content: '';
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

@keyframes spin {
  0% {
    transform: translateY(-50%) rotate(0deg);
  }
  100% {
    transform: translateY(-50%) rotate(360deg);
  }
}

.current-splash {
  text-align: center;
  margin-bottom: 20px;
}

.splash-preview {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  object-fit: cover;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-area:hover {
  border-color: #3b82f6;
}

.upload-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.upload-text p {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #374151;
}

.upload-text span {
  font-size: 14px;
  color: #6b7280;
}

.checkbox-group {
  margin-top: 15px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
  color: #374151;
}

.checkbox-label input[type='checkbox'] {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox-label input[type='checkbox']:checked + .checkbox-custom {
  background: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-label input[type='checkbox']:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.popup-actions {
  display: flex;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-save {
  background: #16a34a;
  color: white;
}

.btn-save:hover {
  background: #15803d;
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .settings-popup {
    width: 95%;
    margin: 10px;
  }

  .popup-actions {
    flex-direction: column;
  }
}
</style>
