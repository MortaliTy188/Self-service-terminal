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

  const createCategory = async (categoryData) => {
    try {
      console.log('Создание категории:', categoryData)

      // Реальный API вызов (пока закомментирован)
      // const response = await fetch(`${BASE_URL}/categories`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(categoryData)
      // })

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`)
      // }

      // const newCategory = await response.json()

      // Временно создаем категорию локально
      const newCategory = {
        id: Date.now(),
        name: categoryData.name,
      }

      categories.value.push(newCategory)
      return newCategory
    } catch (err) {
      console.error('Error creating category:', err)
      throw err
    }
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
    createCategory,
  }
}
