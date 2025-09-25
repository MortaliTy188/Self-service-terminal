<script setup>
import { ref, computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import CategoryList from '../components/CategoryList.vue'
import FoodGrid from '../components/FoodGrid.vue'
import ShoppingCart from '../components/ShoppingCart.vue'
import BottomControls from '../components/BottomControls.vue'
import WaiterPopup from '../components/WaiterPopup.vue'
import OrderPopup from '../components/OrderPopup.vue'
import FoodDetailPopup from '../components/FoodDetailPopup.vue'
import OrderDetailsPopup from '../components/OrderDetailsPopup.vue'
import SuccessNotification from '../components/SuccessNotification.vue'

const cartItems = ref([])
const lastOrder = ref(null)
const selectedCategory = ref('Все категории')
const showWaiterPopup = ref(false)
const showOrderPopup = ref(false)
const showOrderDetailsPopup = ref(false)
const showFoodDetailPopup = ref(false)
const showSuccessNotification = ref(false)
const selectedFoodItem = ref(null)
const categories = ref([
  'Все категории',
  'Суши',
  'Пицца',
  'Вок',
  'Десерты',
  'Напитки',
  'Закуски',
  'Пример1',
  'Пример2',
  'Пример3',
])
const categoryItems = ref([
  {
    category: 'Суши',
    items: [
      { title: 'Суши с лососем', price: 600 },
      { title: 'Суши с тунцом', price: 650 },
      { title: 'Филадельфия', price: 700 },
      { title: 'Калифорния', price: 650 },
    ],
  },
  {
    category: 'Пицца',
    items: [
      { title: 'Пепперони', price: 700 },
      { title: 'Маргарита', price: 650 },
      { title: 'Четыре сыра', price: 750 },
      { title: 'Гавайская', price: 700 },
    ],
  },
  {
    category: 'Вок',
    items: [
      { title: 'Вок с курицей', price: 500 },
      { title: 'Вок с говядиной', price: 550 },
      { title: 'Вок с морепродуктами', price: 600 },
      { title: 'Вок с овощами', price: 450 },
    ],
  },
  {
    category: 'Десерты',
    items: [
      { title: 'Тирамису', price: 300 },
      { title: 'Чизкейк', price: 350 },
      { title: 'Мороженое', price: 200 },
      { title: 'Шоколадный торт', price: 400 },
    ],
  },
  {
    category: 'Напитки',
    items: [
      { title: 'Кока-кола', price: 150 },
      { title: 'Сок апельсиновый', price: 180 },
      { title: 'Чай зеленый', price: 120 },
      { title: 'Кофе американо', price: 200 },
    ],
  },
])

const filteredItems = computed(() => {
  if (selectedCategory.value === 'Все категории') {
    return categoryItems.value.flatMap((category) => category.items)
  } else {
    const category = categoryItems.value.find((cat) => cat.category === selectedCategory.value)
    return category ? category.items : []
  }
})

const selectCategory = (category) => {
  selectedCategory.value = category
}

const addToCart = (itemData) => {
  const existingItem = cartItems.value.find((cartItem) => cartItem.title === itemData.title)

  if (existingItem) {
    existingItem.quantity += itemData.quantity || 1
  } else {
    cartItems.value.push({ ...itemData, quantity: itemData.quantity || 1 })
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
  const cartItem = cartItems.value.find((i) => i.title === item.title)
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

const callWaiter = () => {
  showWaiterPopup.value = true
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
          <CategoryList
            :categories="categories"
            :selected-category="selectedCategory"
            @select-category="selectCategory"
          />
          <FoodGrid :items="filteredItems" @show-detail="showFoodDetail" />
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

  <WaiterPopup :show="showWaiterPopup" @close="closeWaiterPopup" />

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
