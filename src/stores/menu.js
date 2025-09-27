import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMainStore } from './main'

export const useMenuStore = defineStore('menu', () => {
  const mainStore = useMainStore()

  // State
  const menuItems = ref([])
  const categories = ref([])
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
      const response = await fetch('/api/menu')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      menuItems.value = data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching menu:', err)
      mainStore.setGlobalError(err.message)

      // Fallback данные для тестирования
      menuItems.value = [
        {
          id: 1,
          name: 'Борщ с говядиной',
          description: 'Традиционный украинский борщ с говядиной, свеклой и сметаной',
          price: 350,
          image:
            'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=300&fit=crop&crop=center',
          category_id: 5, // Супы
          is_available: true,
          weight: 350,
          calories: 280,
        },
        {
          id: 2,
          name: 'Цезарь с курицей',
          description: 'Классический салат Цезарь с курицей, пармезаном и соусом',
          price: 280,
          image:
            'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=300&fit=crop&crop=center',
          category_id: 6, // Салаты
          is_available: true,
          weight: 200,
          calories: 320,
        },
        {
          id: 3,
          name: 'Кофе эспрессо',
          description: 'Классический крепкий эспрессо из отборных зерен арабики',
          price: 150,
          image:
            'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300&h=300&fit=crop&crop=center',
          category_id: 1, // Напитки
          is_available: true,
          weight: 30,
          calories: 5,
        },
        {
          id: 4,
          name: 'Тирамису',
          description: 'Нежный итальянский десерт с кофе и маскарпоне',
          price: 220,
          image:
            'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=300&fit=crop&crop=center',
          category_id: 3, // Десерты
          is_available: true,
          weight: 120,
          calories: 450,
        },
        {
          id: 5,
          name: 'Стейк из говядины',
          description: 'Сочный стейк из мраморной говядины средней прожарки',
          price: 650,
          image: null,
          category_id: 2, // Основные блюда
          is_available: true,
          weight: 300,
          calories: 520,
        },
        {
          id: 6,
          name: 'Брускетта с томатами',
          description: 'Хрустящий хлеб с томатами, базиликом и моцареллой',
          price: 180,
          image: null,
          category_id: 4, // Закуски
          is_available: true,
          weight: 150,
          calories: 220,
        },
        {
          id: 7,
          name: 'Пиво светлое',
          description: 'Освежающее светлое пиво, 0.5л',
          price: 120,
          image: null,
          category_id: 7, // Алкоголь
          is_available: true,
          weight: 500,
          calories: 180,
        },
        {
          id: 8,
          name: 'Солянка мясная',
          description: 'Густой суп с мясом, солеными огурцами и оливками',
          price: 320,
          image: null,
          category_id: 5, // Супы
          is_available: true,
          weight: 400,
          calories: 250,
        },
      ]
    } finally {
      isLoading.value = false
    }
  }

  const fetchCategories = async () => {
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

      // Fallback данные только если категории пустые
      if (categories.value.length === 0) {
        categories.value = [
          { id: 1, name: 'Напитки', is_active: true },
          { id: 2, name: 'Основные блюда', is_active: true },
          { id: 3, name: 'Десерты', is_active: true },
          { id: 4, name: 'Закуски', is_active: true },
          { id: 5, name: 'Супы', is_active: true },
          { id: 6, name: 'Салаты', is_active: true },
          { id: 7, name: 'Алкоголь', is_active: true },
        ]
      }
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

  const fetchMenuWithCategories = async () => {
    await Promise.all([fetchMenu(), fetchCategories()])
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
    fetchMenuWithCategories,
    setCurrentCategory,
    clearCategoryFilter,
    getMenuItemById,
    getMenuByCategory,
    getCategoryById,
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
