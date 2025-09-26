<template>
  <Teleport to="body">
    <div v-if="show" class="notification-overlay" @click="closeNotification">
      <div class="notification-container" @click.stop>
        <div class="notification-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" fill="#4CAF50" />
            <path
              d="m9 12 2 2 4-4"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h2 class="notification-title">Заказ успешно оформлен!</h2>
        <p class="notification-message">
          Ваш заказ принят в обработку. Ожидайте уведомления о готовности.
        </p>
        <div class="notification-details" v-if="orderDetails">
          <div class="detail-item">
            <span class="detail-label">Номер заказа:</span>
            <span class="detail-value">#{{ orderNumber }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Время:</span>
            <span class="detail-value">{{ orderDetails.orderTime }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Общая сумма:</span>
            <span class="detail-value">{{ orderDetails.totalPrice }}₽</span>
          </div>
        </div>
        <button class="notification-button" @click="closeNotification">Понятно</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  orderDetails: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])

const orderNumber = computed(() => {
  if (!props.orderDetails) return '000'
  const time = new Date().getTime()
  return String(time).slice(-3)
})

const closeNotification = () => {
  emit('close')
}

setTimeout(() => {
  if (props.show) {
    closeNotification()
  }
}, 8000)
</script>

<style scoped>
.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.notification-container {
  background: white;
  border-radius: 24px;
  padding: 40px 35px;
  max-width: 480px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 2px solid #f0f0f0;
  transform: scale(0.9);
  animation: notificationAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes notificationAppear {
  0% {
    opacity: 0;
    transform: scale(0.7) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.notification-icon {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.notification-title {
  font-size: 28px;
  font-weight: 700;
  color: #2e7d32;
  margin-bottom: 12px;
  line-height: 1.2;
}

.notification-message {
  font-size: 18px;
  color: #666;
  margin-bottom: 25px;
  line-height: 1.4;
}

.notification-details {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 25px;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 16px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #666;
  font-weight: 500;
}

.detail-value {
  color: #333;
  font-weight: 600;
}

.notification-button {
  background: #4caf50;
  color: white;
  font-size: 18px;
  font-weight: 600;
  border-radius: 16px;
  padding: 16px 40px;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 160px;
}

.notification-button:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
}

.notification-button:active {
  transform: translateY(0);
}
</style>
