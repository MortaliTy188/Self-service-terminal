<template>
  <div class="container">
    <LeftSidebar :active-tab="activeTab" @refresh="refreshPage" @tab-change="handleTabChange" />
    <div class="container-right">
      <!-- Вкладка заказов -->
      <template v-if="activeTab === 'orders'">
        <div class="orders-controls">
          <OrderFilters
            :active-filter="activeFilter"
            :filters="orderFilters"
            @filter-change="setFilter"
          />
          <div class="table-search">
            <input
              v-model="tableSearchInput"
              type="number"
              placeholder="Поиск по столу..."
              class="table-search-input"
              @input="handleTableSearch"
              min="1"
              max="99"
            />
            <button v-if="tableSearchInput" @click="clearTableSearch" class="clear-search-btn">
              ✕
            </button>
          </div>
        </div>
        <OrdersTable
          :orders="filteredOrders"
          :is-loading="isLoading"
          :error="error"
          @order-updated="handleOrderUpdated"
        />
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
          @category-created="handleCategoryCreated"
          @category-updated="handleCategoryUpdated"
        />
      </template>

      <!-- Заглушки для других вкладок -->
      <template v-if="activeTab === 'devices'">
        <DeviceManagement
          :is-loading="false"
          :error="null"
          @retry="loadDeviceData"
          @delete-device="handleDeleteDevice"
          @open-settings="handleOpenDeviceSettings"
          @update-connection-key="handleUpdateConnectionKey"
        />
      </template>

      <template v-if="activeTab === 'settings'">
        <SettingsManagement @save-settings="handleSaveSettings" />
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useOrdersStore, useWaiterStore, useMenuStore, useApiConfigStore } from '@/stores'
import {
  LeftSidebar,
  OrderFilters,
  OrdersTable,
  WaiterNotificationPopup,
  MenuManagement,
  DeviceManagement,
  SettingsManagement,
} from '@/components/OrdersPage'

// Используем Pinia stores
const ordersStore = useOrdersStore()
const waiterStore = useWaiterStore()
const menuStore = useMenuStore()
const apiConfigStore = useApiConfigStore()

// Данные из stores
const orders = computed(() => ordersStore.orders)
const isLoading = computed(() => ordersStore.isLoading)
const error = computed(() => ordersStore.error)
const isFiltered = computed(() => ordersStore.isFiltered)

const menuItems = computed(() => menuStore.menuItems)
const isMenuLoading = computed(() => menuStore.isLoading)
const menuError = computed(() => menuStore.error)
const categories = computed(() => menuStore.categories)

const notifications = computed(() => waiterStore.notifications)

// Активная вкладка
const activeTab = ref('orders')

// Активные фильтры
const activeFilter = ref('all')
const activeMenuFilter = ref('all')

// Поиск по номеру стола
const tableSearchInput = ref('')

// Конфигурация фильтров для переиспользуемого компонента
const orderFilters = computed(() => {
  const items = orders.value || []

  // Если данные отфильтрованы на сервере, не показываем точные счетчики для других фильтров
  const showExactCounts = !isFiltered.value

  return [
    {
      value: 'all',
      label: 'Все заказы',
      icon: '📋',
      count: showExactCounts ? items.length : '?',
    },
    {
      value: 'preparing',
      label: 'Готовится',
      icon: '👨‍🍳',
      count: showExactCounts
        ? items.filter((order) => order.status === 'preparing').length
        : activeFilter.value === 'preparing'
          ? items.length
          : '?',
      class: { 'status-preparing': true },
    },
    {
      value: 'ready',
      label: 'Готов к выдаче',
      icon: '🔔',
      count: showExactCounts
        ? items.filter((order) => order.status === 'ready').length
        : activeFilter.value === 'ready'
          ? items.length
          : '?',
      class: { 'status-ready': true },
    },
    {
      value: 'completed',
      label: 'Выполненные',
      icon: '✅',
      count: showExactCounts
        ? items.filter((order) => order.status === 'completed').length
        : activeFilter.value === 'completed'
          ? items.length
          : '?',
      class: { 'status-completed': true },
    },
    {
      value: 'cancelled',
      label: 'Отменённые',
      icon: '❌',
      count: showExactCounts
        ? items.filter((order) => order.status === 'cancelled').length
        : activeFilter.value === 'cancelled'
          ? items.length
          : '?',
      class: { 'status-cancelled': true },
    },
  ]
})

