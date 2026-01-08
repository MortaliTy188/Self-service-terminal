<template>
  <div class="cart-item">
    <img
      class="cart-item__image"
      :src="item.image || placeholderImage"
      :alt="item.name || item.title"
      @error="handleImageError"
    />

    <div class="cart-item__content">
      <div class="cart-item__name">{{ item.name || item.title }}</div>
      <div class="cart-item__price">{{ item.price }} ₽</div>

      <div class="cart-item__qty">
        <button class="cart-item__qty-btn" type="button" @click="$emit('removeQuantity')">-</button>
        <span class="cart-item__qty-value">{{ item.quantity }}</span>
        <button class="cart-item__qty-btn" type="button" @click="$emit('addQuantity')">+</button>
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
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 0;
  background: transparent;
}

.cart-item__image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 12px;
  flex: none;
}

.cart-item__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-width: 0;
}

.cart-item__name {
  font-size: 16px;
  font-weight: 600;
  color: #151515;
  line-height: 1.2;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cart-item__price {
  font-size: 14px;
  color: #151515;
  opacity: 0.8;
  margin-bottom: 10px;
}

.cart-item__qty {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 103px;
  height: 52px;
  padding: 0 10px;
  border-radius: 67px;
  background: #f5f4f2;
  justify-content: space-between;
}

.cart-item__qty-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #151515;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}

.cart-item__qty-value {
  min-width: 18px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #151515;
}
</style>
