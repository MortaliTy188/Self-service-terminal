import { ref, onMounted } from 'vue'

const BASE_URL = 'http://83.222.9.90:8080'

export function useCategories() {
  const categories = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchCategories = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${BASE_URL}/categories`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      categories.value = data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching categories:', err)
    } finally {
      isLoading.value = false
    }
  }

  const getCategoryById = (id) => {
    return categories.value.find((category) => category.id === id)
  }

  const getCategoryName = (id) => {
    const category = getCategoryById(id)
    return category ? category.name : 'Неизвестная категория'
  }

  onMounted(() => {
    fetchCategories()
  })

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    getCategoryById,
    getCategoryName,
  }
}
