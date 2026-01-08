<template>
  <div class="main-container-right">
    <div class="cart-title">Ваш заказ</div>

    <div class="cart-content">
      <div v-if="cartItems.length === 0" class="cart-empty">Ваш заказ пуст</div>
      <div v-else class="cart-items">
        <div v-for="(item, index) in cartItems" :key="index" class="cart-item-row">
          <CartItem
            :item="item"
            @add-quantity="$emit('addQuantity', item)"
            @remove-quantity="$emit('removeQuantity', index)"
          />
        </div>
      </div>
    </div>

    <div class="cart-footer" v-show="cartItems.length > 0">
      <div class="cart-total">Итого: {{ totalPrice }} ₽</div>
      <button class="checkout-button" type="button" @click="$emit('makeOrder')">
        Оформить заказ
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CartItem from './CartItem.vue'

const props = defineProps({
  cartItems: {
    type: Array,
    required: true,
  },
})

defineEmits(['addQuantity', 'removeQuantity', 'removeFromCart', 'makeOrder'])

const totalPrice = computed(() => {
  return props.cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  )
})
</script>

<style scoped>
.main-container-right {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  height: 100%;
  flex: 1;
  padding: 25px 20px;
  background: white;
  overflow: hidden;
  max-width: 100%;
  border-radius: 20px;
  border: none;
}

@media (max-width: 1115px) {
  .main-container-right {
    padding: 18px 14px;
    flex-basis: 320px;
    max-width: 340px;
  }

  .cart-title {
    font-size: 26px;
  }

  .button {
    font-size: 20px;
    height: 58px;
    max-width: 240px;
    padding: 14px 16px;
  }
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
  font-weight: 600;
  margin-bottom: 16px;
  color: #151515;
  text-align: left;
}

.cart-empty {
  font-size: 18px;
  color: #666;
  font-style: italic;
  margin-top: 24px;
  text-align: left;
}

.cart-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.cart-items {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.cart-item-row {
  padding: 12px 0;
  border-bottom: 1px solid #8a8a8a;
}

.cart-item-row:last-child {
  border-bottom: none;
}

.cart-footer {
  flex: none;
  padding-top: 16px;
}

.cart-total {
  font-size: 18px;
  font-weight: 600;
  color: #151515;
  text-align: left;
  margin-bottom: 12px;
}

.checkout-button {
  width: 100%;
  height: 48px;
  border-radius: 94px;
  background: #151515;
  color: #ffffff;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
