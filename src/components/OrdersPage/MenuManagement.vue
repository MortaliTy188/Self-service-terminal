<template>
  <div class="menu-management">
    <div class="header">
      <h2>Управление меню</h2>
      <div class="header-actions">
        <button class="btn-categories" @click="showCategoriesPopup = true">
          <i class="icon-folder">📁</i>
          Категории
        </button>
        <button class="btn-add" @click="addNewItem">
          <i class="icon-plus">+</i>
          Добавить блюдо
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка меню...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>Ошибка загрузки: {{ error }}</p>
      <button class="retry-btn" @click="$emit('retry')">Повторить</button>
    </div>

    <div v-else class="menu-grid">
      <div v-for="item in menuItems" :key="item.id" class="menu-item-card">
        <div class="item-image">
          <img :src="item.image || placeholderImage" :alt="item.name" @error="handleImageError" />
        </div>

        <div class="item-info">
          <h3 class="item-name">{{ item.name }}</h3>
          <p class="item-price">{{ formatPrice(item.price) }} ₽</p>
          <p class="item-category">{{ getCategoryName(item.category_id) }}</p>
        </div>

        <div class="item-actions">
          <button
            class="suggestions-btn"
            @click="openSuggestionsPopup(item)"
            title="Настроить рекомендации"
          >
            Рекомендации
          </button>

          <!-- <button class="edit-btn" @click="editItem(item)" title="Редактировать товар">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z" fill="currentColor" />
              <path
                d="M20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"
                fill="currentColor"
              />
            </svg>
            Изменить
          </button> -->

          <div class="status-toggle">
            <label class="toggle-label">
              <input
                type="checkbox"
                :checked="item.is_active !== false"
                @change="toggleItemStatus(item.id, $event.target.checked)"
              />
              <span class="toggle-slider"></span>
              <span class="status-text">
                {{ item.is_active !== false ? 'Активно' : 'Стоп' }}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isLoading && menuItems.length === 0" class="empty-state">
      <div class="empty-icon">🍽️</div>
      <h3>Меню пусто</h3>
      <p>Добавьте первое блюдо в меню</p>
      <button class="add-btn" @click="addNewItem">Добавить блюдо</button>
    </div>

    <!-- Popup для редактирования/добавления блюда -->
    <EditItemPopup
      :show="showEditPopup"
      :item="selectedItem"
      :is-edit-mode="isEditMode"
      @save="handleSave"
      @close="closeEditPopup"
    />

    <!-- Popup для управления категориями -->
    <div v-if="showCategoriesPopup" class="popup-overlay" @click="closeCategoriesPopup">
      <div class="categories-popup" @click.stop>
        <div class="popup-header">
          <h2>Управление категориями</h2>
          <button class="close-btn" @click="closeCategoriesPopup">×</button>
        </div>

        <div class="categories-content">
          <!-- Форма добавления новой категории -->
          <div class="add-category-form">
            <h3>Добавить новую категорию</h3>
            <div class="form-row">
              <input
                v-model="newCategoryName"
                type="text"
                placeholder="Название категории"
                class="category-input"
                @keyup.enter="createNewCategory"
              />
              <button
                class="btn-save-category"
                @click="createNewCategory"
                :disabled="!newCategoryName.trim()"
              >
                +
              </button>
            </div>
          </div>

          <!-- Список существующих категорий -->
          <div class="categories-list">
            <h3>Существующие категории</h3>
            <div v-if="categories.length === 0" class="empty-categories">
              <p>Категории не найдены</p>
            </div>
            <div v-else class="category-items">
              <div v-for="category in categories" :key="category.id" class="category-item">
                <!-- Обычный вид категории -->
                <div
                  v-if="!editingCategory || editingCategory.id !== category.id"
                  class="category-info"
                >
                  <span class="category-name">{{ category.name }}</span>
                  <span class="category-count">
                    ({{ getItemsCountByCategory(category.id) }} блюд)
                  </span>
                </div>

                <!-- Режим редактирования -->
                <div v-else class="category-edit">
                  <input
                    v-model="editCategoryName"
                    type="text"
                    class="category-edit-input"
                    @keyup.enter="saveEditCategory"
                    @keyup.escape="cancelEditCategory"
                    placeholder="Новое название"
                  />
                  <div class="edit-actions-spacer">
                    <button
                      class="btn-save-edit"
                      @click="saveEditCategory"
                      :disabled="!editCategoryName.trim()"
                      title="Сохранить"
                    >
                      ✅
                    </button>
                    <button
                      class="btn-cancel-category"
                      @click="cancelEditCategory"
                      title="Отменить"
                    >
                      ❌
                    </button>
                  </div>
                </div>

                <div class="category-actions">
                  <!-- Обычные кнопки -->
                  <template v-if="!editingCategory || editingCategory.id !== category.id">
                    <button
                      class="btn-edit-category"
                      @click="editCategory(category)"
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                  </template>

                  <!-- В режиме редактирования показываем только кнопку удаления -->
                  <!-- Кнопка удаления (всегда показываем) -->
                  <button
                    class="btn-delete-category"
                    @click="deleteCategory(category.id)"
                    :disabled="
                      getItemsCountByCategory(category.id) > 0 ||
                      (editingCategory && editingCategory.id === category.id)
                    "
                    title="Удалить категорию"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Popup для управления рекомендациями -->
    <div v-if="showSuggestionsPopup" class="popup-overlay" @click="closeSuggestionsPopup">
      <div class="suggestions-popup" @click.stop>
        <div class="popup-header">
          <h2>Рекомендации для "{{ selectedItemForSuggestions?.name }}"</h2>
          <button class="close-btn" @click="closeSuggestionsPopup">×</button>
        </div>

        <div class="suggestions-content">
          <!-- Текущие рекомендации -->
          <div class="current-suggestions">
            <h3>Текущие рекомендации</h3>
            <div v-if="currentSuggestions.length === 0" class="empty-message">
              Рекомендаций пока нет. Добавьте блюда из списка ниже.
            </div>
            <div v-else class="suggestions-list">
              <div
                v-for="suggestion in currentSuggestions"
                :key="suggestion.id"
                class="suggestion-item"
              >
                <div class="suggestion-info">
                  <span class="suggestion-name">{{ suggestion.name }}</span>
                  <span class="suggestion-price">{{ formatPrice(suggestion.price) }} ₽</span>
                </div>
                <div class="suggestion-controls">
                  <input
                    type="number"
                    v-model.number="suggestion.priority"
                    min="1"
                    max="100"
                    class="priority-input"
                    @change="updateSuggestionPriority(suggestion)"
                  />
                  <button
                    class="btn-remove-suggestion"
                    @click="removeSuggestion(suggestion.id)"
                    title="Удалить рекомендацию"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Добавление новых рекомендаций -->
          <div class="add-suggestions">
            <h3>Добавить блюда</h3>
            <div class="available-items-list">
              <div
                v-for="item in availableMenuItems"
                :key="item.id"
                class="available-item"
                @click="addSuggestion(item)"
              >
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-category-badge">{{ getCategoryName(item.category_id) }}</span>
                </div>
                <span class="item-price">{{ formatPrice(item.price) }} ₽</span>
              </div>
            </div>
          </div>
        </div>

        <div class="popup-actions">
          <button class="btn-cancel" @click="closeSuggestionsPopup">Отмена</button>
          <button class="btn-save" @click="saveSuggestions" :disabled="isSavingSuggestions">
            {{ isSavingSuggestions ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMenuStore, useApiConfigStore, useAuthStore } from '@/stores'
import placeholderImage from '@/assets/image 28.png'
import EditItemPopup from './EditItemPopup.vue'
import './CategoryManagement.css'

const props = defineProps({
  menuItems: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
})

const emit = defineEmits([
  'edit-item',
  'toggle-status',
  'add-item',
  'retry',
  'save-item',
  'category-created',
  'category-updated',
])

// Состояние попапа редактирования
const showEditPopup = ref(false)
const selectedItem = ref(null)
const isEditMode = ref(false)

// Состояние попапа категорий
const showCategoriesPopup = ref(false)
const newCategoryName = ref('')
const editingCategory = ref(null)
const editCategoryName = ref('')

// Состояние попапа рекомендаций
const showSuggestionsPopup = ref(false)
const selectedItemForSuggestions = ref(null)
const currentSuggestions = ref([])
const isSavingSuggestions = ref(false)

// Получаем категории для отображения названий
const menuStore = useMenuStore()
const apiConfigStore = useApiConfigStore()
const authStore = useAuthStore()
const categories = computed(() => menuStore.categories || [])

const getCategoryName = (categoryId) => {
  const category = categories.value.find((cat) => cat.id === categoryId)
  return category ? category.name : 'Без категории'
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU').format(price)
}

const handleImageError = (event) => {
  event.target.src = placeholderImage
}

// Функции для работы с попапом
const editItem = (item) => {
  selectedItem.value = { ...item }
  isEditMode.value = true
  showEditPopup.value = true
}

const addNewItem = () => {
  selectedItem.value = null
  isEditMode.value = false
  showEditPopup.value = true
}

const closeEditPopup = () => {
  showEditPopup.value = false
  selectedItem.value = null
  isEditMode.value = false
}

const handleSave = (itemData) => {
  // Передаем данные наверх в OrdersPage для обработки
  emit('save-item', itemData, isEditMode.value)
  closeEditPopup()
}

// Функция переключения статуса блюда
const toggleItemStatus = async (itemId, isActive) => {
  try {
    const response = await fetch(apiConfigStore.getSecureUrl(`/menu/${itemId}/active`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_active: isActive,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('Статус блюда успешно изменен:', result)

    // Эмитим событие для обновления данных в родительском компоненте
    emit('toggle-status', itemId, isActive)

    // Можно добавить уведомление об успехе
    // alert(`Блюдо ${isActive ? 'активировано' : 'деактивировано'}`)
  } catch (error) {
    console.error('Ошибка при изменении статуса блюда:', error)
    alert(`Ошибка при изменении статуса: ${error.message}`)
  }
}

// Функции для управления категориями
const closeCategoriesPopup = () => {
  showCategoriesPopup.value = false
  newCategoryName.value = ''
  cancelEditCategory()
}

const getItemsCountByCategory = (categoryId) => {
  return props.menuItems.filter((item) => item.category_id === categoryId).length
}

const createNewCategory = async () => {
  if (!newCategoryName.value.trim()) {
    return
  }

  try {
    // Используем функцию из store
    const newCategory = await menuStore.addCategory({ name: newCategoryName.value.trim() })

    // Очищаем поле
    newCategoryName.value = ''

    // Эмитим событие для обновления фильтров в родительском компоненте
    emit('category-created', newCategory)

    // Показываем уведомление об успехе
    alert(`Категория "${newCategory.name}" успешно создана и добавлена в фильтры!`)
  } catch (error) {
    console.error('Ошибка при создании категории:', error)
    // Показываем уведомление об ошибке
    alert(`Ошибка: ${error.message}`)
  }
}

const editCategory = (category) => {
  editingCategory.value = { ...category }
  editCategoryName.value = category.name
}

const saveEditCategory = async () => {
  if (!editCategoryName.value.trim() || !editingCategory.value) {
    return
  }

  try {
    console.log('Сохранение изменений категории:', editingCategory.value.id, editCategoryName.value)

    // Используем функцию из store для обновления категории
    const updatedCategory = await menuStore.updateCategory(editingCategory.value.id, {
      name: editCategoryName.value.trim(),
    })

    console.log('Категория успешно обновлена:', updatedCategory)

    // Сбрасываем состояние редактирования
    cancelEditCategory()

    // Эмитим событие для обновления фильтров
    emit('category-updated', updatedCategory)

    alert(`Категория успешно переименована в "${updatedCategory.name}"!`)
  } catch (error) {
    console.error('Ошибка при обновлении категории:', error)
    alert(`Ошибка: ${error.message}`)
  }
}

const cancelEditCategory = () => {
  editingCategory.value = null
  editCategoryName.value = ''
}

const deleteCategory = async (categoryId) => {
  const itemsCount = getItemsCountByCategory(categoryId)
  if (itemsCount > 0) {
    alert(`Нельзя удалить категорию, в которой есть блюда (${itemsCount} блюд)`)
    return
  }

  if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
    try {
      console.log('Удаление категории:', categoryId)

      // Здесь будет API вызов для удаления категории
      // await deleteCategory(categoryId)

      // Временно удаляем из локального списка
      const index = categories.value.findIndex((cat) => cat.id === categoryId)
      if (index !== -1) {
        categories.value.splice(index, 1)
      }

      console.log('Категория успешно удалена')
    } catch (error) {
      console.error('Ошибка при удалении категории:', error)
    }
  }
}

// ========== Функции для управления рекомендациями ==========

// Доступные блюда для добавления (исключая текущее блюдо и уже добавленные рекомендации)
const availableMenuItems = computed(() => {
  if (!selectedItemForSuggestions.value) return []

  const currentItemId = selectedItemForSuggestions.value.id
  const suggestionIds = currentSuggestions.value.map((s) => s.id)

  return props.menuItems.filter(
    (item) =>
      item.id !== currentItemId && !suggestionIds.includes(item.id) && item.is_active !== false,
  )
})

// Открыть попап рекомендаций
const openSuggestionsPopup = async (item) => {
  selectedItemForSuggestions.value = item
  currentSuggestions.value = []
  showSuggestionsPopup.value = true

  // Загружаем текущие рекомендации с сервера
  await loadSuggestions(item.id)
}

// Закрыть попап рекомендаций
const closeSuggestionsPopup = () => {
  showSuggestionsPopup.value = false
  selectedItemForSuggestions.value = null
  currentSuggestions.value = []
}

// Загрузить рекомендации для блюда
const loadSuggestions = async (itemId) => {
  try {
    const response = await fetch(apiConfigStore.getSecureUrl(`/api/menu/${itemId}/suggestions`), {
      method: 'GET',
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Рекомендаций пока нет')
        currentSuggestions.value = []
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    currentSuggestions.value = data.suggestions || []
    console.log('Загружены рекомендации:', currentSuggestions.value)
  } catch (error) {
    console.error('Ошибка загрузки рекомендаций:', error)
    currentSuggestions.value = []
  }
}

// Добавить блюдо в рекомендации
const addSuggestion = (item) => {
  const maxPriority =
    currentSuggestions.value.length > 0
      ? Math.max(...currentSuggestions.value.map((s) => s.priority || 0))
      : 0

  currentSuggestions.value.push({
    id: item.id,
    name: item.name,
    price: item.price,
    priority: maxPriority + 1,
  })
}

// Удалить рекомендацию
const removeSuggestion = (suggestionId) => {
  const index = currentSuggestions.value.findIndex((s) => s.id === suggestionId)
  if (index !== -1) {
    currentSuggestions.value.splice(index, 1)
  }
}

// Обновить приоритет рекомендации
const updateSuggestionPriority = (suggestion) => {
  // Приоритет обновляется автоматически через v-model
  console.log('Обновлен приоритет:', suggestion)
}

// Сохранить рекомендации
const saveSuggestions = async () => {
  if (!selectedItemForSuggestions.value) return

  isSavingSuggestions.value = true

  try {
    const itemId = selectedItemForSuggestions.value.id

    // Формируем тело запроса
    const requestBody = {
      suggestions: currentSuggestions.value.map((s) => ({
        menu_item_id: s.id,
        priority: s.priority || 1,
      })),
    }

    console.log('Сохраняем рекомендации:', requestBody)

    const response = await fetch(
      apiConfigStore.getSecureUrl(`/api/admin/menu/${itemId}/suggestions`),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Session': authStore.sessionId || '',
        },
        body: JSON.stringify(requestBody),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
    }

    console.log('✅ Рекомендации успешно сохранены')
    alert('Рекомендации успешно сохранены!')
    closeSuggestionsPopup()
  } catch (error) {
    console.error('❌ Ошибка сохранения рекомендаций:', error)
    alert(`Ошибка сохранения: ${error.message}`)
  } finally {
    isSavingSuggestions.value = false
  }
}
</script>

<style scoped>
.menu-management {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
  padding-bottom: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
  min-width: 0;
}

.btn-categories {
  display: none; /* Скрываем кнопку категории */
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-categories:hover {
  background: #4b5563;
}

.btn-add {
  display: none; /* Скрываем кнопку добавления блюда */
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #ff6b35;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add:hover {
  background: #e55a2b;
}

.icon-plus,
.icon-folder {
  font-size: 16px;
  font-weight: bold;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b35;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  color: #dc3545;
}

.retry-btn {
  padding: 10px 20px;
  background: #ff6b35;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #e55a2b;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px 20px 40px 20px;
  width: 100%;
  box-sizing: border-box;
}

.menu-item-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.menu-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.item-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  padding: 16px;
}

.item-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.item-price {
  font-size: 20px;
  font-weight: 700;
  color: #ff6b35;
  margin: 0 0 4px 0;
}

.item-category {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.item-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  gap: 12px;
}

.edit-btn {
  display: none; /* Скрываем кнопку редактирования блюда */
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.edit-btn:hover {
  background: #e5e7eb;
}

.status-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.toggle-label input {
  display: none;
}

.toggle-slider {
  width: 44px;
  height: 24px;
  background: #ccc;
  border-radius: 24px;
  position: relative;
  transition: background 0.2s;
}

.toggle-slider:before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.toggle-label input:checked + .toggle-slider {
  background: #4caf50;
}

.toggle-label input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.status-text {
  font-weight: 600;
  color: #374151;
}

.toggle-label input:checked ~ .status-text {
  color: #059669;
}

.toggle-label input:not(:checked) ~ .status-text {
  color: #dc2626;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 24px;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 16px;
  margin: 0 0 24px 0;
}

.add-btn {
  padding: 12px 24px;
  background: #ff6b35;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #e55a2b;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-actions {
    flex-direction: column;
    gap: 12px;
  }

  .btn-add,
  .btn-categories {
    width: 100%;
    justify-content: center;
  }

  .menu-grid {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
  }

  .item-actions {
    flex-direction: column;
    gap: 12px;
  }

  .edit-btn {
    width: 100%;
    justify-content: center;
  }
}

.item-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  padding: 16px;
}

.item-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.item-price {
  font-size: 20px;
  font-weight: 700;
  color: #ff6b35;
  margin: 0 0 4px 0;
}

.item-category {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.item-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  gap: 12px;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.edit-btn:hover {
  background: #e5e7eb;
}

.status-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.toggle-label input {
  display: none;
}

.toggle-slider {
  width: 44px;
  height: 24px;
  background: #ccc;
  border-radius: 24px;
  position: relative;
  transition: background 0.2s;
}

.toggle-slider:before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.toggle-label input:checked + .toggle-slider {
  background: #4caf50;
}

.toggle-label input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.status-text {
  font-weight: 600;
  color: #374151;
}

.toggle-label input:checked ~ .status-text {
  color: #059669;
}

.toggle-label input:not(:checked) ~ .status-text {
  color: #dc2626;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 24px;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 16px;
  margin: 0 0 24px 0;
}

.add-btn {
  padding: 12px 24px;
  background: #ff6b35;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #e55a2b;
}

/* Стили для попапа рекомендаций */
.suggestions-popup {
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.suggestions-popup .popup-header {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  color: white;
  padding: 24px 32px;
  border-bottom: none;
  box-shadow: 0 4px 12px rgba(69, 160, 73, 0.2);
}

.suggestions-popup .popup-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.suggestions-popup .close-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  font-size: 24px;
  font-weight: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.suggestions-popup .close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
  border-color: rgba(255, 255, 255, 0.5);
}

.suggestions-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  background: white;
}

.suggestions-content::-webkit-scrollbar {
  width: 8px;
}

.suggestions-content::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.suggestions-content::-webkit-scrollbar-thumb {
  background: #45a049;
  border-radius: 4px;
}

.suggestions-content::-webkit-scrollbar-thumb:hover {
  background: #3d8b40;
}

.current-suggestions,
.add-suggestions {
  background: linear-gradient(135deg, #ffffff 0%, #f1f8f4 100%);
  border-radius: 16px;
  padding: 24px;
  border: 2px solid #c8e6c9;
  box-shadow: 0 4px 12px rgba(69, 160, 73, 0.08);
}

.current-suggestions h3,
.add-suggestions h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-suggestions h3::before {
  content: '⭐';
  font-size: 24px;
}

.add-suggestions h3::before {
  content: '➕';
  font-size: 20px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border: 2px solid #c8e6c9;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.suggestion-item:hover {
  background: linear-gradient(135deg, #f1f8f4 0%, #c8e6c9 100%);
  border-color: #45a049;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(69, 160, 73, 0.15);
}

.suggestion-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.suggestion-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
}

.suggestion-price {
  font-size: 14px;
  color: #45a049;
  font-weight: 600;
}

.suggestion-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.priority-input {
  width: 70px;
  padding: 8px 12px;
  border: 2px solid #45a049;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  background: white;
  color: #3d8b40;
  transition: all 0.2s ease;
}

.priority-input:focus {
  outline: none;
  border-color: #3d8b40;
  box-shadow: 0 0 0 4px rgba(69, 160, 73, 0.1);
  transform: scale(1.05);
}

.btn-remove-suggestion {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  border: 2px solid #fecaca;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-remove-suggestion:hover {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  border-color: #dc2626;
  transform: scale(1.1) rotate(-5deg);
}

.empty-message {
  padding: 32px 20px;
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 12px;
  border: 2px dashed #d1d5db;
}

.available-items-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.available-items-list::-webkit-scrollbar {
  width: 8px;
}

.available-items-list::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.available-items-list::-webkit-scrollbar-thumb {
  background: #45a049;
  border-radius: 4px;
}

.available-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: white;
  border: 2px solid #f3f4f6;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.available-item:hover {
  background: linear-gradient(135deg, #f1f8f4 0%, #c8e6c9 100%);
  border-color: #45a049;
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(69, 160, 73, 0.2);
}

.available-item .item-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.available-item .item-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
  line-height: 1.4;
}

.item-category-badge {
  align-self: flex-start;
  padding: 4px 10px;
  background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
  color: #2e7d32;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.available-item .item-price {
  font-weight: 700;
  font-size: 18px;
  color: #45a049;
  display: flex;
  align-items: center;
  gap: 4px;
}

.available-item .item-price::before {
  content: '₽';
  font-size: 14px;
}

.suggestions-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(69, 160, 73, 0.3);
}

.suggestions-btn:hover {
  background: linear-gradient(135deg, #3d8b40 0%, #2e7d32 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(69, 160, 73, 0.4);
}

.suggestions-btn:active {
  transform: translateY(0);
}

.suggestions-btn svg {
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.suggestions-popup .popup-actions {
  padding: 20px 32px;
  background: linear-gradient(to top, #f9fafb 0%, #ffffff 100%);
  border-top: 2px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.suggestions-popup .btn-cancel {
  padding: 12px 28px;
  background: white;
  color: #6b7280;
  border: 2px solid #d1d5db;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestions-popup .btn-cancel:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #374151;
}

.suggestions-popup .btn-save {
  padding: 12px 28px;
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(69, 160, 73, 0.3);
}

.suggestions-popup .btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #3d8b40 0%, #2e7d32 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(69, 160, 73, 0.4);
}

.suggestions-popup .btn-save:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 768px) {
  .suggestions-popup {
    width: 95%;
    max-height: 90vh;
  }

  .suggestions-content {
    padding: 20px;
    gap: 24px;
  }

  .current-suggestions,
  .add-suggestions {
    padding: 16px;
  }

  .available-items-list {
    grid-template-columns: 1fr;
  }

  .suggestion-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .suggestion-controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
