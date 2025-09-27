import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMainStore } from './main'

export const useOrdersStore = defineStore('orders', () => {
  const mainStore = useMainStore()

  // State
  const orders = ref([])
  const currentCart = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const lastOrder = ref(null)

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

  // Actions
  const fetchOrders = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Имитация API запроса
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Демо данные
      orders.value = [
        {
          id: 1,
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
          id: 2,
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
        {
          id: 3,
          orderTime: '12:15',
          orderType: 'За столом',
          tableNumber: 2,
          items: '1x Борщ, 1x Цезарь, 1x Кофе',
          status: 'preparing',
          totalPrice: 780,
          createdAt: new Date(Date.now() - 900000).toISOString(),
          cartItems: [
            { id: 5, name: 'Борщ с говядиной', price: 350, quantity: 1 },
            { id: 6, name: 'Цезарь с курицей', price: 280, quantity: 1 },
            { id: 7, name: 'Кофе эспрессо', price: 150, quantity: 1 },
          ],
        },
        {
          id: 4,
          orderTime: '12:05',
          orderType: 'Доставка',
          tableNumber: '-',
          items: '2x Тирамису, 3x Сок',
          status: 'completed',
          totalPrice: 545,
          createdAt: new Date(Date.now() - 1500000).toISOString(),
          cartItems: [
            { id: 8, name: 'Тирамису', price: 220, quantity: 2 },
            { id: 9, name: 'Апельсиновый сок', price: 35, quantity: 3 },
          ],
        },
        {
          id: 5,
          orderTime: '11:50',
          orderType: 'За столом',
          tableNumber: 7,
          items: '1x Стейк, 2x Пиво',
          status: 'completed',
          totalPrice: 890,
          createdAt: new Date(Date.now() - 2400000).toISOString(),
          cartItems: [
            { id: 10, name: 'Стейк из говядины', price: 650, quantity: 1 },
            { id: 11, name: 'Пиво светлое', price: 120, quantity: 2 },
          ],
        },
        {
          id: 6,
          orderTime: '11:35',
          orderType: 'С собой',
          tableNumber: '-',
          items: '1x Паста, 1x Лимонад',
          status: 'cancelled',
          totalPrice: 380,
          createdAt: new Date(Date.now() - 3300000).toISOString(),
          cartItems: [
            { id: 12, name: 'Паста болоньезе', price: 320, quantity: 1 },
            { id: 13, name: 'Лимонад домашний', price: 60, quantity: 1 },
          ],
        },
      ]
    } catch (err) {
      error.value = err.message
      console.error('Error fetching orders:', err)
      mainStore.setGlobalError(err.message)
    } finally {
      isLoading.value = false
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

  const createOrder = async (orderDetails) => {
    if (currentCart.value.length === 0) {
      throw new Error('Корзина пуста')
    }

    isLoading.value = true

    try {
      const newOrder = {
        id: Date.now(),
        orderDate: new Date().toLocaleDateString('ru-RU'),
        orderTime: new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        orderType: orderDetails.orderType || 'За столом',
        tableNumber: orderDetails.tableNumber || '-',
        items: [...currentCart.value], // Сохраняем полные объекты товаров
        itemsText: currentCart.value
          .map((item) => `${item.quantity}x ${item.name || item.title}`)
          .join(', '),
        status: 'pending',
        totalPrice: cartTotal.value,
        totalQuantity: cartItemsCount.value,
        createdAt: new Date().toISOString(),
        customerName: orderDetails.customerName || '',
        specialRequests: orderDetails.specialRequests || '',
      }

      // Имитация API запроса
      await new Promise((resolve) => setTimeout(resolve, 1000))

      orders.value.unshift(newOrder)
      lastOrder.value = newOrder
      clearCart()

      mainStore.addNotification({
        type: 'success',
        title: 'Заказ оформлен',
        message: `Заказ №${newOrder.id} успешно создан`,
        duration: 3000,
      })

      return newOrder
    } catch (err) {
      error.value = err.message
      console.error('Error creating order:', err)
      mainStore.setGlobalError(err.message)
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

    // Getters
    cartItems,
    cartTotal,
    cartItemsCount,
    ordersByStatus,
    pendingOrders,
    completedOrders,

    // Actions
    fetchOrders,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    createOrder,
    updateOrderStatus,
    getOrderById,
    getOrdersByStatus,
    getOrdersByTableNumber,
  }
})
