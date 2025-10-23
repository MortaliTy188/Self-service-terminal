<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import {
  useWaiterStore,
  useOrdersStore,
  useMenuStore,
  useDeviceStore,
  useWebSocketStore,
} from '@/stores'
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
const deviceStore = useDeviceStore()
const webSocketStore = useWebSocketStore()

// Local state
const selectedCategory = ref(null) // null означает "Все категории"
const showWaiterPopup = ref(false)
const showOrderPopup = ref(false)
const showOrderDetailsPopup = ref(false)
const showFoodDetailPopup = ref(false)
const showSuccessNotification = ref(false)
const selectedFoodItem = ref(null)
const tableOrders = ref([]) // Заказы для текущего стола

// Computed values from stores
const cartItems = computed(() => ordersStore.cartItems)
const lastOrder = computed(() => ordersStore.lastOrder)
const isWaiterLoading = computed(() => waiterStore.isLoading)

// Номер стола из устройства
const tableNumber = computed(() => {
  if (deviceStore.shortId) {
    return `Стол ${deviceStore.shortId}`
  }
  return 'Номер стола'
})

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
    return
  }

  // Обработка данных от других компонентов
  if (eventData.cartData) {
    // Обновляем корзину данными с сервера
    ordersStore.updateCartFromServer(eventData.cartData)
  } else {
    // Локальное добавление в корзину
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
    await ordersStore.addToCartServer(item.id, 1)
  } catch (error) {
    console.error('Ошибка добавления товара:', error)
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
          await ordersStore.addToCartServer(cartItem.id, cartItem.quantity - 1)
        }
      } catch (error) {
        console.error('Ошибка изменения количества:', error)
      }
    } else {
      // Если количество равно 1, удаляем товар полностью
      try {
        await ordersStore.removeFromCartServer(cartItem.id)
      } catch (error) {
        console.error('Ошибка удаления товара:', error)
      }
    }
  }
}

const removeFromCart = async (index) => {
  const cartItem = cartItems.value[index]
  if (cartItem) {
    try {
      await ordersStore.removeFromCartServer(cartItem.id)
    } catch (error) {
      console.error('Ошибка удаления товара:', error)
    }
  }
}

const callWaiter = async () => {
  showWaiterPopup.value = true

  // Получаем номер стола устройства
  const tableNumber = deviceStore.shortId
  const message = `Требуется обслуживание стола ${tableNumber}`

  console.log('🔔 Вызываем официанта для стола:', tableNumber)

  // Вызываем официанта через API
  const result = await waiterStore.callWaiter(tableNumber, message)

  if (!result.success) {
    console.error('Ошибка при вызове официанта:', result.error)
  }

  // Закрываем popup через 3 секунды
  setTimeout(() => {
    showWaiterPopup.value = false
  }, 3000)
}

const handleCallWaiter = async (reason, tableNumber = 5) => {
  await waiterStore.callWaiter(tableNumber, reason)
  showWaiterPopup.value = false
}

const closeWaiterPopup = () => {
  showWaiterPopup.value = false
}

const showOrderDetails = async () => {
  try {
    if (deviceStore.shortId) {
      const orders = await ordersStore.fetchOrdersByTable(deviceStore.shortId)
      tableOrders.value = Array.isArray(orders) ? orders : []
    } else {
      tableOrders.value = []
    }

    showOrderDetailsPopup.value = true
  } catch (error) {
    console.error('Ошибка загрузки заказов стола:', error)
    tableOrders.value = []
    showOrderDetailsPopup.value = true
  }
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
    tableNumber: orderData?.tableNumber,
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

  // Подключаем WebSocket для получения обновлений в реальном времени
  console.log('🔌 Подключение WebSocket на главной странице...')
  webSocketStore.connect()
})

// Очистка при размонтировании
onUnmounted(() => {
  console.log('🔌 Отключение WebSocket на главной странице...')
  webSocketStore.disconnect()
})
</script>

<template>
  <AppHeader title="Меню" :table-number="tableNumber" />
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
    :table-orders="tableOrders"
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
