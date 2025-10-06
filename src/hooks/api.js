const BASE_URL = 'http://83.222.9.90:8080'

class ApiClient {
  constructor() {
    this.deviceToken = null
    this.adminSession = null
  }

  // Установка токена устройства
  setDeviceToken(token) {
    this.deviceToken = token
  }

  // Установка админской сессии
  setAdminSession(sessionId) {
    this.adminSession = sessionId
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('/admin') ? endpoint : `/api${endpoint}`

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Добавляем X-Device-Token для обычных API запросов
    if (this.deviceToken && !endpoint.startsWith('/admin')) {
      headers['X-Device-Token'] = this.deviceToken
    }

    // Добавляем X-Admin-Session для админских запросов
    if (this.adminSession && endpoint.startsWith('/admin')) {
      headers['X-Admin-Session'] = this.adminSession
    }

    try {
      const response = await fetch(url, {
        headers,
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Авторизация админа
  async adminLogin(password) {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
  }

  // Регистрация устройства
  async registerDevice(deviceData) {
    return this.request('/devices/register', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    })
  }

  // Получение списка устройств (требует админскую сессию)
  async getDevices() {
    return this.request('/devices')
  }

  // Получение информации об устройстве
  async getDeviceInfo(deviceId) {
    return this.request(`/devices/${deviceId}`)
  }

  // Обновление статуса устройства
  async updateDeviceStatus(deviceId, statusData) {
    return this.request(`/devices/${deviceId}/status`, {
      method: 'POST',
      body: JSON.stringify(statusData),
    })
  }

  // Создание заказа
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  }

  async getMenu() {
    return this.request('/menu')
  }

  // Получение столов
  async getTables() {
    return this.request('/tables')
  }

  async getCategories() {
    return this.request('/categories')
  }

  // Методы для работы с официантами (закомментированы, так как эндпоинты еще не готовы)

  // async callWaiter(tableNumber, timestamp) {
  //   return this.request('/waiter/call', {
  //     method: 'POST',
  //     body: JSON.stringify({
  //       tableNumber,
  //       timestamp,
  //       type: 'waiter_call'
  //     })
  //   })
  // }

  // async getWaiterNotifications() {
  //   return this.request('/waiter/notifications')
  // }

  // async markWaiterNotificationResolved(notificationId) {
  //   return this.request(`/waiter/notifications/${notificationId}/resolve`, {
  //     method: 'PATCH'
  //   })
  // }

  // async deleteWaiterNotification(notificationId) {
  //   return this.request(`/waiter/notifications/${notificationId}`, {
  //     method: 'DELETE'
  //   })
  // }
}

export const apiClient = new ApiClient()
export { BASE_URL }
