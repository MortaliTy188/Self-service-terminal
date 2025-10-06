<template>
  <div class="settings-management">
    <div class="header">
      <h2>Настройки системы</h2>
      <div class="header-info">
        <span class="settings-info">Конфигурация терминала</span>
      </div>
    </div>

    <div class="settings-content">
      <!-- Селектор режима сервера -->
      <ServerModeSelector />

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

        <!-- Кнопка Синхронизация меню -->
        <div class="settings-card">
          <div class="card-icon">🍽️</div>
          <div class="card-info">
            <h3>Синхронизация меню</h3>
            <p>Ручная синхронизация меню с iiko</p>
          </div>
          <button class="settings-btn sync-btn" @click="syncMenu" :disabled="isSyncingMenu">
            {{ isSyncingMenu ? 'Синхронизация...' : 'Синхронизировать' }}
          </button>
        </div>

        <!-- Кнопка Синхронизация столов -->
        <div class="settings-card">
          <div class="card-icon">🪑</div>
          <div class="card-info">
            <h3>Синхронизация столов</h3>
            <p>Синхронизировать столы с iiko</p>
          </div>
          <button class="settings-btn sync-btn" @click="syncTables" :disabled="isSyncingTables">
            {{ isSyncingTables ? 'Синхронизация...' : 'Синхронизировать' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Popup для настроек аккаунта -->
    <div v-if="showAccountPopup" class="popup-overlay">
      <div class="settings-popup" @click.stop>
        <div class="popup-header">
          <h2>Настройки аккаунта</h2>
          <button class="close-btn" @click="closeAccountPopup">×</button>
        </div>

        <div class="popup-content">
          <!-- Секция смены пароля -->
          <div class="form-section">
            <h3>Смена пароля</h3>

            <div class="form-group">
              <label for="oldPassword">Текущий пароль</label>
              <div class="password-input-group">
                <input
                  id="oldPassword"
                  v-model="passwordChange.oldPassword"
                  :type="passwordChange.showOldPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="Введите текущий пароль"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="passwordChange.showOldPassword = !passwordChange.showOldPassword"
                >
                  {{ passwordChange.showOldPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="newPassword">Новый пароль</label>
              <div class="password-input-group">
                <input
                  id="newPassword"
                  v-model="passwordChange.newPassword"
                  :type="passwordChange.showNewPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="Введите новый пароль"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="passwordChange.showNewPassword = !passwordChange.showNewPassword"
                >
                  {{ passwordChange.showNewPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Подтвердите новый пароль</label>
              <div class="password-input-group">
                <input
                  id="confirmPassword"
                  v-model="passwordChange.confirmPassword"
                  :type="passwordChange.showConfirmPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="Повторите новый пароль"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="passwordChange.showConfirmPassword = !passwordChange.showConfirmPassword"
                >
                  {{ passwordChange.showConfirmPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="password-actions">
              <button
                class="btn-change-password"
                @click="handleChangePassword"
                :disabled="passwordChange.isChanging || !canChangePassword"
              >
                {{ passwordChange.isChanging ? 'Изменение...' : 'Сменить пароль' }}
              </button>
            </div>

            <div v-if="passwordChange.error" class="error-message">
              {{ passwordChange.error }}
            </div>
            <div v-if="passwordChange.success" class="success-message">Пароль успешно изменён!</div>
          </div>

          <div class="popup-actions">
            <button class="btn-cancel" @click="closeAccountPopup">Отмена</button>
            <button class="btn-save" @click="saveAccountSettings">Сохранить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Popup для настроек API -->
    <div v-if="showApiPopup" class="popup-overlay">
      <div class="settings-popup" @click.stop>
        <div class="popup-header">
          <h2>Настройки API</h2>
          <button class="close-btn" @click="closeApiPopup">×</button>
        </div>

        <div class="popup-content">
          <div class="form-section">
            <h3>Основные настройки iiko API</h3>
            <div class="form-group">
              <label for="apiLogin">API Login</label>
              <input
                id="apiLogin"
                v-model="apiConfig.api_login"
                type="text"
                class="form-input"
                placeholder="XXXXXXX—XXXXXX—XXXXX"
              />
            </div>
            <div class="form-group">
              <label for="organizationId">Organization ID</label>
              <input
                id="organizationId"
                v-model="apiConfig.organization_id"
                type="text"
                class="form-input"
                placeholder="XXXXXXX—XXXXXX—XXXXX"
              />
            </div>
          </div>

          <div class="form-section">
            <h3>Терминал и платежи</h3>
            <div class="form-group">
              <label for="terminalGroupId">Terminal Group ID</label>
              <input
                id="terminalGroupId"
                v-model="apiConfig.terminal_group_id"
                type="text"
                class="form-input"
                placeholder="XXXXXXX—XXXXXX—XXXXX"
              />
            </div>
            <div class="form-group">
              <label for="paymentTypeId">Payment Type ID</label>
              <input
                id="paymentTypeId"
                v-model="apiConfig.payment_type_id"
                type="text"
                class="form-input"
                placeholder="XXXXXXX—XXXXXX—XXXXX"
              />
            </div>
          </div>

          <div class="connection-status">
            <div
              class="status-indicator"
              :class="{
                online: !apiConfigStore.error && apiConfigStore.isFullyConfigured,
                error: apiConfigStore.error,
                warning: !apiConfigStore.isFullyConfigured,
              }"
            ></div>
            <span class="status-text">
              <template v-if="apiConfigStore.error"> Ошибка: {{ apiConfigStore.error }} </template>
              <template v-else-if="!apiConfigStore.isFullyConfigured">
                Конфигурация не завершена
              </template>
              <template v-else> Конфигурация настроена </template>
            </span>
            <button
              class="test-btn"
              @click="testApiConnection"
              :disabled="apiConfigStore.isLoading"
              :class="{ testing: apiConfigStore.isLoading }"
            >
              {{ apiConfigStore.isLoading ? 'Проверяем...' : 'Проверить соединение' }}
            </button>
          </div>

          <div class="popup-actions">
            <button class="btn-cancel" @click="closeApiPopup">Отмена</button>
            <button
              class="btn-save"
              @click="saveApiConfiguration"
              :disabled="apiConfigStore.isLoading"
            >
              {{ apiConfigStore.isLoading ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Popup для настроек заставки -->
    <div v-if="showSplashPopup" class="popup-overlay">
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
import { ref, onMounted, computed } from 'vue'
import { useSplashSettings } from '@/hooks'
import { useSettingsStore, useApiConfigStore, useAuthStore } from '@/stores'
import placeholderImageSrc from '@/assets/mainBackground.png'
import ServerModeSelector from './ServerModeSelector.vue'

const emit = defineEmits(['save-settings'])

// Stores
const settingsStore = useSettingsStore()
const apiConfigStore = useApiConfigStore()
const authStore = useAuthStore()

// Хук для управления настройками заставки
const {
  splashSettings: savedSplashSettings,
  updateSplashImage,
  updateDuration,
  updateShowOnStartup,
} = useSplashSettings()

// Состояния попапов
const showAccountPopup = ref(false)
const showApiPopup = ref(false)
const showSplashPopup = ref(false)

// Состояния синхронизации
const isSyncingMenu = ref(false)
const isSyncingTables = ref(false)

// Ссылка на input файла
const fileInput = ref(null)

// Placeholder для изображения
const placeholderImage = placeholderImageSrc

// Настройки аккаунта
const accountSettings = ref({
  adminLogin: 'admin',
  adminPassword: '',
  waiterCode: '1234',
})

// Состояние для показа пароля администратора
const showAdminPassword = ref(false)

// Состояние для смены пароля
const passwordChange = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  showOldPassword: false,
  showNewPassword: false,
  showConfirmPassword: false,
  isChanging: false,
  error: '',
  success: false,
})

// Локальная копия API конфигурации для редактирования
const apiConfig = ref({
  api_login: '',
  organization_id: '',
  terminal_group_id: '',
  payment_type_id: '',
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

const openApiSettings = async () => {
  // Загружаем текущую конфигурацию при открытии
  await apiConfigStore.fetchConfig()
  apiConfig.value = { ...apiConfigStore.config }
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

// Computed для проверки возможности смены пароля
const canChangePassword = computed(() => {
  return (
    passwordChange.value.oldPassword.length >= 3 &&
    passwordChange.value.newPassword.length >= 3 &&
    passwordChange.value.newPassword === passwordChange.value.confirmPassword
  )
})

// Функции для закрытия попапов
const closeAccountPopup = () => {
  showAccountPopup.value = false
  // Сбрасываем состояние смены пароля при закрытии
  resetPasswordChangeForm()
}

const resetPasswordChangeForm = () => {
  passwordChange.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    showOldPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    isChanging: false,
    error: '',
    success: false,
  }
  // Также сбрасываем показ пароля администратора
  showAdminPassword.value = false
}

const closeApiPopup = () => {
  showApiPopup.value = false
  apiConfigStore.clearError()
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

// Функция смены пароля
const handleChangePassword = async () => {
  passwordChange.value.error = ''
  passwordChange.value.success = false

  // Валидация
  if (passwordChange.value.newPassword !== passwordChange.value.confirmPassword) {
    passwordChange.value.error = 'Пароли не совпадают'
    return
  }

  if (passwordChange.value.newPassword.length < 3) {
    passwordChange.value.error = 'Новый пароль должен содержать минимум 3 символа'
    return
  }

  passwordChange.value.isChanging = true

  try {
    const result = await authStore.changePassword(
      passwordChange.value.oldPassword,
      passwordChange.value.newPassword,
    )

    if (result.success) {
      passwordChange.value.success = true
      passwordChange.value.error = ''
      // Очищаем поля после успешной смены
      setTimeout(() => {
        resetPasswordChangeForm()
      }, 2000)
    } else {
      passwordChange.value.error = result.error || 'Ошибка смены пароля'
    }
  } catch (error) {
    passwordChange.value.error = 'Произошла ошибка при смене пароля'
    console.error('Ошибка смены пароля:', error)
  } finally {
    passwordChange.value.isChanging = false
  }
}

const saveApiConfiguration = async () => {
  try {
    const result = await apiConfigStore.saveExtendedConfig(apiConfig.value)

    if (result.success) {
      alert(result.message || 'Конфигурация API успешно сохранена!')
      closeApiPopup()
      emit('save-settings', { type: 'api', data: result.data })
    } else {
      alert(`Ошибка сохранения: ${result.error}`)
    }
  } catch (error) {
    console.error('Ошибка сохранения API конфигурации:', error)
    alert('Произошла ошибка при сохранении конфигурации')
  }
}

const testApiConnection = async () => {
  try {
    const result = await apiConfigStore.testConnection()

    if (result.success) {
      alert('Соединение с API успешно установлено!')
    } else {
      alert(`Ошибка подключения: ${result.error}`)
    }
  } catch (error) {
    console.error('Ошибка тестирования соединения:', error)
    alert('Произошла ошибка при тестировании подключения')
  }
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

// Функции синхронизации
const syncMenu = async () => {
  isSyncingMenu.value = true
  try {
    console.log('Запуск синхронизации меню с iiko...')
    const response = await fetch(apiConfigStore.getSecureUrl('/sync/nomenclature'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('Синхронизация меню завершена:', result)

    if (result.success) {
      alert(`Синхронизация меню успешно завершена!\n${result.message || 'Меню обновлено'}`)
    } else {
      alert(`Ошибка синхронизации: ${result.message || 'Неизвестная ошибка'}`)
    }
  } catch (error) {
    console.error('Ошибка синхронизации меню:', error)
    alert(`Ошибка синхронизации меню: ${error.message}`)
  } finally {
    isSyncingMenu.value = false
  }
}

const syncTables = async () => {
  isSyncingTables.value = true
  try {
    console.log('Запуск синхронизации столов с iiko...')
    const response = await fetch(apiConfigStore.getSecureUrl('/tables/sync'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('Синхронизация столов завершена:', result)

    alert(
      `Синхронизация столов завершена!\n${result.message || 'Столы обновлены'}\nСинхронизировано: ${result.synced_count || 0} столов`,
    )
  } catch (error) {
    console.error('Ошибка синхронизации столов:', error)
    alert(`Ошибка синхронизации столов: ${error.message}`)
  } finally {
    isSyncingTables.value = false
  }
}

// Инициализация
onMounted(async () => {
  console.log('SettingsManagement mounted')
  // Загружаем текущую API конфигурацию
  await apiConfigStore.fetchConfig()
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

.sync-btn {
  background: #16a34a;
}

.sync-btn:hover:not(:disabled) {
  background: #15803d;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
}

.sync-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
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
  transition: background 0.2s;
}

.status-indicator.online {
  background: #16a34a;
}

.status-indicator.warning {
  background: #f59e0b;
}

.status-indicator.error {
  background: #dc2626;
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

.test-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.test-btn:disabled {
  background: #f9fafb;
  cursor: not-allowed;
  opacity: 0.6;
}

.test-btn.testing {
  background: #dbeafe;
  color: #1d4ed8;
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

.btn-save:hover:not(:disabled) {
  background: #15803d;
}

.btn-save:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Стили для смены пароля */
.password-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.password-input-group .form-input {
  flex: 1;
}

.password-toggle {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  min-width: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.password-actions {
  margin-top: 15px;
}

.btn-change-password {
  width: 100%;
  padding: 12px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-change-password:hover:not(:disabled) {
  background: #2563eb;
}

.btn-change-password:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.error-message {
  margin-top: 10px;
  padding: 10px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 14px;
}

.success-message {
  margin-top: 10px;
  padding: 10px;
  background: #d1fae5;
  color: #065f46;
  border-radius: 6px;
  font-size: 14px;
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
