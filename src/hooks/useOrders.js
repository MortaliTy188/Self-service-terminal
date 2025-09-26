import { ref, onMounted } from 'vue'

const BASE_URL = 'http://83.222.9.90:8080'

export function useOrders() {
  const orders = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchOrders = async () => {
    isLoading.value = true
    error.value = null

    // Имитация загрузки
    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      // Временно используем статичные данные
      orders.value = getDemoOrders()

      // TODO: Раскомментировать когда API будет готово
      /*
      const response = await fetch(`${BASE_URL}/orders`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      orders.value = data
      */
    } catch (err) {
      error.value = err.message
      console.error('Error fetching orders:', err)
      // Fallback к демо-данным в случае ошибки
      orders.value = getDemoOrders()
    } finally {
      isLoading.value = false
    }
  }

  const getOrderById = (id) => {
    return orders.value.find((order) => order.id === id)
  }

  const getOrdersByStatus = (status) => {
    return orders.value.filter((order) => order.status === status)
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Обновляем локальное состояние
        const orderIndex = orders.value.findIndex((order) => order.id === orderId)
        if (orderIndex !== -1) {
          orders.value[orderIndex].status = newStatus
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err)
    }
  }

  // Демо данные для разработки
  const getDemoOrders = () => [
    {
      id: '001',
      orderTime: '14:30',
      orderType: 'На месте',
      tableNumber: 'Стол 5',
      items: '2x Пицца Маргарита, 1x Кока-кола',
      status: 'pending',
      totalPrice: 1450,
      createdAt: new Date().toISOString(),
    },
    {
      id: '002',
      orderTime: '14:25',
      orderType: 'На вынос',
      tableNumber: '-',
      items: '1x Суши сет, 1x Чай зеленый',
      status: 'completed',
      totalPrice: 890,
      createdAt: new Date().toISOString(),
    },
    {
      id: '003',
      orderTime: '14:35',
      orderType: 'На месте',
      tableNumber: 'Стол 2',
      items: '3x Вок с курицей, 2x Сок апельсиновый',
      status: 'pending',
      totalPrice: 1860,
      createdAt: new Date().toISOString(),
    },
    {
      id: '004',
      orderTime: '14:20',
      orderType: 'На вынос',
      tableNumber: '-',
      items: '1x Десерт тирамису, 1x Кофе американо',
      status: 'completed',
      totalPrice: 500,
      createdAt: new Date().toISOString(),
    },
    {
      id: '005',
      orderTime: '14:40',
      orderType: 'На месте',
      tableNumber: 'Стол 1',
      items: '2x Суши Филадельфия, 1x Зеленый чай',
      status: 'pending',
      totalPrice: 1200,
      createdAt: new Date().toISOString(),
    },
    {
      id: '006',
      orderTime: '14:15',
      orderType: 'Доставка',
      tableNumber: '-',
      items: '1x Пицца Пепперони, 2x Сок яблочный',
      status: 'completed',
      totalPrice: 950,
      createdAt: new Date().toISOString(),
    },
    {
      id: '007',
      orderTime: '14:45',
      orderType: 'На месте',
      tableNumber: 'Стол 3',
      items: '1x Вок с говядиной, 1x Кофе латте',
      status: 'pending',
      totalPrice: 720,
      createdAt: new Date().toISOString(),
    },
    {
      id: '008',
      orderTime: '14:10',
      orderType: 'На вынос',
      tableNumber: '-',
      items: '2x Чизкейк, 1x Чай черный',
      status: 'completed',
      totalPrice: 650,
      createdAt: new Date().toISOString(),
    },
  ]

  onMounted(() => {
    fetchOrders()
  })

  return {
    orders,
    isLoading,
    error,
    fetchOrders,
    getOrderById,
    getOrdersByStatus,
    updateOrderStatus,
  }
}
