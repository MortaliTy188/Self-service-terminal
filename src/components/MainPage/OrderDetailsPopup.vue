<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  cartItems: {
    type: Array,
    default: () => [],
  },
  lastOrder: {
    type: Object,
    default: null,
  },
  tableOrders: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close'])

const closePopup = () => {
  emit('close')
}

// Разделяем заказы на основной и дополнительные
const ordersData = computed(() => {
  if (props.tableOrders && props.tableOrders.length > 0) {
    // Основной заказ - это первый заказ (orderType: "Основной заказ")
    const mainOrder =
      props.tableOrders.find((order) => order.orderType === 'Основной заказ') ||
      props.tableOrders[0]
    // Дополнительные заказы - все остальные
    const additionalOrders = props.tableOrders.filter((order) => order.id !== mainOrder.id)

    return {
      mainOrder,
      additionalOrders,
      isTableOrders: true,
    }
  } else if (props.lastOrder && props.lastOrder.items && props.lastOrder.items.length > 0) {
    return {
      mainOrder: props.lastOrder,
      additionalOrders: [],
      isTableOrders: false,
    }
  } else {
    return {
      mainOrder: {
        cartItems: props.cartItems,
        totalQuantity: props.cartItems.reduce((total, item) => total + item.quantity, 0),
        totalPrice: props.cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
      },
      additionalOrders: [],
      isTableOrders: false,
    }
  }
})

// Функция для получения статуса с цветом
const getStatusBadge = (status) => {
  const statusMap = {
    pending: { text: 'Ожидает', class: 'status-pending' },
    preparing: { text: 'Готовится', class: 'status-preparing' },
    ready: { text: 'Готов', class: 'status-ready' },
    completed: { text: 'Завершен', class: 'status-completed' },
    cancelled: { text: 'Отменен', class: 'status-cancelled' },
  }
  return statusMap[status] || { text: status, class: 'status-unknown' }
}

// Функция для форматирования времени заказа
const formatOrderTime = (order) => {
  if (order.orderDate && order.orderTime) {
    return `${order.orderDate} в ${order.orderTime}`
  } else if (order.orderTime) {
    return `${order.orderTime}`
  } else if (order.createdAt) {
    // Форматируем из ISO даты
    const date = new Date(order.createdAt)
    const dateStr = date.toLocaleDateString('ru-RU')
    const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    return `${dateStr} в ${timeStr}`
  }
  return 'Время не указано'
}

// Функция для парсинга строки товаров в массив
const parseItemsString = (itemsString, totalPrice) => {
  if (!itemsString || typeof itemsString !== 'string') return []

  // Парсим строку типа "4x Куксу" или "2x Бургер, 1x Кола"
  const items = itemsString.split(',').map((item) => item.trim())
  const parsedItems = []

  items.forEach((item) => {
    // Ищем паттерн "количествоx название"
    const match = item.match(/^(\d+)x\s*(.+)$/)
    if (match) {
      const quantity = parseInt(match[1])
      const name = match[2].trim()

      // Если общая цена есть и это единственный товар, используем её
      const itemPrice = items.length === 1 && totalPrice ? Math.round(totalPrice / quantity) : 0

      parsedItems.push({
        name,
        quantity,
        price: itemPrice,
        total: itemPrice * quantity,
      })
    } else {
      // Если не удалось распарсить, добавляем как есть
      parsedItems.push({
        name: item,
        quantity: 1,
        price: totalPrice || 0,
        total: totalPrice || 0,
      })
    }
  })

  return parsedItems
}

// Функция для получения товаров заказа
const getOrderItems = (order) => {
  // Сначала пытаемся использовать cartItems, если они есть и не пустые
  if (order.cartItems && Array.isArray(order.cartItems) && order.cartItems.length > 0) {
    return order.cartItems.filter((item) => item.name || item.title)
  }

  // Если cartItems нет, парсим строку items
  if (order.items && typeof order.items === 'string') {
    return parseItemsString(order.items, order.totalPrice)
  }

  return []
}
</script>

