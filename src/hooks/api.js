const BASE_URL = 'http://83.222.9.90:8080'

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`

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
}

export const apiClient = new ApiClient()
export { BASE_URL }
