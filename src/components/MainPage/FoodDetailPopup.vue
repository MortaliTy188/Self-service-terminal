<script setup>
import { ref } from 'vue'
import placeholderImage from '@/assets/image 28.png'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  item: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'add-to-cart'])

const quantity = ref(1)

const closePopup = () => {
  emit('close')
  quantity.value = 1
}

const increaseQuantity = () => {
  quantity.value++
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const addToCart = () => {
  if (props.item) {
    emit('add-to-cart', { ...props.item, quantity: quantity.value })
    closePopup()
  }
}

const handleImageError = (event) => {
  event.target.src = placeholderImage
}
</script>

<template>
  <div v-if="show && item" class="popup-overlay" @click="closePopup">
    <div class="popup-container" @click.stop>
      <div class="popup-header">
        <div class="header-left">
          <img
            :src="item.image || placeholderImage"
            :alt="item.title"
            class="food-image"
            @error="handleImageError"
          />
        </div>
        <div class="header-right">
          <h2 class="food-title">{{ item.title }}</h2>
          <p class="food-price">{{ item.price }}₽</p>
          <div class="quantity-controls">
            <button class="quantity-btn" @click="decreaseQuantity" :disabled="quantity <= 1">
              -
            </button>
            <span class="quantity-display">{{ quantity }}</span>
            <button class="quantity-btn" @click="increaseQuantity">+</button>
          </div>
        </div>
      </div>

      <div class="popup-body">
        <div class="description-section">
          <h3>Описание</h3>
          <p>
            {{
              item.description ||
              'Вкусное блюдо, приготовленное из качественных ингредиентов по традиционному рецепту.'
            }}
          </p>
        </div>

        <div class="nutrition-info">
          <div class="nutrition-item">
            <span class="nutrition-label">Вес:</span>
            <span class="nutrition-value">{{ item.weight || '250' }}г</span>
          </div>
          <div class="nutrition-item">
            <span class="nutrition-label">Калорийность:</span>
            <span class="nutrition-value">{{ item.calories || '320' }} ккал</span>
          </div>
        </div>
      </div>

      <div class="popup-footer">
        <button class="back-button" @click="closePopup">Назад</button>
        <button class="add-to-cart-button" @click="addToCart">
          Добавить в корзину ({{ item.price * quantity }}₽)
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
  max-height: 85vh;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  cursor: default;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.popup-header {
  display: flex;
  padding: 25px;
  gap: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.header-left {
  flex: 0 0 120px;
}

.food-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 10px;
}

.header-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 120px;
}

.food-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.food-price {
  font-size: 18px;
  font-weight: bold;
  color: #4caf50;
  margin: 0 0 15px 0;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
}

.quantity-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #ddd;
  background-color: white;
  border-radius: 6px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.quantity-btn:hover:not(:disabled) {
  border-color: #4caf50;
  color: #4caf50;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-display {
  font-size: 18px;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
  color: #333;
}

.popup-body {
  flex: 1;
  padding: 25px;
  overflow-y: auto;
}

.description-section {
  margin-bottom: 25px;
}

.description-section h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.description-section p {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.nutrition-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nutrition-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.nutrition-label {
  font-size: 16px;
  color: #666;
}

.nutrition-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.popup-footer {
  padding: 25px;
  border-top: 2px solid #f0f0f0;
  display: flex;
  gap: 15px;
}

.back-button,
.add-to-cart-button {
  padding: 15px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button {
  flex: 0 0 auto;
  background-color: #f0f0f0;
  color: #333;
  min-width: 100px;
}

.back-button:hover {
  background-color: #e0e0e0;
}

.add-to-cart-button {
  flex: 1;
  background-color: #4caf50;
  color: white;
}

.add-to-cart-button:hover {
  background-color: #45a049;
}

@media (max-width: 768px) {
  .popup-container {
    margin: 20px;
    max-height: 90vh;
  }

  .popup-header {
    flex-direction: column;
    padding: 20px;
    gap: 15px;
  }

  .header-left {
    flex: none;
    align-self: center;
  }

  .food-image {
    width: 150px;
    height: 150px;
  }

  .header-right {
    min-height: auto;
    text-align: center;
  }

  .quantity-controls {
    justify-content: center;
    margin-top: 15px;
  }

  .popup-body {
    padding: 20px;
  }

  .popup-footer {
    padding: 20px;
    flex-direction: column;
  }

  .back-button,
  .add-to-cart-button {
    flex: none;
  }
}
</style>