<template>
  <div v-if="show" class="popup-overlay" @click="closePopup">
    <div class="popup-container" @click.stop>
      <div class="popup-header">
        <h2>
          {{
            ordersData.isTableOrders
              ? 'Заказы стола'
              : ordersData.mainOrder.items
                ? 'Детали заказа'
                : 'Корзина'
          }}
        </h2>
        <div v-if="ordersData.isTableOrders && ordersData.mainOrder.tableNumber" class="order-info">
          <p class="table-number">Стол № {{ ordersData.mainOrder.tableNumber }}</p>
        </div>
      </div>

      <div class="popup-body">
        <!-- Основной заказ -->
        <div v-if="ordersData.mainOrder" class="order-section">
          <div class="section-header">
            <h3>{{ ordersData.isTableOrders ? 'Основной заказ' : 'Заказ' }}</h3>
            <div v-if="ordersData.isTableOrders" class="order-meta">
              <span class="order-time">{{ formatOrderTime(ordersData.mainOrder) }}</span>
              <span :class="['status-badge', getStatusBadge(ordersData.mainOrder.status).class]">
                {{ getStatusBadge(ordersData.mainOrder.status).text }}
              </span>
            </div>
          </div>

          <div class="order-items">
            <div v-if="getOrderItems(ordersData.mainOrder).length > 0">
              <div
                v-for="(item, index) in getOrderItems(ordersData.mainOrder)"
                :key="index"
                class="order-item"
              >
                <div class="item-info">
                  <span class="item-name">{{
                    item.name || item.title || 'Неизвестный товар'
                  }}</span>
                  <span class="item-details"
                    >{{ item.qty || item.quantity || 1 }} шт.{{
                      (item.unit_price || item.price) > 0
                        ? ` × ${item.unit_price || item.price}₽`
                        : ''
                    }}</span
                  >
                </div>
                <div class="item-total">
                  {{
                    (item.unit_price || item.price) > 0
                      ? (item.qty || item.quantity || 1) * (item.unit_price || item.price) + '₽'
                      : ''
                  }}
                </div>
              </div>
            </div>
            <div v-else class="empty-order">Нет товаров в заказе</div>
          </div>

          <div class="order-summary">
            <div class="summary-line total-price">
              <span>Сумма:</span>
              <span class="summary-value">{{ ordersData.mainOrder.totalPrice }}₽</span>
            </div>
          </div>
        </div>

        <!-- Дополнительные заказы -->
        <div
          v-if="ordersData.additionalOrders && ordersData.additionalOrders.length > 0"
          class="order-section"
        >
          <div class="section-header">
            <h3>Дополнительные заказы</h3>
          </div>

          <div
            v-for="(order, orderIndex) in ordersData.additionalOrders"
            :key="order.id"
            class="additional-order"
          >
            <div class="additional-order-header">
              <span class="order-time">{{ formatOrderTime(order) }}</span>
              <span :class="['status-badge', getStatusBadge(order.status).class]">
                {{ getStatusBadge(order.status).text }}
              </span>
            </div>

            <div class="order-items">
              <div v-if="getOrderItems(order).length > 0">
                <div v-for="(item, index) in getOrderItems(order)" :key="index" class="order-item">
                  <div class="item-info">
                    <span class="item-name">{{
                      item.name || item.title || 'Неизвестный товар'
                    }}</span>
                    <span class="item-details"
                      >{{ item.qty || item.quantity || 1 }} шт.{{
                        (item.unit_price || item.price) > 0
                          ? ` × ${item.unit_price || item.price}₽`
                          : ''
                      }}</span
                    >
                  </div>
                  <div class="item-total">
                    {{
                      (item.unit_price || item.price) > 0
                        ? (item.qty || item.quantity || 1) * (item.unit_price || item.price) + '₽'
                        : ''
                    }}
                  </div>
                </div>
              </div>
              <div v-else class="empty-order">Нет товаров в заказе</div>
            </div>

            <div class="order-summary">
              <div class="summary-line total-price">
                <span>Сумма:</span>
                <span class="summary-value">{{ order.totalPrice }}₽</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Общая сумма если есть несколько заказов -->
        <div
          v-if="ordersData.additionalOrders && ordersData.additionalOrders.length > 0"
          class="total-summary"
        >
          <div class="summary-line grand-total">
            <span>ОБЩАЯ СУММА:</span>
            <span class="summary-value">
              {{
                (ordersData.mainOrder?.totalPrice || 0) +
                ordersData.additionalOrders.reduce(
                  (sum, order) => sum + (order.totalPrice || 0),
                  0,
                )
              }}₽
            </span>
          </div>
        </div>
      </div>

      <div class="popup-footer">
        <button class="close-button" @click="closePopup">Закрыть</button>
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
  max-height: 80vh;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  cursor: default;
  display: flex;
  flex-direction: column;
}

.popup-header {
  padding: 25px 30px 20px;
  border-bottom: 2px solid #f0f0f0;
  text-align: center;
}

.popup-header h2 {
  color: #333;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.order-info {
  margin-top: 10px;
}

.table-number {
  color: #666;
  font-size: 16px;
  margin: 0;
  font-weight: 500;
}

.order-date {
  color: #666;
  font-size: 14px;
  margin: 0;
  font-style: italic;
}

.popup-body {
  flex: 1;
  padding: 20px 30px;
  overflow-y: auto;
}

.order-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
}

.order-section:last-of-type {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: bold;
}

.order-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-time {
  color: #666;
  font-size: 14px;
}

.additional-order {
  margin-bottom: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.additional-order:last-child {
  margin-bottom: 0;
}

.additional-order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-preparing {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.status-ready {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-completed {
  background-color: #e2e3e5;
  color: #495057;
  border: 1px solid #ced4da;
}

.status-cancelled {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-unknown {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.empty-order {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 20px;
}

.total-summary {
  margin-top: 20px;
  padding: 20px;
  background-color: #f0f8ff;
  border-radius: 10px;
  border: 2px solid #007bff;
}

.grand-total {
  font-size: 18px;
  font-weight: bold;
  color: #007bff;
}

.order-items {
  margin-bottom: 30px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.order-item:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.item-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.item-details {
  font-size: 14px;
  color: #666;
}

.item-total {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-left: 15px;
}

.order-summary {
  border-top: 2px solid #f0f0f0;
  padding-top: 20px;
  margin-top: 20px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 16px;
}

.summary-line:first-child {
  margin-bottom: 10px;
}

.summary-label {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.summary-value {
  font-weight: bold;
  color: #333;
}

.total-price {
  border-top: 1px solid #ddd;
  padding-top: 15px;
  margin-top: 10px;
  font-size: 18px;
  font-weight: bold;
}

.total-price .summary-value {
  color: #2196f3;
  font-size: 20px;
}

.popup-footer {
  padding: 20px 30px 25px;
  border-top: 2px solid #f0f0f0;
  display: flex;
  justify-content: center;
}

.close-button {
  padding: 15px 40px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  background-color: #2196f3;
  color: white;
  transition: all 0.3s ease;
}

.close-button:hover {
  background-color: #1976d2;
}

@media (max-width: 768px) {
  .popup-container {
    margin: 20px;
    max-height: 90vh;
  }

  .popup-header,
  .popup-body,
  .popup-footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .popup-header h2 {
    font-size: 20px;
  }
}
</style>
