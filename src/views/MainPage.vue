<script setup>
import { ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { useWaiterNotifications } from '@/hooks'
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

// Хук для работы с уведомлениями официанта
const {
  callWaiter: callWaiterAPI,
  isLoading: isWaiterLoading,
  simulateNewNotification,
} = useWaiterNotifications()

const cartItems = ref([])
const lastOrder = ref(null)
const selectedCategory = ref(null) // null означает "Все категории"
const showWaiterPopup = ref(false)
const showOrderPopup = ref(false)
const showOrderDetailsPopup = ref(false)
const showFoodDetailPopup = ref(false)
const showSuccessNotification = ref(false)
const selectedFoodItem = ref(null)

const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
}

const addToCart = (itemData) => {
  const existingItem = cartItems.value.find(
    (cartItem) => cartItem.id === itemData.id || cartItem.title === itemData.title,
  )

  if (existingItem) {
    existingItem.quantity += itemData.quantity || 1
  } else {
    cartItems.value.push({
      ...itemData,
      quantity: itemData.quantity || 1,
      title: itemData.name || itemData.title, // для совместимости с существующими компонентами
    })
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

const addQuantity = (item) => {
  const cartItem = cartItems.value.find((i) => i.id === item.id || i.title === item.title)
  if (cartItem) {
    cartItem.quantity++
  }
}

const removeQuantity = (index) => {
  const cartItem = cartItems.value[index]
  if (cartItem && cartItem.quantity > 1) {
    cartItem.quantity--
  } else {
    removeFromCart(index)
  }
}

const removeFromCart = (index) => {
  cartItems.value.splice(index, 1)
}

const callWaiter = async () => {
  showWaiterPopup.value = true

  // Получаем номер стола (в реальном приложении он может быть в контексте/store)
  const tableNumber = 5 // Заглушка - номер стола

  try {
    // Вызываем функцию из хука для отправки запроса на сервер
    const result = await callWaiterAPI(tableNumber)

    if (result.success) {
      // Для демонстрации создаем уведомление на странице OrdersPage
      // В реальном приложении это будет приходить через WebSocket
      simulateNewNotification(tableNumber)

      console.log('Официант успешно вызван')
    }
  } catch (error) {
    console.error('Ошибка при вызове официанта:', error)
  }
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

const confirmOrder = () => {
  lastOrder.value = {
    items: [...cartItems.value],
    orderDate: new Date().toLocaleDateString('ru-RU'),
    orderTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    totalQuantity: cartItems.value.reduce((total, item) => total + item.quantity, 0),
    totalPrice: cartItems.value.reduce((total, item) => total + item.price * item.quantity, 0),
  }

  showSuccessNotification.value = true
  showOrderPopup.value = false
  cartItems.value = []
}
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

  <WaiterPopup :show="showWaiterPopup" :is-loading="isWaiterLoading" @close="closeWaiterPopup" />

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
