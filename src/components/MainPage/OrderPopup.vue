<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  cartItems: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'confirm-order'])

const closePopup = () => {
  emit('close')
}

const confirmOrder = () => {
  emit('confirm-order')
}

const totalQuantity = computed(() => {
  return props.cartItems.reduce((total, item) => total + item.quantity, 0)
})

const totalPrice = computed(() => {
  return props.cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
})
</script>

<template>
  <div v-if="show" class="popup-overlay" @click="closePopup">
    <div class="popup-container" @click.stop>
      <div class="popup-header">
        <h2>Оформление заказа</h2>
      </div>

      <div class="popup-body">
        <div v-if="cartItems.length === 0" class="empty-cart">Корзина пуста</div>
        <div v-else>
          <div class="order-items">
            <div v-for="(item, index) in cartItems" :key="index" class="order-item">
              <div class="item-info">
                <span class="item-name">{{ item.title }}</span>
                <span class="item-details">{{ item.quantity }} шт. × {{ item.price }}₽</span>
              </div>
              <div class="item-total">{{ item.quantity * item.price }}₽</div>
            </div>
          </div>

          <div class="order-summary">
            <div class="summary-line">
              <span class="summary-label">ИТОГ:</span>
            </div>
            <div class="summary-line">
              <span>Общее количество блюд:</span>
              <span class="summary-value">{{ totalQuantity }} шт.</span>
            </div>
            <div class="summary-line total-price">
              <span>Общая стоимость:</span>
              <span class="summary-value">{{ totalPrice }}₽</span>
            </div>
          </div>
        </div>
      </div>

      <div class="popup-footer">
        <button class="back-button" @click="closePopup">Назад</button>
        <button class="order-button" @click="confirmOrder" :disabled="cartItems.length === 0">
          Заказать
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: pointer;
}

.popup-container {
  background-color: white;
  border-radius: 15px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  cursor: default;
  display: flex;
  flex-direction: column;
}

.popup-header {
  padding: 25px 30px 20px;
  border-bottom: 2px solid #f0f0f0;
  text-align: center;
}

.popup-header h2 {
  color: #333;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.popup-body {
  flex: 1;
  padding: 20px 30px;
  overflow-y: auto;
}

.empty-cart {
  text-align: center;
  color: #666;
  font-size: 18px;
  padding: 40px 20px;
}

.order-items {
  margin-bottom: 30px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.order-item:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.item-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.item-details {
  font-size: 14px;
  color: #666;
}

.item-total {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-left: 15px;
}

.order-summary {
  border-top: 2px solid #f0f0f0;
  padding-top: 20px;
  margin-top: 20px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 16px;
}

.summary-line:first-child {
  margin-bottom: 10px;
}

.summary-label {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.summary-value {
  font-weight: bold;
  color: #333;
}

.total-price {
  border-top: 1px solid #ddd;
  padding-top: 15px;
  margin-top: 10px;
  font-size: 18px;
  font-weight: bold;
}

.total-price .summary-value {
  color: #4caf50;
  font-size: 20px;
}

.popup-footer {
  padding: 20px 30px 25px;
  border-top: 2px solid #f0f0f0;
  display: flex;
  gap: 15px;
  justify-content: space-between;
}

.back-button,
.order-button {
  flex: 1;
  padding: 15px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button {
  background-color: #f0f0f0;
  color: #333;
}

.back-button:hover {
  background-color: #e0e0e0;
}

.order-button {
  background-color: #4caf50;
  color: white;
}

.order-button:hover:not(:disabled) {
  background-color: #45a049;
}

.order-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .popup-container {
    margin: 20px;
    max-height: 90vh;
  }

  .popup-header,
  .popup-body,
  .popup-footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .popup-header h2 {
    font-size: 20px;
  }

  .popup-footer {
    flex-direction: column;
  }

  .back-button,
  .order-button {
    flex: none;
  }
}
</style>
