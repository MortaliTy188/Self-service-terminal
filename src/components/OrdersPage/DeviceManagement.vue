<template>
  <div class="device-management">
    <div class="header">
      <h2>Управление устройствами</h2>
      <div class="header-info">
        <span class="device-count">Всего устройств: {{ devices.length }}</span>
        <span class="online-count">Онлайн: {{ onlineDevicesCount }}</span>
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка устройств...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>Ошибка загрузки: {{ error }}</p>
      <button class="retry-btn" @click="$emit('retry')">Повторить</button>
    </div>

    <div v-else class="devices-grid">
      <div v-for="device in devices" :key="device.id" class="device-card">
        <div class="device-header">
          <div
            class="device-status"
            :class="{ online: device.isOnline, offline: !device.isOnline }"
          >
            <div class="status-indicator"></div>
            <span class="status-text">{{ device.isOnline ? 'Онлайн' : 'Офлайн' }}</span>
          </div>
          <div class="device-table">Стол {{ device.tableNumber }}</div>
        </div>

        <div class="device-info">
          <div class="battery-section">
            <div class="battery-label">Заряд батареи</div>
            <div class="battery-container">
              <div class="battery-icon">
                <div
                  class="battery-fill"
                  :style="{ width: device.batteryLevel + '%' }"
                  :class="getBatteryClass(device.batteryLevel)"
                ></div>
              </div>
              <span class="battery-percentage">{{ device.batteryLevel }}%</span>
            </div>
          </div>

          <div class="device-details">
            <div class="detail-item">
              <span class="detail-label">Модель:</span>
              <span class="detail-value">{{ device.model }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Последняя активность:</span>
              <span class="detail-value">{{ formatLastActivity(device.lastActivity) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Ключ подключения:</span>
              <input
                type="text"
                :value="device.connectionKey"
                @input="updateConnectionKey(device.id, $event.target.value)"
                @blur="$event.target.value = device.connectionKey"
                class="connection-key-input"
                placeholder="Введите ключ подключения"
              />
            </div>
          </div>
        </div>

        <div class="device-actions">
          <button class="action-btn delete-btn" @click="deleteDevice(device.id)">Удалить</button>
        </div>
      </div>
    </div>

    <div v-if="!isLoading && devices.length === 0" class="empty-state">
      <div class="empty-icon">📱</div>
      <h3>Устройства не найдены</h3>
      <p>Подключенные планшеты будут отображаться здесь</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const BASE_URL = 'http://83.222.9.90:8080'

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['retry', 'delete-device', 'open-settings', 'update-connection-key'])

// Статические данные устройств
const devices = ref([
  {
    id: 1,
    tableNumber: 5,
    batteryLevel: 85,
    isOnline: true,
    model: 'Samsung Galaxy Tab A7',
    lastActivity: new Date(Date.now() - 1000 * 60 * 5), // 5 минут назад
    connectionKey: 'TAB-5-A7-2023',
  },
  {
    id: 2,
    tableNumber: 12,
    batteryLevel: 45,
    isOnline: true,
    model: 'iPad Air 2022',
    lastActivity: new Date(Date.now() - 1000 * 60 * 15), // 15 минут назад
    connectionKey: 'IPAD-12-AIR-2022',
  },
  {
    id: 3,
    tableNumber: 8,
    batteryLevel: 92,
    isOnline: false,
    model: 'Lenovo Tab M10',
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 часа назад
    connectionKey: 'LENOVO-8-M10',
  },
  {
    id: 4,
    tableNumber: 3,
    batteryLevel: 20,
    isOnline: true,
    model: 'Samsung Galaxy Tab S8',
    lastActivity: new Date(Date.now() - 1000 * 60 * 2), // 2 минуты назад
    connectionKey: 'SAMSUNG-3-S8',
  },
  {
    id: 5,
    tableNumber: 15,
    batteryLevel: 67,
    isOnline: true,
    model: 'iPad Pro 11"',
    lastActivity: new Date(Date.now() - 1000 * 60 * 30), // 30 минут назад
    connectionKey: 'IPAD-15-PRO-11',
  },
  {
    id: 6,
    tableNumber: 7,
    batteryLevel: 15,
    isOnline: false,
    model: 'Huawei MediaPad T5',
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 часа назад
    connectionKey: 'HUAWEI-7-T5',
  },
])

const onlineDevicesCount = computed(() => {
  return devices.value.filter((device) => device.isOnline).length
})

const getBatteryClass = (batteryLevel) => {
  if (batteryLevel <= 20) return 'battery-low'
  if (batteryLevel <= 50) return 'battery-medium'
  return 'battery-high'
}

const formatLastActivity = (lastActivity) => {
  const now = new Date()
  const diff = now - lastActivity
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Только что'
  if (minutes < 60) return `${minutes} мин. назад`
  if (hours < 24) return `${hours} ч. назад`
  return `${days} дн. назад`
}

const deleteDevice = (deviceId) => {
  if (confirm('Вы уверены, что хотите удалить это устройство?')) {
    emit('delete-device', deviceId)
    // Удаляем устройство из локального списка
    const deviceIndex = devices.value.findIndex((device) => device.id === deviceId)
    if (deviceIndex !== -1) {
      devices.value.splice(deviceIndex, 1)
    }
    console.log('Удаление устройства:', deviceId)
  }
}

const openDeviceSettings = (deviceId) => {
  emit('open-settings', deviceId)
  // Здесь будет логика открытия настроек устройства
  console.log('Настройки устройства:', deviceId)
}

const updateConnectionKey = async (deviceId, newKey) => {
  try {
    console.log('Обновление ключа подключения для устройства:', deviceId, newKey)

    // API запрос (пока закомментирован, так как эндпоинта нет)
    // const response = await fetch(`${BASE_URL}/devices/${deviceId}/connection-key`, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ connectionKey: newKey })
    // })

    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`)
    // }

    // const updatedDevice = await response.json()

    // Временно обновляем локально
    const device = devices.value.find((d) => d.id === deviceId)
    if (device) {
      device.connectionKey = newKey
      emit('update-connection-key', deviceId, newKey)
      console.log('Ключ подключения успешно обновлен (локально)')
    }
  } catch (error) {
    console.error('Ошибка при обновлении ключа подключения:', error)
    // В будущем здесь можно показать уведомление об ошибке
    // Восстанавливаем старое значение при ошибке
    // const device = devices.value.find((d) => d.id === deviceId)
    // if (device && device.connectionKey !== newKey) {
    //   // Восстановить старое значение в интерфейсе
    // }
  }
}

// Эмуляция загрузки данных
onMounted(() => {
  // В будущем здесь будет загрузка с сервера
  console.log('DeviceManagement mounted, devices:', devices.value.length)
})
</script>

<style scoped>
.device-management {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 40px;
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

.header-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.device-count,
.online-count {
  font-size: 14px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 20px;
  background: #f3f4f6;
  color: #374151;
}

.online-count {
  background: #d1fae5;
  color: #065f46;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  color: #dc3545;
}

.retry-btn {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #2563eb;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  padding: 20px 20px 40px 20px;
}

.device-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.device-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
}

.device-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #dc2626;
}

.device-status.online .status-indicator {
  background: #16a34a;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
  color: #dc2626;
}

.device-status.online .status-text {
  color: #16a34a;
}

.device-table {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.device-info {
  padding: 20px;
}

.battery-section {
  margin-bottom: 20px;
}

.battery-label {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.battery-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.battery-icon {
  width: 40px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  position: relative;
  background: #f9fafb;
}

.battery-icon::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 6px;
  width: 4px;
  height: 8px;
  background: #d1d5db;
  border-radius: 0 2px 2px 0;
}

.battery-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.battery-high {
  background: #16a34a;
}

.battery-medium {
  background: #f59e0b;
}

.battery-low {
  background: #dc2626;
}

.battery-percentage {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.device-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.connection-key-input {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #1f2937;
  background: #f9fafb;
  min-width: 150px;
  transition: all 0.2s;
}

.connection-key-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.connection-key-input:hover {
  border-color: #9ca3af;
}

.device-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f8f9fa;
}

.action-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
}

.settings-btn {
  background: #6b7280;
  color: white;
}

.settings-btn:hover {
  background: #4b5563;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 24px;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-info {
    justify-content: center;
  }

  .devices-grid {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
  }

  .device-actions {
    flex-direction: column;
  }
}
</style>
