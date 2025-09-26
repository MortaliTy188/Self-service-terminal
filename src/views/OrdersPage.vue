<template>
  <div class="container">
    <LeftSidebar :active-tab="activeTab" @refresh="refreshPage" @tab-change="handleTabChange" />
    <div class="container-right">
      <!-- Вкладка заказов -->
      <template v-if="activeTab === 'orders'">
        <OrderFilters
          :active-filter="activeFilter"
          :filters="orderFilters"
          @filter-change="setFilter"
        />
        <OrdersTable :orders="filteredOrders" :is-loading="isLoading" :error="error" />
      </template>

      <!-- Вкладка меню -->
      <template v-if="activeTab === 'menu'">
        <OrderFilters
          :active-filter="activeMenuFilter"
          :filters="menuFilters"
          @filter-change="setMenuFilter"
        />
        <MenuManagement
          :menu-items="filteredMenuItems"
          :is-loading="isMenuLoading"
          :error="menuError"
          @edit-item="handleEditItem"
          @toggle-status="handleToggleItemStatus"
          @add-item="handleAddItem"
          @save-item="handleSaveItem"
          @retry="loadMenuData"
        />
      </template>

      <!-- Заглушки для других вкладок -->
      <template v-if="activeTab === 'devices'">
        <div class="placeholder">
          <h2>Устройства</h2>
          <p>Функционал в разработке</p>
        </div>
      </template>

      <template v-if="activeTab === 'settings'">
        <div class="placeholder">
          <h2>Настройки</h2>
          <p>Функционал в разработке</p>
        </div>
      </template>
    </div>
  </div>

  <!-- Popup уведомления о вызове официанта -->
  <WaiterNotificationPopup
    :show="showNotificationPopup"
    :notification="currentNotification"
    @close="closeNotificationPopup"
    @resolve="resolveNotification"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useOrders, useWaiterNotifications, useMenu, useCategories } from '@/hooks'
import {
  LeftSidebar,
  OrderFilters,
  OrdersTable,
  WaiterNotificationPopup,
  MenuManagement,
} from '@/components/OrdersPage'

// Используем композицию для работы с заказами
const { orders, isLoading, error, fetchOrders } = useOrders()

// Используем композицию для работы с меню
const { menu: menuItems, isLoading: isMenuLoading, error: menuError, fetchMenu } = useMenu()

// Используем композицию для работы с категориями
const { categories, fetchCategories } = useCategories()

// Используем композицию для работы с уведомлениями официанта
const { notifications, fetchWaiterNotifications, markNotificationAsResolved } =
  useWaiterNotifications()

// Активная вкладка
const activeTab = ref('orders')

// Активные фильтры
const activeFilter = ref('all')
const activeMenuFilter = ref('all')

// Конфигурация фильтров для переиспользуемого компонента
const orderFilters = computed(() => {
  const items = orders.value || []

  return [
    {
      value: 'all',
      label: 'Все заказы',
      icon: '📋',
      count: items.length,
    },
    {
      value: 'pending',
      label: 'В ожидании',
      icon: '⏳',
      count: items.filter((order) => order.status === 'pending').length,
      class: { 'status-pending': true },
    },
    {
      value: 'completed',
      label: 'Выполненные',
      icon: '✅',
      count: items.filter((order) => order.status === 'completed').length,
      class: { 'status-completed': true },
    },
  ]
})

// Конфигурация фильтров меню
const menuFilters = computed(() => {
  // Дополнительная защита от undefined
  if (!menuItems || !categories) {
    return [
      {
        value: 'all',
        label: 'Все товары',
        icon: '🍽️',
        count: 0,
      },
    ]
  }

  const items = menuItems.value || []
  const cats = categories.value || []

  return [
    {
      value: 'all',
      label: 'Все товары',
      icon: '🍽️',
      count: items.length,
    },
    ...cats.map((category) => ({
      value: category.id,
      label: category.name,
      count: items.filter((item) => item.category_id === category.id).length,
    })),
    {
      value: 'active',
      label: 'Активные',
      icon: '✅',
      count: items.filter((item) => item.isActive !== false).length,
    },
    {
      value: 'inactive',
      label: 'Неактивные',
      icon: '⛔',
      count: items.filter((item) => item.isActive === false).length,
    },
  ]
})

// Состояние popup уведомления
const showNotificationPopup = ref(false)
const currentNotification = ref({})

// Функции для смены фильтров
const setFilter = (filter) => {
  activeFilter.value = filter
}

const setMenuFilter = (filter) => {
  activeMenuFilter.value = filter
}

// Функция для смены вкладки
const handleTabChange = (tab) => {
  activeTab.value = tab

  // Загружаем данные для выбранной вкладки
  if (tab === 'menu') {
    loadMenuData()
  }
}

