const BASE_URL = 'http://83.222.9.90:8080'

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `/api${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
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

  async getMenu() {
    return this.request('/menu')
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
