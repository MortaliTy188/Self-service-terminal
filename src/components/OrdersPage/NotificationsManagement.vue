<template>
  <div class="notifications-management">
    <div class="header">
      <h2>Уведомления</h2>
      <div class="header-actions">
        <span class="notifications-count">
          Всего: {{ allNotifications.length }} | Новых: {{ newNotificationsCount }}
        </span>
        <button
          v-if="newNotificationsCount > 0"
          class="btn-mark-all-read"
          @click="markAllAsRead"
          :disabled="isUpdating"
        >
          Отметить все как прочитанные
        </button>
      </div>
    </div>

    <div class="notifications-filters">
      <button
        :class="['filter-btn', { active: currentFilter === 'all' }]"
        @click="currentFilter = 'all'"
      >
        Все ({{ allNotifications.length }})
      </button>
      <button
        :class="['filter-btn', { active: currentFilter === 'new' }]"
        @click="currentFilter = 'new'"
      >
        Новые ({{ newNotificationsCount }})
      </button>
      <button
        :class="['filter-btn', { active: currentFilter === 'resolved' }]"
        @click="currentFilter = 'resolved'"
      >
        Решенные ({{ getCountByStatus('resolved') }})
      </button>
      <!-- 
      <button
        :class="['filter-btn', { active: currentFilter === 'call_waiter' }]"
        @click="currentFilter = 'call_waiter'"
      >
        Вызов официанта ({{ getCountByType('call_waiter') }})
      </button>
      <button
        :class="['filter-btn', { active: currentFilter === 'payment_request' }]"
        @click="currentFilter = 'payment_request'"
      >
        Запрос оплаты ({{ getCountByType('payment_request') }})
      </button>
      <button
        :class="['filter-btn', { active: currentFilter === 'problem' }]"
        @click="currentFilter = 'problem'"
      >
        Проблемы ({{ getCountByType('problem') }})
      </button>
      -->
    </div>

    <div class="notifications-content">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка уведомлений...</p>
      </div>

      <div v-else-if="filteredNotifications.length === 0" class="empty-state">
        <div class="empty-icon">🔔</div>
        <h3>Нет уведомлений</h3>
        <p>{{ getEmptyMessage() }}</p>
      </div>

      <div v-else class="notifications-list">
        <TransitionGroup name="notification" tag="div">
          <div
            v-for="notification in filteredNotifications"
            :key="notification.id"
            :class="[
              'notification-card',
              `type-${notification.type}`,
              { 'is-new': notification.status === 'new' },
            ]"
          >
            <div class="notification-icon">
              {{ getNotificationIcon(notification.type) }}
            </div>

            <div class="notification-content">
              <div class="notification-header">
                <h4>{{ getNotificationTitle(notification.type) }}</h4>
                <span class="notification-table"
                  >Стол №{{ notification.table_id || notification.tableNumber }}</span
                >
              </div>

              <p class="notification-message">{{ notification.message }}</p>

              <div class="notification-footer">
                <span class="notification-time">
                  {{ formatTime(notification.created_at || notification.timestamp) }}
                </span>
                <span :class="['notification-status', notification.status]">
                  {{ getStatusText(notification.status) }}
                </span>
              </div>
            </div>

            <div class="notification-actions">
              <button
                v-if="notification.status === 'new'"
                class="btn-mark-read"
                @click="markAsRead(notification.id)"
                :disabled="isUpdating"
                title="Отметить как прочитанное"
              >
                ✓
              </button>
              <button
                v-else
                class="btn-mark-new"
                @click="markAsNew(notification.id)"
                :disabled="isUpdating"
                title="Отметить как новое"
              >
                ↺
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWaiterStore } from '@/stores'

const waiterStore = useWaiterStore()

const currentFilter = ref('all')
const isLoading = ref(false)
const isUpdating = ref(false)

// Получаем все уведомления из store
const allNotifications = computed(() => waiterStore.allNotifications || [])

// Количество новых уведомлений
const newNotificationsCount = computed(() => {
  return allNotifications.value.filter((n) => n.status === 'new').length
})

// Фильтрация уведомлений
const filteredNotifications = computed(() => {
  let notifications = allNotifications.value

  if (currentFilter.value === 'new') {
    notifications = notifications.filter((n) => n.status === 'new')
  } else if (currentFilter.value === 'resolved') {
    notifications = notifications.filter((n) => n.status === 'resolved')
  } else if (currentFilter.value !== 'all') {
    // Фильтрация по типу (закомментирована в UI, но оставлена для совместимости)
    notifications = notifications.filter((n) => n.type === currentFilter.value)
  }

  // Сортируем по времени создания (новые первыми)
  return notifications.sort((a, b) => {
    const timeA = new Date(a.created_at || a.timestamp).getTime()
    const timeB = new Date(b.created_at || b.timestamp).getTime()
    return timeB - timeA
  })
})

// Получить количество уведомлений по типу
const getCountByType = (type) => {
  return allNotifications.value.filter((n) => n.type === type).length
}

// Получить количество уведомлений по статусу
const getCountByStatus = (status) => {
  return allNotifications.value.filter((n) => n.status === status).length
}