// Отфильтрованные заказы
const filteredOrders = computed(() => {
  const items = orders.value || []
  if (activeFilter.value === 'all') {
    return items
  }
  return items.filter((order) => order.status === activeFilter.value)
})

// Отфильтрованные товары меню
const filteredMenuItems = computed(() => {
  // Защита от undefined
  if (!menuItems) {
    return []
  }

  const items = menuItems.value || []

  if (activeMenuFilter.value === 'all') {
    return items
  } else if (activeMenuFilter.value === 'active') {
    return items.filter((item) => item.isActive !== false)
  } else if (activeMenuFilter.value === 'inactive') {
    return items.filter((item) => item.isActive === false)
  } else {
    // Фильтр по категории
    return items.filter((item) => item.category_id === activeMenuFilter.value)
  }
})

// Функция загрузки данных меню
const loadMenuData = async () => {
  try {
    await fetchMenu()
  } catch (error) {
    console.error('Ошибка загрузки меню:', error)
  }
}

// Функция обновления страницы
const refreshPage = () => {
  fetchOrders()
  fetchWaiterNotifications()
  if (activeTab.value === 'menu') {
    fetchCategories()
    loadMenuData()
  }
}

// Обработчики для управления меню
const handleEditItem = (item) => {
  console.log('Редактирование товара:', item)
  // Здесь будет логика открытия модалки редактирования
}

const handleToggleItemStatus = async (itemId, isActive) => {
  console.log('Изменение статуса товара:', itemId, isActive)
  // Здесь будет API вызов для изменения статуса товара

  // Заглушка - обновляем локально
  const items = menuItems.value || []
  const item = items.find((item) => item.id === itemId)
  if (item) {
    item.isActive = isActive
  }
}

const handleAddItem = () => {
  console.log('Добавление нового товара')
  // Здесь будет логика открытия модалки создания товара
}

const handleSaveItem = async (itemData, isEditMode) => {
  console.log('Сохранение товара:', { itemData, isEditMode })

  try {
    if (isEditMode) {
      // Редактирование существующего товара
      console.log('Обновление товара ID:', itemData.id)
      // Здесь будет API вызов для обновления товара
      // await updateMenuItem(itemData.id, itemData)

      // Временно обновляем локальные данные
      const itemIndex = menuItems.value.findIndex((item) => item.id === itemData.id)
      if (itemIndex !== -1) {
        menuItems.value[itemIndex] = { ...itemData }
      }
    } else {
      // Добавление нового товара
      console.log('Создание нового товара')
      // Здесь будет API вызов для создания товара
      // const newItem = await createMenuItem(itemData)

      // Временно добавляем к локальным данным с новым ID
      const newItem = {
        ...itemData,
        id: Date.now(), // Временный ID
      }
      menuItems.value.push(newItem)
    }

    console.log('Товар успешно сохранен')
  } catch (error) {
    console.error('Ошибка при сохранении товара:', error)
    // Здесь можно показать уведомление об ошибке
  }
}

// Функции для работы с popup уведомлений
const showNewNotification = (notification) => {
  currentNotification.value = notification
  showNotificationPopup.value = true
}

const closeNotificationPopup = () => {
  showNotificationPopup.value = false
  currentNotification.value = {}
}

const resolveNotification = async (notificationId) => {
  try {
    await markNotificationAsResolved(notificationId)
    console.log('Уведомление отмечено как выполненное')
  } catch (error) {
    console.error('Ошибка при отметке уведомления:', error)
  }
}

// Отслеживаем новые уведомления и показываем popup
watch(
  notifications,
  (newNotifications, oldNotifications) => {
    if (newNotifications.length > 0 && oldNotifications) {
      // Находим новые уведомления со статусом 'pending'
      const pendingNotifications = newNotifications.filter(
        (n) => n.status === 'pending' && !oldNotifications.some((old) => old.id === n.id),
      )

      // Показываем popup для первого нового уведомления
      if (pendingNotifications.length > 0) {
        showNewNotification(pendingNotifications[0])
      }
    }
  },
  { deep: true },
)

// Инициализация при монтировании компонента
onMounted(() => {
  // Загружаем базовые данные
  fetchCategories()
  fetchMenu()
  fetchWaiterNotifications()

  // Проверяем уведомления каждые 30 секунд
  // В реальном приложении здесь будет WebSocket подключение
  const notificationInterval = setInterval(() => {
    fetchWaiterNotifications()
  }, 30000)

  // Очистка интервала при размонтировании
  onUnmounted(() => {
    clearInterval(notificationInterval)
  })
})
</script>

<style scoped>
.container {
  display: flex;
  gap: 19px;
  height: 90vh;
  width: 80vw;
  padding: 17px 21px;
}

.container-right {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 16px;
  margin-top: 20px;
}

.placeholder h2 {
  font-size: 24px;
  color: #374151;
  margin: 0 0 8px 0;
}

.placeholder p {
  font-size: 16px;
  margin: 0;
}
</style>
