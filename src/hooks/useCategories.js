import { ref, onMounted } from 'vue'

const BASE_URL = 'http://83.222.9.90:8080'

// Создаем глобальные реактивные состояния для синхронизации между компонентами
const categories = ref([])
const isLoading = ref(false)
const error = ref(null)

export function useCategories() {
  const fetchCategories = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/api/categories')

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

      // Проверяем, не существует ли уже категория с таким именем
      const existingCategory = categories.value.find(
        (cat) => cat.name.toLowerCase() === categoryData.name.toLowerCase(),
      )

      if (existingCategory) {
        throw new Error('Категория с таким именем уже существует')
      }

      // Реальный API вызов (пока закомментирован)
      // const response = await fetch('/api/categories', {
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
      console.log(
        'Категория успешно добавлена. Общее количество категорий:',
        categories.value.length,
      )
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
