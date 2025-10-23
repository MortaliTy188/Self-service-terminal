<template>
  <div class="device-management">
    <div class="header">
      <h2>Управление устройствами</h2>
      <div class="header-actions">
        <button class="btn-refresh" @click="loadDevices" :disabled="deviceStore.devicesLoading">
          🔄 Обновить список
        </button>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDeviceStore } from '@/stores/device'

const deviceStore = useDeviceStore()

// State
const showRegisterModal = ref(false)
const showAssignModal = ref(false)
const isRegistering = ref(false)
const isAssigning = ref(false)
const registerError = ref('')
const assignError = ref('')
const selectedDevice = ref(null)
const assignShortId = ref('')

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
