<template>
  <div class="cart-item">
    <div class="cart-item-left">
      <img
        :src="item.image || placeholderImage"
        :alt="item.name || item.title"
        @error="handleImageError"
      />
    </div>
    <div class="cart-item-right">
      <div class="cart-item-top">
        <p class="cart-item__title">{{ item.name || item.title }} - {{ item.price }}₽</p>
      </div>
      <div class="cart-item-bottom">
        <div class="item-options">
          <button @click="$emit('removeQuantity')">-</button>
          <span>{{ item.quantity }}</span>
          <button @click="$emit('addQuantity')">+</button>
        </div>
        <button @click="$emit('removeFromCart')">Удалить</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import placeholderImage from '@/assets/image 28.png'

defineProps({
  item: {
    type: Object,
    required: true,
  },
})

defineEmits(['addQuantity', 'removeQuantity', 'removeFromCart'])

const handleImageError = (event) => {
  event.target.src = placeholderImage
}
</script>

<style scoped>
.cart-item {
  width: 100%;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 16px;
  background: white;
  border-radius: 15px;
  min-height: 85px;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid #333;
  transition: all 0.3s ease;
}

.cart-item:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
}

.cart-item-left {
  flex: 0 0 55px;
  height: 55px;
}

.cart-item-left img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cart-item-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 50px;
  min-width: 0;
  overflow: hidden;
}

.cart-item-top {
  margin-bottom: 8px;
}

.cart-item__title {
  font-size: 13px;
  font-weight: bold;
  text-align: left;
  margin: 0;
  line-height: 1.2;
}

.cart-item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  width: 100%;
  overflow: hidden;
}

.item-options {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #d9d9d9;
  padding: 3px 6px;
  border-radius: 4px;
  min-width: 70px;
}

.item-options button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-options span {
  font-weight: bold;
  min-width: 18px;
  text-align: center;
  font-size: 14px;
}

.cart-item-bottom button:last-child {
  background-color: #ff6b6b;
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 11px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  max-width: 60px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
