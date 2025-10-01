<script setup>
import { ref, computed, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { useWaiterStore, useOrdersStore, useMenuStore } from '@/stores'
import {
  CategoryList,
  FoodGrid,
  ShoppingCart,
  BottomControls,
  WaiterPopup,
  OrderPopup,
  FoodDetailPopup,
  OrderDetailsPopup,
  SuccessNotification,
} from '@/components/MainPage'

// Pinia stores
const waiterStore = useWaiterStore()
const ordersStore = useOrdersStore()
const menuStore = useMenuStore()

// Local state
const selectedCategory = ref(null) // null означает "Все категории"
const showWaiterPopup = ref(false)
const showOrderPopup = ref(false)
const showOrderDetailsPopup = ref(false)
const showFoodDetailPopup = ref(false)
const showSuccessNotification = ref(false)
const selectedFoodItem = ref(null)

// Computed values from stores
const cartItems = computed(() => ordersStore.cartItems)
const lastOrder = computed(() => ordersStore.lastOrder)
const isWaiterLoading = computed(() => waiterStore.isLoading)

// Event handlers
const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
  if (categoryId) {
    menuStore.setCurrentCategory(categoryId)
  } else {
    menuStore.clearCategoryFilter()
  }
}

const addToCart = (eventData) => {
  // Обработка данных от FoodDetailPopup
  if (eventData.success !== undefined) {
    // Данные уже обработаны в store через addToCartServer
    console.log('📦 Товар обработан через store:', eventData)
    return
  }

  // Обработка старого формата для обратной совместимости
  if (eventData.cartData) {
    console.log('📦 Обновляем корзину данными с сервера:', eventData.cartData)
    ordersStore.updateCartFromServer(eventData.cartData)
  } else {
    // Fallback для локального добавления
    console.log('📦 Локальное добавление в корзину:', eventData)
    ordersStore.addToCart(eventData)
  }
}

const showFoodDetail = (item) => {
  selectedFoodItem.value = item
  showFoodDetailPopup.value = true
}

const closeFoodDetailPopup = () => {
  showFoodDetailPopup.value = false
  selectedFoodItem.value = null
}

const addQuantity = async (item) => {
  // Используем server API для добавления количества
  try {
    const result = await ordersStore.addToCartServer(item.id, 1)
    if (!result.success) {
      // Fallback на локальное обновление
      ordersStore.addToCart(item, 1)
    }
  } catch (error) {
    // Fallback на локальное обновление
    ordersStore.addToCart(item, 1)
  }
}

const removeQuantity = async (index) => {
  const cartItem = cartItems.value[index]
  if (cartItem) {
    if (cartItem.quantity > 1) {
      // Если количество больше 1, используем стратегию: удалить и добавить с новым количеством
      try {
        // Сначала удаляем товар полностью
        const removeResult = await ordersStore.removeFromCartServer(cartItem.id)
        if (removeResult.success) {
          // Затем добавляем с уменьшенным количеством
          const addResult = await ordersStore.addToCartServer(cartItem.id, cartItem.quantity - 1)
          if (!addResult.success) {
            // Если не удалось добавить обратно, пробуем восстановить локально
            ordersStore.addToCart(cartItem, cartItem.quantity)
          }
        } else {
          // Fallback на локальное обновление
          ordersStore.updateCartItemQuantity(cartItem.id, cartItem.quantity - 1)
        }
      } catch (error) {
        // Fallback на локальное обновление
        ordersStore.updateCartItemQuantity(cartItem.id, cartItem.quantity - 1)
      }
    } else {
      // Если количество равно 1, удаляем товар полностью
      try {
        const result = await ordersStore.removeFromCartServer(cartItem.id)
        if (!result.success) {
          // Fallback на локальное удаление
          ordersStore.removeFromCart(cartItem.id)
        }
      } catch (error) {
        // Fallback на локальное удаление
        ordersStore.removeFromCart(cartItem.id)
      }
    }
  }
}