// Конфигурация фильтров меню
const menuFilters = computed(() => {
  // Дополнительная защита от undefined
  if (!menuItems.value || !categories.value) {
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
      count: items.filter((item) => item.is_available !== false).length,
    },
    {
      value: 'inactive',
      label: 'Неактивные',
      icon: '⛔',
      count: items.filter((item) => item.is_available === false).length,
    },
  ]
})

// Состояние popup уведомления
const showNotificationPopup = ref(false)
const currentNotification = ref({})

// Функции для смены фильтров
const setFilter = async (filter) => {
  activeFilter.value = filter
  // Фильтрация теперь только локальная через computed свойство filteredOrders
  // Не загружаем данные с сервера при смене фильтра
}

const setMenuFilter = (filter) => {
  activeMenuFilter.value = filter
}

// Функции поиска по номеру стола
const handleTableSearch = async () => {
  if (tableSearchInput.value) {
    try {
      console.log('🔍 Поиск заказов по столу:', tableSearchInput.value)
      await ordersStore.fetchOrdersByTable(tableSearchInput.value)
      // Сбрасываем активный фильтр при поиске по столу
      activeFilter.value = 'all'
    } catch (error) {
      console.error('Ошибка поиска по столу:', error)
      // При ошибке показываем все заказы
      await ordersStore.fetchOrders()
    }
  } else {
    // Если поле очищено, показываем все заказы
    await ordersStore.fetchOrders()
    activeFilter.value = 'all'
  }
}

const clearTableSearch = async () => {
  tableSearchInput.value = ''
  activeFilter.value = 'all'
  await ordersStore.fetchOrders()
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
  console.log('🔍 Фильтрация заказов:', {
    totalOrders: items.length,
    activeFilter: activeFilter.value,
    firstOrder: items[0],
  })

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
    await menuStore.fetchMenuWithCategories()
  } catch (error) {
    console.error('Ошибка загрузки меню:', error)
  }
}

