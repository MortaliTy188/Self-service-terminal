import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMainStore } from './main'
import { useApiConfigStore } from './apiConfig'

export const useMenuStore = defineStore('menu', () => {
  const mainStore = useMainStore()
  const apiConfigStore = useApiConfigStore()

  // State
  const menuItems = ref([])
  const categories = ref([])
  const tables = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const selectedCategory = ref(null)

  // Getters
  const filteredMenuItems = computed(() => {
    if (!selectedCategory.value) {
      return menuItems.value
    }
    return menuItems.value.filter((item) => item.category_id === selectedCategory.value)
  })

  const categoriesWithCounts = computed(() => {
    return categories.value.map((category) => ({
      ...category,
      itemCount: menuItems.value.filter((item) => item.category_id === category.id).length,
    }))
  })

  const availableMenuItems = computed(() => {
    return menuItems.value.filter((item) => item.is_available !== false)
  })

  // Actions
  const fetchMenu = async () => {
    isLoading.value = true
    error.value = null

    try {
      console.log('🍽️ Загружаем меню с сервера:', apiConfigStore.getSecureUrl('/menu'))
      const response = await fetch(apiConfigStore.getSecureUrl('/menu'))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      menuItems.value = data
      console.log('✅ Меню успешно загружено с сервера:', {
        source: apiConfigStore.getSecureUrl('/menu'),
        itemsCount: data.length,
        items: data,
      })
    } catch (err) {
      error.value = err.message
      console.error('❌ Ошибка загрузки меню с сервера:', err)
      mainStore.setGlobalError(err.message)
    } finally {
      isLoading.value = false
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('📂 Загружаем категории с сервера:', apiConfigStore.getSecureUrl('/categories'))
      const response = await fetch(apiConfigStore.getSecureUrl('/categories'))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      categories.value = data
      console.log('✅ Категории успешно загружены с сервера:', {
        source: apiConfigStore.getSecureUrl('/categories'),
        categoriesCount: data.length,
        categories: data,
      })
    } catch (err) {
      error.value = err.message
      console.error('❌ Ошибка загрузки категорий с сервера:', err)
    }
  }

  const fetchTables = async () => {
    try {
      console.log('🪑 Загружаем столы с сервера:', apiConfigStore.getSecureUrl('/tables'))
      const response = await fetch(apiConfigStore.getSecureUrl('/tables'))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      tables.value = data
      console.log('✅ Столы успешно загружены с сервера:', {
        source: apiConfigStore.getSecureUrl('/tables'),
        tablesCount: data.length,
        tables: data,
      })
    } catch (err) {
      error.value = err.message
      console.error('❌ Ошибка загрузки столов с сервера:', err)
    }
  }

  const getMenuItemById = (id) => {
    return menuItems.value.find((item) => item.id === id)
  }

  const getMenuByCategory = (categoryId) => {
    return menuItems.value.filter((item) => item.category_id === categoryId)
  }

  const getCategoryById = (id) => {
    return categories.value.find((category) => category.id === id)
  }

  const setSelectedCategory = (categoryId) => {
    selectedCategory.value = categoryId
  }

  const addMenuItem = (item) => {
    const newItem = {
      ...item,
      id: Date.now(), // Временный ID
      created_at: new Date().toISOString(),
    }
    menuItems.value.push(newItem)
    return newItem
  }

  const updateMenuItem = (id, updates) => {
    const index = menuItems.value.findIndex((item) => item.id === id)
    if (index > -1) {
      menuItems.value[index] = { ...menuItems.value[index], ...updates }
      saveMenuToStorage() // Сохраняем в localStorage
      return menuItems.value[index]
    }
    return null
  }

  const removeMenuItem = (id) => {
    const index = menuItems.value.findIndex((item) => item.id === id)
    if (index > -1) {
      menuItems.value.splice(index, 1)
      return true
    }
    return false
  }

  const addCategory = (category) => {
    const newCategory = {
      ...category,
      id: Date.now(), // Временный ID
      is_active: true,
      created_at: new Date().toISOString(),
    }

    categories.value.push(newCategory)

    return newCategory
  }

  const updateCategory = (id, updates) => {
    const index = categories.value.findIndex((cat) => cat.id === id)
    if (index > -1) {
      categories.value[index] = { ...categories.value[index], ...updates }
      return categories.value[index]
    }
    return null
  }

  const removeCategory = (id) => {
    const index = categories.value.findIndex((cat) => cat.id === id)
    if (index > -1) {
      categories.value.splice(index, 1)
      return true
    }
    return false
  }

  const toggleMenuItemAvailability = (id) => {
    const item = getMenuItemById(id)
    if (item) {
      item.is_available = !item.is_available
    }
  }

  const searchMenuItems = (query) => {
    if (!query) return menuItems.value

    const lowercaseQuery = query.toLowerCase()
    return menuItems.value.filter(
      (item) =>
        item.name?.toLowerCase().includes(lowercaseQuery) ||
        item.description?.toLowerCase().includes(lowercaseQuery),
    )
  }

  const getTableById = (id) => {
    return tables.value.find((table) => table.id === id)
  }

  const fetchMenuWithCategories = async () => {
    console.log('🚀 Начинаем загрузку меню, категорий и столов...')
    try {
      await Promise.all([fetchMenu(), fetchCategories(), fetchTables()])
      console.log('🎉 Меню, категории и столы загружены успешно:', {
        menuItemsCount: menuItems.value.length,
        categoriesCount: categories.value.length,
        tablesCount: tables.value.length,
      })
    } catch (error) {
      console.error('💥 Ошибка при загрузке данных:', error)
    }
  }

  const setCurrentCategory = (categoryId) => {
    selectedCategory.value = categoryId
  }

  const clearCategoryFilter = () => {
    selectedCategory.value = null
  }

  return {
    // State
    menuItems,
    categories,
    tables,
    isLoading,
    error,
    selectedCategory,

    // Getters
    filteredMenuItems,
    categoriesWithCounts,
    availableMenuItems,

    // Actions
    fetchMenu,
    fetchCategories,
    fetchTables,
    fetchMenuWithCategories,
    setCurrentCategory,
    clearCategoryFilter,
    getMenuItemById,
    getMenuByCategory,
    getCategoryById,
    getTableById,
    setSelectedCategory,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    addCategory,
    updateCategory,
    removeCategory,
    toggleMenuItemAvailability,
    searchMenuItems,
  }
})
