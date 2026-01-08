<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import officiantIcon from '@/assets/officiant_icon.svg'
import {
  useWaiterStore,
  useOrdersStore,
  useMenuStore,
  useDeviceStore,
  useWebSocketStore,
  useSettingsStore,
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
  OrderRecommendationsPopup,
} from '@/components/MainPage'

// Pinia stores
const waiterStore = useWaiterStore()
const ordersStore = useOrdersStore()
const menuStore = useMenuStore()
const deviceStore = useDeviceStore()
const webSocketStore = useWebSocketStore()
const settingsStore = useSettingsStore()

// Local state
const selectedCategory = ref(null) // null означает "Все категории"
const showWaiterPopup = ref(false)
const showOrderPopup = ref(false)
const showOrderDetailsPopup = ref(false)
const showFoodDetailPopup = ref(false)
const showSuccessNotification = ref(false)
const showRecommendationsPopup = ref(false)
const selectedFoodItem = ref(null)
const tableOrders = ref([]) // Заказы для текущего стола

// Computed values from stores
const cartItems = computed(() => ordersStore.cartItems)
const lastOrder = computed(() => ordersStore.lastOrder)
const isWaiterLoading = computed(() => waiterStore.isLoading)

// Номер стола из устройства
const tableNumber = computed(() => {
  if (deviceStore.shortId) {
    return `Стол #${deviceStore.shortId}`
  }
  return 'Стол #—'
})

const language = computed({
  get: () => settingsStore.systemSettings.language,
  set: (value) => settingsStore.updateSystemSettings({ language: value }),
})

// Event handlers
const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
  if (categoryId === '__PROMO__') {
    // Специальный фильтр "Акции" — не категория
    menuStore.clearCategoryFilter()
    return
  }

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

const closeRecommendationsPopup = () => {
  showRecommendationsPopup.value = false
}

const confirmOrderFromRecommendations = async () => {
  // Закрываем модалку с рекомендациями
  showRecommendationsPopup.value = false

  // Открываем стандартную модалку подтверждения заказа
  showOrderPopup.value = true
}

const makeOrder = () => {
  // Открываем модалку с рекомендациями вместо обычной модалки заказа
  showRecommendationsPopup.value = true
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

  // Подключаем WebSocket для обновления меню в реальном времени
  console.log('🔌 Подключение WebSocket меню на главной странице...')
  webSocketStore.connectMenuSocket()

  // Подключаем WebSocket для обновления изображений
  console.log('🔌 Подключение WebSocket изображений на главной странице...')
  webSocketStore.connectImagesSocket()
})

// Очистка при размонтировании
onUnmounted(() => {
  console.log('🔌 Отключение WebSocket на главной странице...')
  webSocketStore.disconnect()
  webSocketStore.disconnectMenuSocket()
  webSocketStore.disconnectImagesSocket()
})
</script>

<template>
  <div class="main-page">
    <header class="main-page__header">
      <div class="main-page__table-number">{{ tableNumber }}</div>
      <div class="main-page__header-right">
        <button class="main-page__waiter-button" type="button" @click="callWaiter">
          <img class="main-page__waiter-icon" :src="officiantIcon" alt="" aria-hidden="true" />
          Вызвать официанта
        </button>
        <select v-model="language" class="main-page__language-select" aria-label="Выбор языка">
          <option value="ru">🇷🇺 RU</option>
          <option value="en">🇬🇧 EN</option>
        </select>
      </div>
    </header>

    <main>
      <div class="main-container">
        <section class="menu-container">
          <div class="menu-container__categories">
            <CategoryList :selected-category="selectedCategory" @select-category="selectCategory" />
          </div>
          <div class="menu-container__foods">
            <FoodGrid :selected-category="selectedCategory" @show-detail="showFoodDetail" />
          </div>

          <!-- временно скрыто, но оставлено для логики (детали заказа) -->
          <BottomControls @show-order-details="showOrderDetails" />
        </section>
        <ShoppingCart
          :cart-items="cartItems"
          @add-quantity="addQuantity"
          @remove-quantity="removeQuantity"
          @remove-from-cart="removeFromCart"
          @make-order="makeOrder"
        />
      </div>
    </main>
  </div>

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

  <OrderRecommendationsPopup
    :show="showRecommendationsPopup"
    :cart-items="cartItems"
    @close="closeRecommendationsPopup"
    @confirm-order="confirmOrderFromRecommendations"
  />
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.main-page {
  background: #f5f4f2;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 20px;
  min-height: 100vh;
}

.main-page__header {
  background: #ffffff;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 20px;
  margin-bottom: 20px;
}

.main-page__table-number {
  font-size: 42px;
  line-height: 120%;
  font-weight: bold;
  color: #151515;
}

.main-page__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-page__waiter-button {
  width: 278px;
  height: 45px;
  padding: 10px 20px;
  background: #f5f4f2;
  border: none;
  border-radius: 10px;
  color: #151515;
  font-size: 19px;
  line-height: 120%;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.main-page__waiter-icon {
  width: 20px;
  height: 20px;
  flex: none;
}

.main-page__language-select {
  height: 45px;
  width: 80px;
  padding: 10px 12px;
  background: #f5f4f2;
  border: none;
  border-radius: 12px;
  color: #151515;
  font-size: 16px;
}

.main-container {
  display: flex;
  padding: 0;
  height: 85vh;
  overflow: hidden;
  gap: 25px;
}

.menu-container {
  display: flex;
  flex-direction: column;
  flex: 3;
  min-width: 0;
  height: 100%;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
}

.menu-container__categories {
  flex: none;
}

.menu-container__foods {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

@media screen and (max-width: 1115px) {
  .main-container {
    padding: 18px 18px;
    gap: 18px;
  }

  .main-container-left {
    gap: 18px;
  }

  .main-container-left-top {
    gap: 18px;
  }
}

/* @media screen and (max-width: 1280px) {
  .main-container {
    padding-bottom: 75px;
  }
} */

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
  background: transparent;
  min-height: 85vh;
}

@media screen and (max-width: 800px) {
  .main-container {
    flex-direction: column;
    height: auto;
    padding: 16px 14px;
    gap: 16px;
  }

  .main-container-left {
    flex: unset;
    width: 100%;
    gap: 16px;
  }

  .main-container-left-top {
    flex-direction: column;
    gap: 16px;
    height: auto;
  }

  main {
    min-height: 100vh;
  }
}
</style>