const removeFromCart = async (index) => {
  const cartItem = cartItems.value[index]
  if (cartItem) {
    try {
      const result = await ordersStore.removeFromCartServer(cartItem.id)
      if (!result.success) {
        // Fallback на локальное удаление
        ordersStore.removeFromCart(cartItem.id)
      }
    } catch (error) {
      // Fallback на локальное удаление
      ordersStore.removeFromCart(cartItem.id)
    }
  }
}

const callWaiter = async () => {
  showWaiterPopup.value = true
}

const handleCallWaiter = async (reason, tableNumber = 5) => {
  await waiterStore.callWaiter(reason, tableNumber)
  showWaiterPopup.value = false
}

const closeWaiterPopup = () => {
  showWaiterPopup.value = false
}

const showOrderDetails = () => {
  showOrderDetailsPopup.value = true
}

const closeOrderDetailsPopup = () => {
  showOrderDetailsPopup.value = false
}

const closeSuccessNotification = () => {
  showSuccessNotification.value = false
}

const makeOrder = () => {
  showOrderPopup.value = true
}

const closeOrderPopup = () => {
  showOrderPopup.value = false
}

const confirmOrder = async (orderData) => {
  const orderDetails = {
    items: [...cartItems.value],
    tableNumber: orderData?.tableNumber || 5,
    customerName: orderData?.customerName || '',
    specialRequests: orderData?.specialRequests || '',
    total: cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }

  await ordersStore.createOrder(orderDetails)
  showSuccessNotification.value = true
  showOrderPopup.value = false
}

// Инициализация при монтировании
onMounted(async () => {
  await menuStore.fetchMenuWithCategories()
  // Загружаем корзину с сервера
  await ordersStore.fetchCart()
})
</script>

<template>
  <AppHeader title="Главная страница" table-number="Номер стола" />
  <main>
    <div class="main-container">
      <div class="main-container-left">
        <div class="main-container-left-top">
          <CategoryList :selected-category="selectedCategory" @select-category="selectCategory" />
          <FoodGrid :selected-category="selectedCategory" @show-detail="showFoodDetail" />
        </div>
        <BottomControls @call-waiter="callWaiter" @show-order-details="showOrderDetails" />
      </div>
      <ShoppingCart
        :cart-items="cartItems"
        @add-quantity="addQuantity"
        @remove-quantity="removeQuantity"
        @remove-from-cart="removeFromCart"
        @make-order="makeOrder"
      />
    </div>
  </main>

  <WaiterPopup
    :show="showWaiterPopup"
    :is-loading="isWaiterLoading"
    @close="closeWaiterPopup"
    @call-waiter="handleCallWaiter"
  />

  <OrderPopup
    :show="showOrderPopup"
    :cart-items="cartItems"
    @close="closeOrderPopup"
    @confirm-order="confirmOrder"
  />

  <FoodDetailPopup
    :show="showFoodDetailPopup"
    :item="selectedFoodItem"
    @close="closeFoodDetailPopup"
    @add-to-cart="addToCart"
  />

  <OrderDetailsPopup
    :show="showOrderDetailsPopup"
    :cart-items="cartItems"
    :last-order="lastOrder"
    @close="closeOrderDetailsPopup"
  />

  <SuccessNotification
    :show="showSuccessNotification"
    :order-details="lastOrder"
    @close="closeSuccessNotification"
  />
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background: #f8f9fa;
  min-height: 100vh;
}

.main-container {
  display: flex;
  padding: 25px 30px;
  height: 85vh;
  overflow: hidden;
  gap: 25px;
  background: white;
}

@media screen and (max-width: 1280px) {
  .main-container {
    padding-bottom: 75px;
  }
}

.main-container-left {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  flex: 3;
  height: 100%;
  gap: 25px;
  overflow: hidden;
}

.main-container-left-top {
  display: flex;
  gap: 25px;
  max-width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

main {
  background: #f8f9fa;
  min-height: 85vh;
}
</style>
