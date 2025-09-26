<template>
  <div class="main-container-right">
    <div class="cart-header">
      <div class="cart-title">Корзина</div>
      <div v-if="cartItems.length === 0" class="cart-empty">Ваша корзина пуста</div>
      <div v-else class="cart-items">
        <CartItem
          v-for="(item, index) in cartItems"
          :key="index"
          :item="item"
          @add-quantity="$emit('addQuantity', item)"
          @remove-quantity="$emit('removeQuantity', index)"
          @remove-from-cart="$emit('removeFromCart', index)"
        />
      </div>
    </div>
    <button class="button" v-show="cartItems.length > 0" @click="$emit('makeOrder')">
      Сделать заказ
    </button>
  </div>
</template>

<script setup>
import CartItem from './CartItem.vue'

defineProps({
  cartItems: {
    type: Array,
    required: true,
  },
})

defineEmits(['addQuantity', 'removeQuantity', 'removeFromCart', 'makeOrder'])
</script>

<style scoped>
.main-container-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  flex: 1;
  padding: 25px 20px;
  background: white;
  overflow-x: hidden;
  overflow-y: auto;
  max-width: 100%;
  border-radius: 20px;
  border: 1px solid #333;
}

.cart-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.cart-title {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 25px;
  color: #333;
}

.cart-empty {
  font-size: 18px;
  color: #666;
  font-style: italic;
  margin-top: 50px;
}

.cart-items {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-x: hidden;
  padding-right: 5px;
  padding-left: 5px;
  padding-top: 5px;
}

.button {
  background: #4caf50;
  color: white;
  font-size: 22px;
  font-weight: 600;
  border-radius: 15px;
  padding: 18px 24px;
  border: none;
  width: 100%;
  max-width: 280px;
  height: 65px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  position: relative;
  overflow: hidden;
}

.button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.button:hover::before {
  left: 100%;
}

.button:hover {
  background: #45a049;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
}

.button:active {
  transform: translateY(-1px) scale(1.01);
}
</style>