// Функция обновления страницы
const refreshPage = async () => {
  await ordersStore.fetchOrders()
  await waiterStore.fetchNotifications()
  if (activeTab.value === 'menu') {
    await loadMenuData()
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

// Обработчик обновления статуса заказа
const handleOrderUpdated = async (orderId, newStatus) => {
  console.log('Обновление статуса заказа:', orderId, newStatus)

  // Обновляем заказ в локальном состоянии
  const order = orders.value.find((order) => order.id === orderId)
  if (order) {
    order.status = newStatus
  }

  // Можно добавить перезагрузку данных с сервера для синхронизации
  // await loadOrdersData()
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

// Функция для обработки создания новой категории
const handleCategoryCreated = async (newCategory) => {
  console.log('Новая категория создана:', newCategory)

  try {
    // НЕ вызываем fetchCategories(), так как категория уже добавлена в store
    // await menuStore.fetchCategories() - это перезаписывает наши данные!

    // Ждем следующий тик для обновления reactive свойств
    await nextTick()

    console.log('Категории после создания:', categories.value)
    console.log('Обновленные фильтры меню:', menuFilters.value)

    // Принудительно обновляем активную вкладку, чтобы показать изменения
    if (activeTab.value === 'menu') {
      // Можно добавить дополнительную логику обновления UI если нужно
    }
  } catch (error) {
    console.error('Ошибка при обновлении категорий:', error)
  }
}

// Функция для обработки обновления категории
const handleCategoryUpdated = async (updatedCategory) => {
  console.log('Категория обновлена:', updatedCategory)

  try {
    // Ждем следующий тик для обновления reactive свойств
    await nextTick()

    console.log('Категории после обновления:', categories.value)
    console.log('Обновленные фильтры меню:', menuFilters.value)
  } catch (error) {
    console.error('Ошибка при обновлении интерфейса:', error)
  }
}

const closeNotificationPopup = () => {
  showNotificationPopup.value = false
  currentNotification.value = {}
}

const resolveNotification = async (notificationId) => {
  try {
    await waiterStore.resolveNotification(notificationId)
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
      // Находим новые неразрешенные уведомления
      const pendingNotifications = newNotifications.filter(
        (n) => !n.resolved && !oldNotifications.some((old) => old.id === n.id),
      )

      // Показываем popup для первого нового уведомления
      if (pendingNotifications.length > 0) {
        console.log('Показываем новое уведомление:', pendingNotifications[0])
        showNewNotification(pendingNotifications[0])
      }
    }
  },
  { deep: true },
)

// Функции для работы с устройствами
const loadDeviceData = () => {
  console.log('Загрузка данных устройств...')
  // Здесь будет запрос на сервер для получения информации об устройствах
}

const handleDeleteDevice = (deviceId) => {
  console.log('Удаление устройства:', deviceId)
  // Здесь будет API вызов для удаления устройства
  // В будущем: await deleteDevice(deviceId)
}

const handleOpenDeviceSettings = (deviceId) => {
  console.log('Открытие настроек устройства:', deviceId)
  // Здесь будет логика открытия настроек конкретного устройства
}

const handleUpdateConnectionKey = (deviceId, newKey) => {
  console.log('Обновление ключа подключения устройства:', deviceId, newKey)
  // Здесь будет API вызов для обновления ключа подключения
  // В будущем: await updateDeviceConnectionKey(deviceId, newKey)
}

// Функции для работы с настройками
const handleSaveSettings = async (settingsData) => {
  console.log('Сохранение настроек:', settingsData)
  // Здесь будет API вызов для сохранения настроек системы
  // В зависимости от типа настроек (account, api, splash)
  switch (settingsData.type) {
    case 'account':
      console.log('Сохранение настроек аккаунта:', settingsData.data)
      // await saveAccountSettings(settingsData.data)
      break
    case 'api':
      console.log('Сохранение настроек API:', settingsData.data)
      // Перезагружаем конфигурацию после сохранения
      await apiConfigStore.fetchConfig()
      break
    case 'splash':
      console.log('Сохранение настроек заставки:', settingsData.data)
      // await saveSplashSettings(settingsData.data)
      break
  }
}

// Инициализация при монтировании компонента
onMounted(async () => {
  // Загружаем базовые данные
  await menuStore.fetchMenuWithCategories()
  await ordersStore.fetchOrders()
  await waiterStore.fetchNotifications()

  // Загружаем API конфигурацию
  await apiConfigStore.fetchConfig()

  // Проверяем, есть ли неразрешенные уведомления при загрузке
  const activeNotifications = notifications.value.filter((n) => !n.resolved)
  if (activeNotifications.length > 0) {
    console.log('Найдены активные уведомления при загрузке:', activeNotifications)
    // Показываем первое активное уведомление
    showNewNotification(activeNotifications[0])
  }

  // Проверяем уведомления каждые 30 секунд
  // В реальном приложении здесь будет WebSocket подключение
  const notificationInterval = setInterval(() => {
    waiterStore.fetchNotifications()
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
  height: 100vh;
  width: 100vw;
  padding: 17px 21px 40px 21px;
  box-sizing: border-box;
  overflow: hidden;
}

.container-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  width: 100%;
  padding-bottom: 20px;
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

/* Стили для контролов заказов */
.orders-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.table-search {
  position: relative;
  display: flex;
  align-items: center;
}

.table-search-input {
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  width: 180px;
  transition: border-color 0.2s;
}

.table-search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.table-search-input::-webkit-outer-spin-button,
.table-search-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.table-search-input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #6b7280;
  padding: 2px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.clear-search-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}
</style>
