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
        </tr>
      </thead>
      <tbody>
        <tr v-if="orders.length === 0" class="empty-row">
          <td colspan="6">Нет заказов для отображения</td>
        </tr>
        <tr v-else v-for="order in orders" :key="order.id" class="table-row">
          <td>{{ order.id }}</td>
          <td>{{ order.orderTime }}</td>
          <td>{{ order.orderType }}</td>
          <td>{{ order.tableNumber }}</td>
          <td>{{ order.items }}</td>
          <td>
            <span
              class="status"
              :class="{
                pending: order.status === 'pending',
                completed: order.status === 'completed',
              }"
            >
              {{ getStatusText(order.status) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
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

// Функция для получения текста статуса
const getStatusText = (status) => {
  const statusMap = {
    pending: 'В ожидании',
    completed: 'Выполнено',
    cancelled: 'Отменен',
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.container-right-body {
  flex: 1;
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
}

.status.pending {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status.completed {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
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
</style>
