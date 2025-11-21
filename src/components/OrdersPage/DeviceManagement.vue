<template>
  <div class="device-management">
    <div class="header">
      <h2>Управление устройствами</h2>
      <div class="header-actions">
        <button class="btn-refresh" @click="loadDevices" :disabled="deviceStore.devicesLoading">
          🔄 Обновить список
        </button>
        <button class="btn-qr" @click="showQrModal = true">🔲 Сгенерировать QR</button>
        <button class="btn-add" @click="showRegisterModal = true">
          ➕ Зарегистрировать планшет
        </button>
      </div>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="deviceStore.devicesLoading" class="loading-spinner">
      <div class="spinner"></div>
      <p>Загружаем список устройств...</p>
    </div>

    <!-- Сообщение об ошибке -->
    <div v-else-if="deviceStore.devicesError" class="error-message">
      <p>❌ Ошибка загрузки: {{ deviceStore.devicesError }}</p>
      <button class="btn-retry" @click="loadDevices">Повторить</button>
    </div>

    <!-- Список устройств -->
    <div v-else-if="devices.length > 0" class="devices-grid">
      <div v-for="device in devices" :key="device.android_id" class="device-card">
        <div class="device-header">
          <div class="device-icon">📱</div>
          <div class="device-info">
            <h3>{{ device.model || 'Unknown Device' }}</h3>
            <p class="android-id">{{ device.android_id }}</p>
          </div>
          <div :class="['status-badge', getDeviceStatus(device)]">
            {{ getStatusText(getDeviceStatus(device)) }}
          </div>
        </div>

        <div class="device-details">
          <div class="detail-row">
            <span class="label">Номер стола:</span>
            <span class="value">
              <span v-if="device.short_id" class="table-number">{{ device.short_id }}</span>
              <span v-else class="not-assigned">Не назначен</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="label">OS версия:</span>
            <span class="value">{{ device.os_version || 'N/A' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">App версия:</span>
            <span class="value">{{ device.app_version || 'N/A' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Батарея:</span>
            <span class="value">
              <span :class="['battery', getBatteryClass(device.battery)]">
                🔋 {{ device.battery || 0 }}%
              </span>
            </span>
          </div>
          <div class="detail-row">
            <span class="label">Последняя активность:</span>
            <span class="value">{{ formatDate(device.last_seen || device.last_activity) }}</span>
          </div>
        </div>

        <div class="device-actions">
          <button class="btn-assign" @click="openAssignModal(device)">
            {{ device.short_id ? '✏️ Изменить стол' : '📍 Назначить стол' }}
          </button>
          <button class="btn-control" @click="openControlModal(device)">⚙️ Управление</button>
          <button class="btn-delete" @click="confirmDeleteDevice(device)">🗑️ Удалить</button>
        </div>
      </div>
    </div>

    <!-- Пустой список -->
    <div v-else class="empty-state">
      <div class="empty-icon">📱</div>
      <h3>Планшеты не найдены</h3>
      <p>Начните с регистрации первого планшета</p>
      <button class="btn-add-large" @click="showRegisterModal = true">
        ➕ Зарегистрировать планшет
      </button>
    </div>

    <!-- Модальное окно регистрации устройства -->
    <div v-if="showRegisterModal" class="modal-overlay" @click="closeRegisterModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Регистрация нового планшета</h3>
          <button class="close-btn" @click="closeRegisterModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="androidId">Android ID *</label>
            <input
              id="androidId"
              v-model="newDevice.android_id"
              type="text"
              class="form-input"
              placeholder="test_android_id_001"
              required
            />
          </div>

          <div class="form-group">
            <label for="model">Модель устройства *</label>
            <input
              id="model"
              v-model="newDevice.model"
              type="text"
              class="form-input"
              placeholder="Samsung Galaxy Tab A7"
              required
            />
          </div>

          <div class="form-group">
            <label for="osVersion">Версия ОС</label>
            <input
              id="osVersion"
              v-model="newDevice.os_version"
              type="text"
              class="form-input"
              placeholder="13.0"
            />
          </div>

          <div class="form-group">
            <label for="appVersion">Версия приложения</label>
            <input
              id="appVersion"
              v-model="newDevice.app_version"
              type="text"
              class="form-input"
              placeholder="1.0.0"
            />
          </div>

          <div v-if="registerError" class="error-message">{{ registerError }}</div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeRegisterModal">Отмена</button>
          <button
            class="btn-register"
            @click="registerNewDevice"
            :disabled="!newDevice.android_id || !newDevice.model || isRegistering"
          >
            {{ isRegistering ? 'Регистрация...' : 'Зарегистрировать' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно назначения стола -->
    <div v-if="showAssignModal" class="modal-overlay" @click="closeAssignModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedDevice?.short_id ? 'Изменить номер стола' : 'Назначить номер стола' }}</h3>
          <button class="close-btn" @click="closeAssignModal">✕</button>
        </div>

        <div class="modal-body">
          <p class="device-name">{{ selectedDevice?.model }}</p>
          <p class="android-id-small">{{ selectedDevice?.android_id }}</p>

          <div class="form-group">
            <label for="shortId">Номер стола (Short ID) *</label>
            <input
              id="shortId"
              v-model="assignShortId"
              type="text"
              class="form-input"
              :placeholder="selectedDevice?.short_id ? `Текущий: ${selectedDevice.short_id}` : '1'"
              required
            />
            <small>{{
              selectedDevice?.short_id
                ? 'Введите новый номер стола'
                : 'Короткий идентификатор стола для планшета'
            }}</small>
          </div>

          <div v-if="assignError" class="error-message">{{ assignError }}</div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeAssignModal">Отмена</button>
          <button
            class="btn-assign-confirm"
            @click="confirmAssignShortId"
            :disabled="!assignShortId || isAssigning"
          >
            {{
              isAssigning
                ? selectedDevice?.short_id
                  ? 'Изменение...'
                  : 'Назначение...'
                : selectedDevice?.short_id
                  ? 'Изменить'
                  : 'Назначить'
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно генерации QR кода -->
    <div v-if="showQrModal" class="modal-overlay" @click="closeQrModal">
      <div class="modal-content qr-modal" @click.stop>
        <div class="modal-header">
          <h3>🔲 Генерация QR кода для настройки Android</h3>
          <button class="close-btn" @click="closeQrModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="qr-info">
            <p class="info-text">
              <strong>ℹ️ Важная информация:</strong>
            </p>
            <ul class="info-list">
              <li>✅ Приложение получит права Device Owner (владелец устройства)</li>
              <li>
                ⚠️ Работает только на новых устройствах или после Factory Reset (до первой
                настройки)
              </li>
              <li>
                📱 QR код автоматически настроит WiFi, установит приложение и подключит к серверу
              </li>
            </ul>
          </div>

          <div class="form-group">
            <label for="wifiSsid">WiFi SSID (необязательно)</label>
            <input
              id="wifiSsid"
              v-model="qrConfig.wifi_ssid"
              type="text"
              class="form-input"
              placeholder="Restaurant_WiFi"
            />
            <small>Если не указан, используются настройки из БД</small>
          </div>

          <div class="form-group">
            <label for="wifiPassword">WiFi пароль (необязательно)</label>
            <input
              id="wifiPassword"
              v-model="qrConfig.wifi_password"
              type="text"
              class="form-input"
              placeholder="SecurePass123"
            />
          </div>

          <div class="form-group">
            <label for="wifiSecurity">Тип безопасности WiFi</label>
            <select id="wifiSecurity" v-model="qrConfig.wifi_security" class="form-input">
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="NONE">Без пароля</option>
            </select>
          </div>

          <!-- QR код результат -->
          <div v-if="generatedQr" class="qr-result">
            <h4>✅ QR код успешно сгенерирован!</h4>
            <div class="qr-image-container">
              <img :src="generatedQr.qr_base64" alt="QR код для настройки устройства" />
            </div>
            <p class="qr-instruction">Отсканируйте этот QR код на новом Android устройстве</p>
            <button class="btn-download" @click="downloadQr">💾 Скачать QR код</button>
          </div>

          <div v-if="qrError" class="error-message">{{ qrError }}</div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeQrModal">Закрыть</button>
          <button
            v-if="!generatedQr"
            class="btn-generate"
            @click="generateQrCode"
            :disabled="isGeneratingQr"
          >
            {{ isGeneratingQr ? 'Генерация...' : '🔲 Сгенерировать QR' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно управления устройством -->
    <div v-if="showControlModal" class="modal-overlay" @click="closeControlModal">
      <div class="modal-content control-modal" @click.stop>
        <div class="modal-header">
          <h3>⚙️ Управление устройством</h3>
          <button class="close-btn" @click="closeControlModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="control-device-info">
            <p class="device-name">{{ selectedDevice?.model || 'Unknown Device' }}</p>
            <p class="android-id-small">{{ selectedDevice?.android_id }}</p>
          </div>

          <!-- Блок команд блокировки -->
          <div class="control-section">
            <h4>🔒 Режим киоска</h4>
            <div class="control-buttons">
              <button
                class="btn-control-action btn-lock"
                @click="sendCommand('lock')"
                :disabled="isExecutingCommand"
              >
                🔒 Заблокировать
              </button>
              <button
                class="btn-control-action btn-unlock"
                @click="sendCommand('unlock')"
                :disabled="isExecutingCommand"
              >
                🔓 Разблокировать
              </button>
            </div>
            <p class="control-hint">Включение/выключение режима киоска на устройстве</p>
          </div>

          <!-- Блок системных команд -->
          <div class="control-section">
            <h4>🔄 Системные команды</h4>
            <div class="control-buttons">
              <button
                class="btn-control-action btn-reboot"
                @click="sendCommand('reboot')"
                :disabled="isExecutingCommand"
              >
                🔄 Перезагрузить
              </button>
              <button
                class="btn-control-action btn-shutdown"
                @click="sendCommand('shutdown')"
                :disabled="isExecutingCommand"
              >
                ⚡ Выключить
              </button>
            </div>
            <p class="control-hint">Перезагрузка или выключение устройства</p>
          </div>

          <!-- Блок обновления -->
          <div class="control-section">
            <h4>📦 Обновление приложения</h4>
            <div class="form-group">
              <label for="apkUrl">URL APK файла</label>
              <input
                id="apkUrl"
                v-model="updateConfig.apk_url"
                type="text"
                class="form-input"
                placeholder="http://example.com/app.apk"
              />
            </div>
            <div class="form-group">
              <label for="checksum">Checksum (необязательно)</label>
              <input
                id="checksum"
                v-model="updateConfig.checksum"
                type="text"
                class="form-input"
                placeholder="SHA256 checksum"
              />
            </div>
            <button
              class="btn-control-action btn-update"
              @click="sendUpdateCommand"
              :disabled="!updateConfig.apk_url || isExecutingCommand"
            >
              📦 Обновить приложение
            </button>
            <p class="control-hint">Установка новой версии APK на устройство</p>
          </div>

          <!-- История команд -->
          <div class="control-section">
            <h4>📋 История команд</h4>
            <button
              class="btn-control-action btn-history"
              @click="loadCommandHistory"
              :disabled="isLoadingHistory"
            >
              {{ isLoadingHistory ? 'Загрузка...' : '📋 Показать историю' }}
            </button>

            <div v-if="commandHistory.length > 0" class="command-history">
              <div v-for="cmd in commandHistory" :key="cmd.id" class="history-item">
                <div class="history-header">
                  <span class="history-command"
                    >{{ getCommandIcon(cmd.command) }} {{ cmd.command }}</span
                  >
                  <span :class="['history-status', cmd.executed ? 'executed' : 'pending']">
                    {{ cmd.executed ? '✅ Выполнено' : '⏳ Ожидание' }}
                  </span>
                </div>
                <div class="history-meta">
                  <span class="history-date">{{ formatDate(cmd.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="controlError" class="error-message">{{ controlError }}</div>
          <div v-if="controlSuccess" class="success-message">{{ controlSuccess }}</div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeControlModal">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDeviceStore } from '@/stores/device'

const deviceStore = useDeviceStore()

// State
const showRegisterModal = ref(false)
const showAssignModal = ref(false)
const showQrModal = ref(false)
const showControlModal = ref(false)
const isRegistering = ref(false)
const isAssigning = ref(false)
const isGeneratingQr = ref(false)
const isExecutingCommand = ref(false)
const isLoadingHistory = ref(false)
const registerError = ref('')
const assignError = ref('')
const qrError = ref('')
const controlError = ref('')
const controlSuccess = ref('')
const selectedDevice = ref(null)
const assignShortId = ref('')
const generatedQr = ref(null)
const commandHistory = ref([])

const updateConfig = ref({
  apk_url: '',
  checksum: '',
})

const qrConfig = ref({
  wifi_ssid: '',
  wifi_password: '',
  wifi_security: 'WPA',
})

const newDevice = ref({
  android_id: '',
  model: '',
  os_version: '',
  app_version: '1.0.0',
})

// Используем allDevices из store напрямую для реактивности
const devices = computed(() => deviceStore.allDevices)

// Methods
const loadDevices = async () => {
  console.log('📱 Загружаем список устройств...')

  try {
    const result = await deviceStore.getAllDevices(true) // Принудительное обновление

    if (result.success) {
      console.log('✅ Устройства загружены:', deviceStore.allDevices)
    } else {
      console.error('❌ Ошибка загрузки устройств:', result.error)
      // Показываем уведомление об ошибке
      alert(`Ошибка загрузки устройств: ${result.error}`)
    }
  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
    alert(`Критическая ошибка: ${error.message}`)
  }
}

const loadDeviceInfo = async (android_id) => {
  console.log('🔄 Обновляем информацию об устройстве:', android_id)

  try {
    const result = await deviceStore.getDeviceInfo(android_id)
    if (result.success) {
      // Устройство автоматически обновится в store через updateDeviceInList
      console.log('✅ Информация об устройстве обновлена')
    } else {
      console.error('❌ Ошибка обновления устройства:', result.error)
      alert(`Ошибка обновления: ${result.error}`)
    }
  } catch (error) {
    console.error('❌ Критическая ошибка обновления:', error)
    alert(`Критическая ошибка: ${error.message}`)
  }
}

const confirmDeleteDevice = (device) => {
  const deviceName = device.model || device.android_id
  const tableInfo = device.short_id ? ` (Стол ${device.short_id})` : ''

  if (
    confirm(
      `Вы уверены, что хотите удалить устройство "${deviceName}"${tableInfo}?\n\nЭто действие нельзя отменить!`,
    )
  ) {
    deleteDevice(device.android_id)
  }
}

const deleteDevice = async (android_id) => {
  try {
    console.log('🗑️ Удаляем устройство:', android_id)

    const result = await deviceStore.deleteDevice(android_id)

    if (result.success) {
      console.log('✅ Устройство удалено')
      alert('Устройство успешно удалено!')

      // Перезагружаем список устройств
      await loadDevices()
    } else {
      console.error('❌ Ошибка удаления устройства:', result.error)
      alert(`Ошибка удаления: ${result.error}`)
    }
  } catch (error) {
    console.error('❌ Критическая ошибка удаления:', error)
    alert(`Критическая ошибка: ${error.message}`)
  }
}

const registerNewDevice = async () => {
  registerError.value = ''
  isRegistering.value = true

  try {
    console.log('📱 Регистрируем устройство:', newDevice.value)
    const result = await deviceStore.registerDevice(newDevice.value)

    if (result.success) {
      console.log('✅ Устройство зарегистрировано, перезагружаем список...')

      // Перезагружаем весь список устройств
      await loadDevices()

      closeRegisterModal()

      // Показываем уведомление
      alert(
        `Устройство успешно зарегистрировано!\nDevice Token: ${result.data.device_token || result.data.token}`,
      )
    } else {
      registerError.value = result.error || 'Ошибка регистрации устройства'
    }
  } catch (err) {
    registerError.value = err.message
  } finally {
    isRegistering.value = false
  }
}

const openAssignModal = (device) => {
  selectedDevice.value = device
  assignShortId.value = device.short_id || ''
  assignError.value = ''
  showAssignModal.value = true
}

const confirmAssignShortId = async () => {
  assignError.value = ''
  isAssigning.value = true

  try {
    console.log(
      '📍 Назначаем номер стола:',
      assignShortId.value,
      'устройству:',
      selectedDevice.value.android_id,
    )

    let result

    // Если у устройства уже есть short_id, используем updateDeviceTable
    // Иначе используем assignShortId
    if (selectedDevice.value.short_id) {
      console.log('📱 Изменяем номер стола (устройство уже имеет стол)')
      result = await deviceStore.updateDeviceTable(
        selectedDevice.value.android_id,
        assignShortId.value,
      )
    } else {
      console.log('📱 Назначаем номер стола (первое назначение)')
      result = await deviceStore.assignShortId(selectedDevice.value.android_id, assignShortId.value)
    }

    if (result.success) {
      console.log('✅ Номер стола назначен/изменен, обновляем список...')

      // Перезагружаем весь список устройств для актуальности
      await loadDevices()

      closeAssignModal()
      alert(
        `Номер стола ${assignShortId.value} успешно ${selectedDevice.value.short_id ? 'изменен' : 'назначен'} устройству!`,
      )
    } else {
      assignError.value = result.error || 'Ошибка назначения номера стола'
    }
  } catch (err) {
    assignError.value = err.message
  } finally {
    isAssigning.value = false
  }
}

const closeRegisterModal = () => {
  showRegisterModal.value = false
  newDevice.value = {
    android_id: '',
    model: '',
    os_version: '',
    app_version: '1.0.0',
  }
  registerError.value = ''
}

const closeAssignModal = () => {
  showAssignModal.value = false
  selectedDevice.value = null
  assignShortId.value = ''
  assignError.value = ''
}

const generateQrCode = async () => {
  qrError.value = ''
  isGeneratingQr.value = true

  try {
    console.log('🔲 Генерируем QR код с параметрами:', qrConfig.value)

    // Формируем тело запроса (только заполненные поля)
    const requestBody = {}

    if (qrConfig.value.wifi_ssid) {
      requestBody.wifi_ssid = qrConfig.value.wifi_ssid
    }
    if (qrConfig.value.wifi_password) {
      requestBody.wifi_password = qrConfig.value.wifi_password
    }
    if (qrConfig.value.wifi_security) {
      requestBody.wifi_security = qrConfig.value.wifi_security
    }

    const response = await fetch('http://83.222.9.90:8080/api/devices/generate_qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ QR код сгенерирован:', data)
      generatedQr.value = data
    } else {
      const errorData = await response.json()
      qrError.value = errorData.error || 'Ошибка генерации QR кода'
      console.error('❌ Ошибка генерации QR:', errorData)
    }
  } catch (error) {
    qrError.value = error.message || 'Ошибка сети при генерации QR кода'
    console.error('❌ Критическая ошибка генерации QR:', error)
  } finally {
    isGeneratingQr.value = false
  }
}

const downloadQr = () => {
  if (!generatedQr.value?.qr_base64) return

  // Создаем ссылку для скачивания
  const link = document.createElement('a')
  link.href = generatedQr.value.qr_base64
  link.download = `android-provisioning-qr-${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  console.log('💾 QR код скачан')
}

const closeQrModal = () => {
  showQrModal.value = false
  generatedQr.value = null
  qrError.value = ''
  qrConfig.value = {
    wifi_ssid: '',
    wifi_password: '',
    wifi_security: 'WPA',
  }
}

const openControlModal = (device) => {
  selectedDevice.value = device
  controlError.value = ''
  controlSuccess.value = ''
  commandHistory.value = []
  showControlModal.value = true
}

const closeControlModal = () => {
  showControlModal.value = false
  selectedDevice.value = null
  controlError.value = ''
  controlSuccess.value = ''
  commandHistory.value = []
  updateConfig.value = {
    apk_url: '',
    checksum: '',
  }
}

const sendCommand = async (command) => {
  if (!selectedDevice.value) return

  controlError.value = ''
  controlSuccess.value = ''
  isExecutingCommand.value = true

  try {
    const android_id = selectedDevice.value.android_id
    console.log(`🔧 Отправка команды ${command} устройству ${android_id}`)

    // TODO: Раскомментировать после тестирования API
    /*
    const response = await fetch(`http://83.222.9.90:8080/api/device/${android_id}/${command}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Команда отправлена:', data)
      controlSuccess.value = `Команда "${command}" успешно отправлена устройству`
      
      // Автоматически загружаем историю после успешной команды
      setTimeout(() => loadCommandHistory(), 500)
    } else {
      const errorData = await response.json()
      controlError.value = errorData.error || `Ошибка отправки команды ${command}`
      console.error('❌ Ошибка команды:', errorData)
    }
    */

    // Временная заглушка для тестирования UI
    await new Promise((resolve) => setTimeout(resolve, 500))
    controlSuccess.value = `Команда "${command}" успешно отправлена устройству (тестовый режим)`
    console.log('⚠️ API не вызван - тестовый режим')
  } catch (error) {
    controlError.value = error.message || 'Ошибка сети при отправке команды'
    console.error('❌ Критическая ошибка отправки команды:', error)
  } finally {
    isExecutingCommand.value = false
  }
}

const sendUpdateCommand = async () => {
  if (!selectedDevice.value || !updateConfig.value.apk_url) return

  controlError.value = ''
  controlSuccess.value = ''
  isExecutingCommand.value = true

  try {
    const android_id = selectedDevice.value.android_id
    console.log(`📦 Отправка команды обновления устройству ${android_id}`)

    const requestBody = {
      apk_url: updateConfig.value.apk_url,
    }

    if (updateConfig.value.checksum) {
      requestBody.checksum = updateConfig.value.checksum
    }

    // TODO: Раскомментировать после тестирования API
    /*
    const response = await fetch(`http://83.222.9.90:8080/api/device/${android_id}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Команда обновления отправлена:', data)
      controlSuccess.value = 'Команда обновления успешно отправлена устройству'
      
      // Очищаем поля после успешной отправки
      updateConfig.value = {
        apk_url: '',
        checksum: '',
      }
      
      // Загружаем историю
      setTimeout(() => loadCommandHistory(), 500)
    } else {
      const errorData = await response.json()
      controlError.value = errorData.error || 'Ошибка отправки команды обновления'
      console.error('❌ Ошибка команды обновления:', errorData)
    }
    */

    // Временная заглушка для тестирования UI
    await new Promise((resolve) => setTimeout(resolve, 500))
    controlSuccess.value = 'Команда обновления успешно отправлена устройству (тестовый режим)'
    console.log('⚠️ API не вызван - тестовый режим')

    // Очищаем поля после успешной отправки
    updateConfig.value = {
      apk_url: '',
      checksum: '',
    }
  } catch (error) {
    controlError.value = error.message || 'Ошибка сети при отправке команды обновления'
    console.error('❌ Критическая ошибка отправки команды обновления:', error)
  } finally {
    isExecutingCommand.value = false
  }
}

const loadCommandHistory = async () => {
  if (!selectedDevice.value) return

  controlError.value = ''
  isLoadingHistory.value = true

  try {
    const android_id = selectedDevice.value.android_id
    console.log(`📋 Загрузка истории команд для ${android_id}`)

    // TODO: Раскомментировать после тестирования API
    /*
    const response = await fetch(`http://83.222.9.90:8080/api/device/${android_id}/commands`)

    if (response.ok) {
      const data = await response.json()
      console.log('✅ История команд загружена:', data)
      commandHistory.value = data.commands || []
    } else {
      const errorData = await response.json()
      controlError.value = errorData.error || 'Ошибка загрузки истории команд'
      console.error('❌ Ошибка загрузки истории:', errorData)
    }
    */

    // Временная заглушка для тестирования UI
    await new Promise((resolve) => setTimeout(resolve, 500))
    commandHistory.value = [
      {
        id: 1,
        device_id: android_id,
        command: 'lock',
        payload: null,
        executed: true,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3500000).toISOString(),
      },
      {
        id: 2,
        device_id: android_id,
        command: 'update',
        payload: '{"apk_url":"http://example.com/app.apk"}',
        executed: false,
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 3,
        device_id: android_id,
        command: 'reboot',
        payload: null,
        executed: true,
        created_at: new Date(Date.now() - 600000).toISOString(),
        updated_at: new Date(Date.now() - 500000).toISOString(),
      },
    ]
    console.log('⚠️ API не вызван - тестовый режим, показаны примеры команд')
  } catch (error) {
    controlError.value = error.message || 'Ошибка сети при загрузке истории'
    console.error('❌ Критическая ошибка загрузки истории:', error)
  } finally {
    isLoadingHistory.value = false
  }
}

const getCommandIcon = (command) => {
  const icons = {
    lock: '🔒',
    unlock: '🔓',
    reboot: '🔄',
    shutdown: '⚡',
    update: '📦',
  }
  return icons[command] || '⚙️'
}

const getDeviceStatus = (device) => {
  // Если есть явное поле is_active
  if (device.is_active !== undefined) {
    return device.is_active ? 'online' : 'offline'
  }
  // Fallback на старое поле status
  return device.status || 'offline'
}

const getStatusText = (status) => {
  const statusMap = {
    online: '🟢 Онлайн',
    offline: '🔴 Офлайн',
    idle: '🟡 Неактивен',
  }
  return statusMap[status] || '⚪ Неизвестно'
}

const getBatteryClass = (battery) => {
  if (battery > 60) return 'high'
  if (battery > 30) return 'medium'
  return 'low'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000 / 60) // в минутах

  if (diff < 1) return 'Только что'
  if (diff < 60) return `${diff} мин назад`
  if (diff < 1440) return `${Math.floor(diff / 60)} ч назад`
  return date.toLocaleString('ru-RU')
}

// Lifecycle
onMounted(() => {
  loadDevices()
})
</script>

<style scoped>
.device-management {
  padding: 20px;
  max-width: 1400px;
  overflow-y: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-refresh {
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-qr {
  padding: 12px 24px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-qr:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-add {
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* Индикатор загрузки */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-spinner p {
  margin: 0;
  font-size: 16px;
}

/* Сообщение об ошибке */
.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #dc2626;
  text-align: center;
}

.error-message p {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.btn-retry {
  padding: 8px 16px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-retry:hover {
  background: #b91c1c;
}

/* Пустое состояние */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #374151;
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 16px;
}

.btn-add-large {
  padding: 16px 32px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.device-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.device-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.device-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
}

.device-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.device-info {
  flex: 1;
}

.device-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #1f2937;
}

.android-id {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  font-family: 'Courier New', monospace;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.online {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.offline {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.idle {
  background: #fef3c7;
  color: #92400e;
}

.device-details {
  border-top: 1px solid #e5e7eb;
  padding-top: 15px;
  margin-bottom: 15px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.detail-row .label {
  color: #6b7280;
  font-weight: 500;
}

.detail-row .value {
  color: #1f2937;
}

.table-number {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.not-assigned {
  color: #9ca3af;
  font-style: italic;
}

.battery {
  font-weight: 600;
}

.battery.high {
  color: #059669;
}

.battery.medium {
  color: #d97706;
}

.battery.low {
  color: #dc2626;
}

.device-actions {
  display: flex;
  gap: 10px;
  border-top: 1px solid #e5e7eb;
  padding-top: 15px;
}

.btn-assign,
.btn-control,
.btn-delete {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-assign {
  background: #3b82f6;
  color: white;
}

.btn-assign:hover:not(:disabled) {
  background: #2563eb;
}

.btn-control {
  background: #8b5cf6;
  color: white;
}

.btn-control:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover {
  background: #dc2626;
}

/* Модальные окна */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 25px;
  overflow-y: auto;
  flex: 1;
}

.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.device-name {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.android-id-small {
  margin: 0 0 20px 0;
  font-size: 12px;
  color: #6b7280;
  font-family: 'Courier New', monospace;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #6b7280;
  font-size: 12px;
}

.error-message {
  padding: 12px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  margin-top: 15px;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 20px 25px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 16px 16px;
  flex-shrink: 0;
}

.btn-cancel,
.btn-register,
.btn-assign-confirm {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-register,
.btn-assign-confirm {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-register:hover:not(:disabled),
.btn-assign-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-register:disabled,
.btn-assign-confirm:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

/* QR модалка */
.qr-modal {
  max-width: 600px;
}

/* Control модалка */
.control-modal {
  max-width: 650px;
}

.control-device-info {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: center;
}

.control-section {
  margin-bottom: 28px;
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border: 2px solid #e5e7eb;
  border-radius: 12px;
}

.control-section h4 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
}

.control-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.btn-control-action {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.btn-control-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.btn-lock {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.btn-lock:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-unlock {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.btn-unlock:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-reboot {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.btn-reboot:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-shutdown {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.btn-shutdown:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

.btn-update {
  width: 100%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  margin-top: 12px;
}

.btn-update:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-history {
  width: 100%;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.btn-history:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.control-hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}

.command-history {
  margin-top: 16px;
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.command-history::-webkit-scrollbar {
  width: 6px;
}

.command-history::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.command-history::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.history-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-command {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.history-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.history-status.executed {
  background: #d1fae5;
  color: #065f46;
}

.history-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.history-meta {
  font-size: 12px;
  color: #6b7280;
}

.success-message {
  padding: 12px;
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  color: #065f46;
  font-size: 14px;
  margin-top: 15px;
}

.qr-info {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #bfdbfe;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-text {
  margin: 0 0 10px 0;
  color: #1e40af;
  font-size: 14px;
}

.info-list {
  margin: 0;
  padding-left: 20px;
  color: #1e3a8a;
  font-size: 13px;
  line-height: 1.6;
}

.info-list li {
  margin-bottom: 6px;
}

.qr-result {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #bbf7d0;
  border-radius: 12px;
  text-align: center;
}

.qr-result h4 {
  margin: 0 0 16px 0;
  color: #166534;
  font-size: 16px;
}

.qr-image-container {
  background: white;
  padding: 20px;
  border-radius: 10px;
  display: inline-block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.qr-image-container img {
  display: block;
  max-width: 300px;
  width: 100%;
  height: auto;
}

.qr-instruction {
  margin: 0 0 16px 0;
  color: #166534;
  font-size: 14px;
  font-weight: 500;
}

.btn-download {
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-download:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-generate {
  flex: 1;
  padding: 12px 20px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-generate:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-generate:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .devices-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
  }
}
</style>
