import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMainStore } from './main'
import { useMenuStore } from './menu'
import { useApiConfigStore } from './apiConfig'

export const useOrdersStore = defineStore('orders', () => {
  const mainStore = useMainStore()
  const apiConfigStore = useApiConfigStore()

  // Получаем доступ к menuStore для поиска информации о товарах
  const getMenuStore = () => {
    return useMenuStore()
  }

  // State
  const orders = ref([])
  const currentCart = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const lastOrder = ref(null)
  const currentFilter = ref(null) // Информация о текущем серверном фильтре

  // Getters
  const cartTotal = computed(() => {
    return currentCart.value.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  })

  const cartItemsCount = computed(() => {
    return currentCart.value.reduce((count, item) => count + item.quantity, 0)
  })

  const cartItems = computed(() => currentCart.value)

  const ordersByStatus = computed(() => {
    const grouped = {}
    orders.value.forEach((order) => {
      if (!grouped[order.status]) {
        grouped[order.status] = []
      }
      grouped[order.status].push(order)
    })
    return grouped
  })

  const pendingOrders = computed(() => {
    return orders.value.filter((order) => order.status === 'pending')
  })

  const completedOrders = computed(() => {
    return orders.value.filter((order) => order.status === 'completed')
  })

  const isFiltered = computed(() => {
    return currentFilter.value && Object.keys(currentFilter.value).length > 0
  })

  // Actions
  // Функция для маппинга статусов сервера в локальные статусы
  const mapServerStatus = (serverStatus) => {
    switch (serverStatus) {
      case 'pending':
        return 'preparing' // pending заказы показываем как "готовится"
      case 'ready':
        return 'ready'
      case 'completed':
        return 'completed'
      case 'cancelled':
        return 'cancelled'
      default:
        return 'preparing' // по умолчанию "готовится"
    }
  }

  const fetchOrders = async (filters = {}) => {
    isLoading.value = true
    error.value = null

    try {
      // Формируем URL с параметрами фильтрации
      let url = `${apiConfigStore.baseUrl}/orders`
      const queryParams = []

      if (filters.status) {
        queryParams.push(`status=${encodeURIComponent(filters.status)}`)
      }

      if (filters.table_number) {
        queryParams.push(`table_number=${encodeURIComponent(filters.table_number)}`)
      }

      if (filters.limit) {
        queryParams.push(`limit=${encodeURIComponent(filters.limit)}`)
      }

      if (filters.offset) {
        queryParams.push(`offset=${encodeURIComponent(filters.offset)}`)
      }

      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&')
      }

      console.log('📋 Загружаем заказы с сервера:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ Ошибка загрузки заказов:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Заказы загружены с сервера:', result)

      // Нормализуем данные заказов для локального отображения
      // Сервер возвращает { data: [...], summary: {...}, total: number }
      const ordersData = result.data || result.orders || []
      const normalizedOrders = ordersData.map((order) => ({
        id: order.id || order.order_id,
        orderDate: order.createdAt
          ? new Date(order.createdAt).toLocaleDateString('ru-RU')
          : new Date().toLocaleDateString('ru-RU'),
        orderTime: order.createdAt
          ? new Date(order.createdAt).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        orderType: order.orderType || order.order_type || 'За столом',
        tableNumber: order.tableNumber || order.table_number || order.table_id || '-',
        tableId: order.tableId || order.table_id,
        items: order.items || '', // items уже приходит как строка с сервера
        status: mapServerStatus(order.status), // Используем функцию маппинга статусов
        totalPrice: order.totalPrice || order.total_price || order.total || 0,
        totalQuantity: order.totalQuantity || order.total_quantity || 0,
        createdAt: order.createdAt || order.created_at || new Date().toISOString(),
        customerName: order.customerName || order.customer_name || '',
        specialRequests: order.specialRequests || order.special_requests || '',
        cartItems: order.cartItems || order.cart_items || [],
        serverData: order, // Сохраняем оригинальные данные с сервера
      }))

      orders.value = normalizedOrders

      // Устанавливаем информацию о текущем фильтре
      currentFilter.value = filters

      mainStore.addNotification({
        type: 'success',
        title: 'Заказы загружены',
        message: `Загружено ${normalizedOrders.length} заказов`,
        duration: 2000,
      })

      return { success: true, data: result, orders: normalizedOrders }
    } catch (err) {
      console.error('❌ Ошибка загрузки заказов:', err)
      error.value = err.message

      // Fallback на демо данные в случае ошибки
      orders.value = [
        {
          id: 'demo_1',
          orderTime: '12:30',
          orderType: 'За столом',
          tableNumber: 5,
          items: '2x Бургер, 1x Кола',
          status: 'ready',
          totalPrice: 580,
          createdAt: new Date().toISOString(),
          cartItems: [
            { id: 1, name: 'Бургер', price: 250, quantity: 2 },
            { id: 2, name: 'Кола', price: 80, quantity: 1 },
          ],
        },
        {
          id: 'demo_2',
          orderTime: '12:25',
          orderType: 'С собой',
          tableNumber: '-',
          items: '1x Пицца, 2x Сок',
          status: 'completed',
          totalPrice: 420,
          createdAt: new Date(Date.now() - 300000).toISOString(),
          cartItems: [
            { id: 3, name: 'Пицца', price: 350, quantity: 1 },
            { id: 4, name: 'Сок', price: 35, quantity: 2 },
          ],
        },
      ]

      mainStore.addNotification({
        type: 'warning',
        title: 'Загружены демо данные',
        message: 'Не удалось подключиться к серверу',
        duration: 3000,
      })

      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // Функции для фильтрации заказов
  const fetchOrdersByStatus = async (status) => {
    return await fetchOrders({ status })
  }

  const fetchOrdersByTable = async (tableNumber) => {
    return await fetchOrders({ table_number: tableNumber })
  }

  const fetchOrdersWithPagination = async (limit = 10, offset = 0) => {
    return await fetchOrders({ limit, offset })
  }

  const addToCartServer = async (productId, quantity = 1) => {
    try {
      console.log(`🛒 Добавляем товар в корзину через API:`)
      console.log(`   productId: ${productId} (тип: ${typeof productId})`)
      console.log(`   quantity: ${quantity} (тип: ${typeof quantity})`)

      const requestBody = {
        menu_item_id: productId,
        qty: quantity,
      }

      console.log('📤 Отправляем на сервер:', requestBody)
      console.log('📤 JSON строка:', JSON.stringify(requestBody))

      const response = await fetch(`${apiConfigStore.baseUrl}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📥 Ответ сервера статус:', response.status)
      console.log('📥 Ответ сервера headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ Тело ошибки от сервера:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Товар добавлен в корзину, ответ сервера:', result)

      // Убедимся, что меню загружено для правильного обновления корзины
      const menuStore = getMenuStore()
      if (menuStore.menuItems.length === 0) {
        console.log('⚠️ Меню не загружено, загружаем...')
        await menuStore.fetchMenu()
      }

      // Обновляем корзину данными с сервера
      if (result.cart) {
        updateCartFromServer(result.cart)
      } else {
        // Если сервер не вернул корзину, загружаем её отдельно
        await fetchCart()
      }

      // Показываем уведомление об успехе
      const menuItem = menuStore.menuItems.find((item) => item.id === productId)
      const itemName = menuItem ? menuItem.name : 'Товар'

      mainStore.addNotification({
        type: 'success',
        title: 'Товар добавлен',
        message: `${itemName} добавлен в корзину (${quantity} шт.)`,
        duration: 2000,
      })

      return { success: true, data: result }
    } catch (err) {
      console.error('❌ Ошибка добавления товара в корзину:', err)
      error.value = err.message

      mainStore.addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось добавить товар в корзину',
        duration: 3000,
      })

      return { success: false, error: err.message }
    }
  }

  const addToCart = (item, additionalQuantity = null) => {
    // Если additionalQuantity передан явно, используем его
    // Иначе используем quantity из объекта item, или 1 по умолчанию
    const quantityToAdd = additionalQuantity !== null ? additionalQuantity : item.quantity || 1
    const existingItem = currentCart.value.find((cartItem) => cartItem.id === item.id)

    if (existingItem) {
      existingItem.quantity += quantityToAdd
    } else {
      // Нормализуем данные элемента корзины
      const normalizedItem = {
        id: item.id,
        name: item.name || item.title,
        title: item.name || item.title, // для обратной совместимости
        price: item.price,
        image: item.image,
        description: item.description,
        weight: item.weight,
        calories: item.calories,
        quantity: quantityToAdd,
      }
      currentCart.value.push(normalizedItem)
    }

    mainStore.addNotification({
      type: 'success',
      title: 'Товар добавлен',
      message: `${item.name || item.title} добавлен в корзину (${quantityToAdd} шт.)`,
      duration: 2000,
    })
  }

  const removeFromCartServer = async (menuItemId) => {
    try {
      const requestBody = {
        menu_item_id: menuItemId,
      }

      console.log('🗑️ Удаляем товар из корзины через API:', requestBody)

      const response = await fetch(`${apiConfigStore.baseUrl}/cart/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ Ошибка удаления из корзины:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Товар удален из корзины:', result)

      // Обновляем корзину данными с сервера
      if (result.cart) {
        updateCartFromServer(result.cart)
      } else {
        // Если сервер не вернул корзину, загружаем её отдельно
        await fetchCart()
      }

      mainStore.addNotification({
        type: 'info',
        title: 'Товар удален',
        message: 'Товар удален из корзины',
        duration: 2000,
      })

      return { success: true, data: result }
    } catch (err) {
      console.error('❌ Ошибка удаления товара из корзины:', err)
      error.value = err.message

      mainStore.addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось удалить товар из корзины',
        duration: 3000,
      })

      return { success: false, error: err.message }
    }
  }

  const removeFromCart = (itemId) => {
    const index = currentCart.value.findIndex((item) => item.id === itemId)
    if (index > -1) {
      currentCart.value.splice(index, 1)
    }
  }

  const updateCartItemQuantity = (itemId, quantity) => {
    const item = currentCart.value.find((cartItem) => cartItem.id === itemId)
    if (item) {
      if (quantity <= 0) {
        removeFromCart(itemId)
      } else {
        item.quantity = quantity
      }
    }
  }

  const clearCart = () => {
    currentCart.value = []
  }

  const updateCartFromServer = (serverCartData) => {
    console.log('🔄 Обновляем корзину данными с сервера:', serverCartData)

    // Получаем menuStore для поиска информации о товарах
    const menuStore = getMenuStore()

    // Конвертируем данные сервера в формат нашей корзины
    if (serverCartData.items && Array.isArray(serverCartData.items)) {
      currentCart.value = serverCartData.items.map((item) => {
        // Ищем полную информацию о товаре в меню
        const menuItem = menuStore.getMenuItemById(item.menu_item_id)

        console.log(`🔍 Поиск товара ${item.menu_item_id} в меню:`, menuItem)

        return {
          id: item.menu_item_id,
          name: item.name,
          title: item.name,
          price: item.unit_price,
          quantity: item.qty,
          // Берем изображение и другие данные из меню, если они есть
          image: menuItem?.image || item.image || '',
          description: menuItem?.description || item.description || '',
          weight: menuItem?.weight || item.weight || 0,
          calories:
            menuItem?.energy_amount ||
            menuItem?.energy_full_amount ||
            menuItem?.calories ||
            item.calories ||
            0,
          // Добавляем дополнительные поля из меню
          category_id: menuItem?.category_id || '',
          measure_unit: menuItem?.measure_unit || '',
          proteins_amount: menuItem?.proteins_amount || 0,
          fat_amount: menuItem?.fat_amount || 0,
          carbohydrates_amount: menuItem?.carbohydrates_amount || 0,
        }
      })

      console.log('✅ Корзина обновлена с данными из меню:', currentCart.value)

      // Показываем уведомление
      mainStore.addNotification({
        type: 'success',
        title: 'Товар добавлен',
        message: `Корзина обновлена. Общая сумма: ${serverCartData.total}₽`,
        duration: 2000,
      })
    }
  }

  const fetchCart = async () => {
    try {
      console.log(`🛒 Загружаем корзину с сервера: ${apiConfigStore.baseUrl}/cart`)
      const response = await fetch(`${apiConfigStore.baseUrl}/cart`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const cartData = await response.json()
      console.log('✅ Корзина загружена с сервера:', cartData)

      // Убедимся, что меню уже загружено перед обновлением корзины
      const menuStore = getMenuStore()
      if (menuStore.menuItems.length === 0) {
        console.log('⚠️ Меню не загружено, загружаем...')
        await menuStore.fetchMenu()
      }

      updateCartFromServer(cartData)
      return { success: true, data: cartData }
    } catch (err) {
      console.error('❌ Ошибка загрузки корзины:', err)
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  const createOrder = async (orderDetails) => {
    if (currentCart.value.length === 0) {
      throw new Error('Корзина пуста')
    }

    isLoading.value = true

    try {
      // Генерируем случайный table_id от 11 до 20
      const randomTableId = Math.floor(Math.random() * 10) + 11

      // Используем API согласно postman_collection "Create Order with Table ID"
      const requestBody = {
        order_id: `ord_${Date.now()}`,
        table_number: orderDetails.tableNumber || 5,
        table_id: randomTableId.toString(),
      }

      console.log('🛒 Создаем заказ через API:', requestBody)

      const response = await fetch(`${apiConfigStore.baseUrl}/cart/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ Ошибка создания заказа:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Заказ создан:', result)

      // Создаем локальный объект заказа для отображения
      const newOrder = {
        id: result.order_id || requestBody.order_id,
        orderDate: new Date().toLocaleDateString('ru-RU'),
        orderTime: new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        orderType: orderDetails.orderType || 'За столом',
        tableNumber: orderDetails.tableNumber || 5,
        tableId: requestBody.table_id, // Добавляем table_id
        items: [...currentCart.value], // Сохраняем полные объекты товаров
        itemsText: currentCart.value
          .map((item) => `${item.quantity}x ${item.name || item.title}`)
          .join(', '),
        status: result.status || 'pending',
        totalPrice: cartTotal.value,
        totalQuantity: cartItemsCount.value,
        createdAt: new Date().toISOString(),
        customerName: orderDetails.customerName || '',
        specialRequests: orderDetails.specialRequests || '',
        serverData: result, // Сохраняем данные с сервера
      }

      orders.value.unshift(newOrder)
      lastOrder.value = newOrder
      clearCart()

      mainStore.addNotification({
        type: 'success',
        title: 'Заказ оформлен',
        message: `Заказ №${newOrder.id} создан для стола №${requestBody.table_id}`,
        duration: 3000,
      })

      return newOrder
    } catch (err) {
      error.value = err.message
      console.error('Error creating order:', err)
      mainStore.addNotification({
        type: 'error',
        title: 'Ошибка создания заказа',
        message: err.message,
        duration: 5000,
      })
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const order = orders.value.find((o) => o.id === orderId)
      if (order) {
        order.status = newStatus

        mainStore.addNotification({
          type: 'info',
          title: 'Статус заказа изменен',
          message: `Заказ №${orderId} теперь: ${newStatus}`,
          duration: 3000,
        })
      }
    } catch (err) {
      error.value = err.message
      console.error('Error updating order status:', err)
      mainStore.setGlobalError(err.message)
    }
  }

  const getOrderById = (id) => {
    return orders.value.find((order) => order.id === id)
  }

  const getOrdersByStatus = (status) => {
    return orders.value.filter((order) => order.status === status)
  }

  const getOrdersByTableNumber = (tableNumber) => {
    return orders.value.filter((order) => order.tableNumber === tableNumber)
  }

  return {
    // State
    orders,
    currentCart,
    isLoading,
    error,
    lastOrder,
    currentFilter,

    // Getters
    cartItems,
    cartTotal,
    cartItemsCount,
    ordersByStatus,
    pendingOrders,
    completedOrders,
    isFiltered,

    // Actions
    fetchOrders,
    fetchOrdersByStatus,
    fetchOrdersByTable,
    fetchOrdersWithPagination,
    fetchCart,
    addToCart,
    addToCartServer,
    removeFromCart,
    removeFromCartServer,
    updateCartItemQuantity,
    clearCart,
    updateCartFromServer,
    createOrder,
    updateOrderStatus,
    getOrderById,
    getOrdersByStatus,
    getOrdersByTableNumber,
  }
})