// Получить иконку для типа уведомления
const getNotificationIcon = (type) => {
  const icons = {
    call_waiter: '🙋',
    payment_request: '💳',
    problem: '⚠️',
  }
  return icons[type] || '🔔'
}

// Получить заголовок для типа уведомления
const getNotificationTitle = (type) => {
  const titles = {
    call_waiter: 'Вызов официанта',
    payment_request: 'Запрос оплаты',
    problem: 'Проблема',
  }
  return titles[type] || 'Уведомление'
}

// Получить текст статуса
const getStatusText = (status) => {
  const statuses = {
    new: 'Новое',
    read: 'Прочитано',
    resolved: 'Решено',
  }
  return statuses[status] || status
}

// Форматирование времени
const formatTime = (timestamp) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // Если меньше минуты
  if (diff < 60000) {
    return 'только что'
  }

  // Если меньше часа
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes} мин. назад`
  }

  // Если сегодня
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  // Если не сегодня
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Сообщение для пустого состояния
const getEmptyMessage = () => {
  if (currentFilter.value === 'new') {
    return 'Все уведомления прочитаны'
  }
  if (currentFilter.value === 'resolved') {
    return 'Нет решенных уведомлений'
  }
  if (currentFilter.value !== 'all') {
    return `Нет уведомлений выбранного типа`
  }
  return 'Уведомлений пока нет'
}

// Отметить уведомление как прочитанное
const markAsRead = async (notificationId) => {
  isUpdating.value = true
  try {
    await waiterStore.updateNotificationStatus(notificationId, 'resolved')
    console.log('✅ Уведомление отмечено как прочитанное:', notificationId)
  } catch (error) {
    console.error('❌ Ошибка при обновлении уведомления:', error)
  } finally {
    isUpdating.value = false
  }
}

// Отметить уведомление как новое
const markAsNew = async (notificationId) => {
  isUpdating.value = true
  try {
    await waiterStore.updateNotificationStatus(notificationId, 'new')
    console.log('✅ Уведомление отмечено как новое:', notificationId)
  } catch (error) {
    console.error('❌ Ошибка при обновлении уведомления:', error)
  } finally {
    isUpdating.value = false
  }
}

// Отметить все как прочитанные
const markAllAsRead = async () => {
  if (!confirm('Отметить все уведомления как прочитанные?')) {
    return
  }

  isUpdating.value = true
  try {
    const newNotifications = allNotifications.value.filter((n) => n.status === 'new')

    await Promise.all(
      newNotifications.map((notification) =>
        waiterStore.updateNotificationStatus(notification.id, 'resolved'),
      ),
    )

    console.log('✅ Все уведомления отмечены как прочитанные')
  } catch (error) {
    console.error('❌ Ошибка при обновлении уведомлений:', error)
  } finally {
    isUpdating.value = false
  }
}

// Загрузка уведомлений при монтировании
onMounted(async () => {
  isLoading.value = true
  try {
    await waiterStore.loadAllNotifications()
    console.log('✅ Уведомления загружены')
  } catch (error) {
    console.error('❌ Ошибка загрузки уведомлений:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.notifications-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.notifications-count {
  font-size: 14px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 6px 12px;
  border-radius: 20px;
}

.btn-mark-all-read {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-mark-all-read:hover:not(:disabled) {
  background: #2563eb;
}

.btn-mark-all-read:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.notifications-filters {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
}

.filter-btn {
  padding: 8px 16px;
  background: #f3f4f6;
  border: 2px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-btn:hover {
  background: #e5e7eb;
}

.filter-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #2563eb;
}

.notifications-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #1f2937;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-card {
  display: flex;
  gap: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #d1d5db;
}

.notification-card.is-new {
  border-left-color: #3b82f6;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.2);
}

.notification-card.type-call_waiter {
  border-left-color: #10b981;
}

.notification-card.type-payment_request {
  border-left-color: #f59e0b;
}

.notification-card.type-problem {
  border-left-color: #ef4444;
}

.notification-icon {
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.notification-table {
  font-size: 14px;
  font-weight: 600;
  color: #3b82f6;
  background: #dbeafe;
  padding: 4px 12px;
  border-radius: 12px;
}

.notification-message {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.notification-footer {
  display: flex;
  gap: 12px;
  align-items: center;
}

.notification-time {
  font-size: 12px;
  color: #9ca3af;
}

.notification-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 8px;
}

.notification-status.new {
  background: #dbeafe;
  color: #1e40af;
}

.notification-status.read {
  background: #f3f4f6;
  color: #6b7280;
}

.notification-status.resolved {
  background: #d1fae5;
  color: #065f46;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-mark-read,
.btn-mark-new {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-mark-read {
  background: #10b981;
  color: white;
}

.btn-mark-read:hover:not(:disabled) {
  background: #059669;
  transform: scale(1.05);
}

.btn-mark-new {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-mark-new:hover:not(:disabled) {
  background: #e5e7eb;
  transform: scale(1.05);
}

.btn-mark-read:disabled,
.btn-mark-new:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Transition анимации */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
