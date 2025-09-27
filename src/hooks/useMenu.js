import { ref, onMounted } from 'vue'

const BASE_URL = 'http://83.222.9.90:8080'

export function useMenu() {
  const menu = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchMenu = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/api/menu')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      menu.value = data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching menu:', err)
    } finally {
      isLoading.value = false
    }
  }

  const getMenuItemById = (id) => {
    return menu.value.find((item) => item.id === id)
  }

  const getMenuByCategory = (categoryId) => {
    return menu.value.filter((item) => item.category_id === categoryId)
  }

  onMounted(() => {
    fetchMenu()
  })

  return {
    menu,
    isLoading,
    error,
    fetchMenu,
    getMenuItemById,
    getMenuByCategory,
  }
}
