<template>
  <div class="container-right-body">
    <div v-if="isLoading" class="loading">Загрузка заказов...</div>
    <div v-else-if="error" class="error">Ошибка: {{ error }}</div>
    <table v-else class="orders-table">
      <thead>
        <tr class="table-header">
          <th>#</th>
          <th>Время заказа</th>
          <th>Вид заказа</th>
          <th>Номер стола</th>
          <th>История заказа</th>
          <th>Статус</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="orders.length === 0" class="empty-row">
          <td colspan="7">Нет заказов для отображения</td>
        </tr>
        <tr v-else v-for="order in orders" :key="order.id" class="table-row">
          <td>{{ formatOrderNumber(order.id) }}</td>
          <td>{{ order.orderTime }}</td>
          <td>{{ order.orderType }}</td>
          <td>{{ order.tableNumber }}</td>
          <td>{{ order.items }}</td>
          <td>
            <span
              class="status"
              :class="{
                preparing: order.status === 'preparing',
                ready: order.status === 'ready',
                completed: order.status === 'completed',
                cancelled: order.status === 'cancelled',
              }"
            >
              {{ getStatusText(order.status) }}
            </span>
          </td>
          <td class="actions-cell">
            <div class="action-buttons">
              <button
                v-if="order.status === 'preparing'"
                @click="updateOrderStatus(order.id, 'ready')"
                class="btn-ready"
                title="Отметить как готов к выдаче"
              >
                Готов
              </button>
              <button
                v-if="order.status === 'ready'"
                @click="updateOrderStatus(order.id, 'completed')"
                class="btn-completed"
                title="Отметить как выполненный"
              >
                Выдан
              </button>
              <button
                v-if="order.status === 'preparing' || order.status === 'ready'"
                @click="updateOrderStatus(order.id, 'cancelled')"
                class="btn-cancelled"
                title="Отменить заказ"
              >
                Отменить
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { useApiConfigStore } from '@/stores'
import { formatOrderNumber } from '@/utils/orderUtils'

const apiConfigStore = useApiConfigStore()

const props = defineProps({
  orders: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['order-updated'])

// Функция для получения текста статуса
const getStatusText = (status) => {
  const statusMap = {
    preparing: 'Готовится',
    ready: 'Готов к выдаче',
    completed: 'Выполнено',
    cancelled: 'Отменен',
  }
  return statusMap[status] || status
}

// Функция для обновления статуса заказа
const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const response = await fetch(apiConfigStore.getSecureUrl(`/orders/${orderId}/status`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: newStatus,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('Статус заказа успешно обновлен:', result)

    // Эмитим событие для обновления данных в родительском компоненте
    emit('order-updated', orderId, newStatus)

    // Показываем уведомление об успехе
    const statusTexts = {
      ready: 'готов к выдаче',
      completed: 'выполнен',
      cancelled: 'отменен',
    }
    alert(`Заказ ${formatOrderNumber(orderId)} отмечен как ${statusTexts[newStatus]}`)
  } catch (error) {
    console.error('Ошибка при обновлении статуса заказа:', error)
    alert(`Ошибка при обновлении статуса: ${error.message}`)
  }
}
</script>

<style scoped>
.container-right-body {
  flex: 1;
  padding-bottom: 40px;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-header {
  background-color: #e9e9e9;
  font-weight: bold;
}

.table-header th {
  padding: 15px 10px;
  text-align: center;
  font-size: 16px;
  border-right: 1px solid #ccc;
  vertical-align: middle;
}

.table-header th:last-child {
  border-right: none;
}

.table-header th:nth-child(1) {
  width: 60px;
}

.table-header th:nth-child(2) {
  width: 120px;
}

.table-header th:nth-child(3) {
  width: 120px;
}

.table-header th:nth-child(4) {
  width: 120px;
}

.table-header th:nth-child(5) {
  width: 300px;
}

.table-header th:nth-child(6) {
  width: 120px;
}

.table-row {
  border-bottom: 1px solid #ddd;
  transition: background-color 0.3s;
}

.table-row:hover {
  background-color: #f5f5f5;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row td {
  padding: 15px 10px;
  text-align: center;
  font-size: 14px;
  border-right: 1px solid #ddd;
  vertical-align: middle;
}

.table-row td:last-child {
  border-right: none;
}

.table-row td:first-child {
  font-weight: bold;
}

.status {
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  display: inline-block;
  min-width: 120px;
  text-align: center;
  box-sizing: border-box;
}

.status.preparing {
  background-color: #fff3e0;
  color: #e65100;
  border: 1px solid #ffcc02;
}

.status.ready {
  background-color: #e3f2fd;
  color: #0d47a1;
  border: 1px solid #2196f3;
}

.status.completed {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status.cancelled {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.loading,
.error {
  text-align: center;
  padding: 40px 20px;
  font-size: 18px;
  color: #666;
}

.error {
  color: #d32f2f;
  background: #ffebee;
  border-radius: 8px;
  border: 1px solid #ffcdd2;
}

.empty-row td {
  text-align: center;
  padding: 40px 20px;
  font-style: italic;
  color: #666;
}

/* Стили для кнопок действий */
.actions-cell {
  min-width: 200px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-buttons button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 70px;
}

.btn-ready {
  background: #2196f3;
  color: white;
}

.btn-ready:hover {
  background: #1976d2;
}

.btn-completed {
  background: #4caf50;
  color: white;
}

.btn-completed:hover {
  background: #388e3c;
}

.btn-cancelled {
  background: #f44336;
  color: white;
}

.btn-cancelled:hover {
  background: #d32f2f;
}

.action-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
