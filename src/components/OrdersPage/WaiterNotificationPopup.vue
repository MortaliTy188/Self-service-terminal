<template>
  <div v-if="show" class="notification-overlay" @click.self="close">
    <div class="notification-popup">
      <div class="notification-header">
        <h3>Новое уведомление</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="notification-content">
        <div class="notification-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5S10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
              fill="#FF6B35"
            />
          </svg>
        </div>

        <div class="notification-details">
          <h4>Вызов официанта</h4>
          <p class="table-info">Стол № {{ notification.tableNumber }}</p>
          <p class="time-info">{{ formatTime(notification.timestamp) }}</p>
          <p class="message">{{ notification.message }}</p>
        </div>
      </div>

      <div class="notification-actions">
        <button class="btn-secondary" @click="close">Закрыть</button>
        <button class="btn-primary" @click="markAsResolved">Отметить выполненным</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: Boolean,
  notification: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['close', 'resolve'])

const close = () => {
  emit('close')
}

const markAsResolved = () => {
  emit('resolve', props.notification.id)
  emit('close')
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const now = new Date()

  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

  if (diffInMinutes < 1) {
    return 'Только что'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} мин. назад`
  } else {
    const diffInHours = Math.floor(diffInMinutes / 60)
    return `${diffInHours} ч. назад`
  }
}
</script>

<style scoped>
.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.notification-popup {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
  max-width: 480px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0;
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 24px;
}

.notification-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.notification-content {
  display: flex;
  gap: 16px;
  padding: 0 24px 24px;
}

.notification-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  background: #fef3f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-details {
  flex: 1;
}

.notification-details h4 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px;
}

.table-info {
  font-size: 16px;
  font-weight: 600;
  color: #ff6b35;
  margin: 0 0 4px;
}

.time-info {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px;
}

.message {
  font-size: 14px;
  color: #374151;
  margin: 0;
  line-height: 1.5;
}

.notification-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 0 24px 24px;
  border-top: 1px solid #e5e5e5;
  margin-top: 24px;
  padding-top: 24px;
}

.btn-secondary,
.btn-primary {
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #ff6b35;
  color: white;
}

.btn-primary:hover {
  background: #e55a2b;
}
</style>
