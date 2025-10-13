<template>
  <div class="websocket-status" :class="statusClass">
    <div class="status-indicator">
      <div class="status-dot" :class="statusClass"></div>
      <span class="status-text">{{ statusText }}</span>
    </div>

    <div v-if="showDetails" class="status-details">
      <div class="detail-item">
        <span class="label">Статус:</span>
        <span class="value">{{ detailedStatus }}</span>
      </div>
      <div v-if="reconnectAttempts > 0" class="detail-item">
        <span class="label">Попыток переподключения:</span>
        <span class="value">{{ reconnectAttempts }}/{{ maxReconnectAttempts }}</span>
      </div>
      <div v-if="connectionError" class="detail-item error">
        <span class="label">Ошибка:</span>
        <span class="value">{{ connectionError }}</span>
      </div>
    </div>

    <button
      v-if="connectionStatus === 'disconnected' || connectionStatus === 'error'"
      class="reconnect-btn"
      @click="reconnect"
      :disabled="isConnecting"
    >
      {{ isConnecting ? 'Подключение...' : 'Переподключить' }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWebSocketStore } from '@/stores/websocket'

const webSocketStore = useWebSocketStore()

const props = defineProps({
  showDetails: {
    type: Boolean,
    default: false,
  },
})

// Computed properties
const connectionStatus = computed(() => webSocketStore.connectionStatus)
const isConnecting = computed(() => webSocketStore.isConnecting)
const connectionError = computed(() => webSocketStore.connectionError)
const reconnectAttempts = computed(() => webSocketStore.reconnectAttempts)
const maxReconnectAttempts = computed(() => webSocketStore.maxReconnectAttempts)

const statusClass = computed(() => {
  return `status-${connectionStatus.value}`
})

const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected':
      return 'Подключен'
    case 'connecting':
      return 'Подключение...'
    case 'error':
      return 'Ошибка'
    case 'disconnected':
      return 'Отключен'
    default:
      return 'Неизвестно'
  }
})

const detailedStatus = computed(() => {
  switch (connectionStatus.value) {
    case 'connected':
      return 'Соединение с сервером установлено'
    case 'connecting':
      return 'Устанавливается соединение с сервером'
    case 'error':
      return connectionError.value || 'Произошла ошибка подключения'
    case 'disconnected':
      return 'Нет соединения с сервером'
    default:
      return 'Неопределенное состояние'
  }
})

// Methods
const reconnect = () => {
  webSocketStore.connect()
}
</script>

<style scoped>
.websocket-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.3s ease;
}

.websocket-status.status-connected {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #065f46;
}

.websocket-status.status-connecting {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #1e40af;
}

.websocket-status.status-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #dc2626;
}

.websocket-status.status-disconnected {
  background: rgba(107, 114, 128, 0.1);
  border: 1px solid rgba(107, 114, 128, 0.2);
  color: #4b5563;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-dot.status-connected {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  animation: pulse-green 2s infinite;
}

.status-dot.status-connecting {
  background: #3b82f6;
  animation: pulse-blue 1s infinite;
}

.status-dot.status-error {
  background: #ef4444;
  animation: pulse-red 1s infinite;
}

.status-dot.status-disconnected {
  background: #6b7280;
}

.status-text {
  font-weight: 500;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  opacity: 0.8;
}

.detail-item {
  display: flex;
  gap: 6px;
}

.detail-item.error .value {
  color: #dc2626;
  font-weight: 500;
}

.label {
  font-weight: 500;
  min-width: 60px;
}

.value {
  flex: 1;
}

.reconnect-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.reconnect-btn:hover:not(:disabled) {
  background: #2563eb;
}

.reconnect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes pulse-green {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

@keyframes pulse-blue {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes pulse-red {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>
