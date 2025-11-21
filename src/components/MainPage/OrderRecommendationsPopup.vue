<template>
  <Transition name="popup">
    <div v-if="show" class="popup-overlay" @click.self="$emit('close')">
      <div class="popup-container">
        <div class="popup-header">
          <h2>Дополните ваш заказ</h2>
          <p class="subtitle">Мы подобрали рекомендации к вашим блюдам</p>
          <button class="close-btn" @click="$emit('close')">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="popup-content">
          <!-- Текущая корзина -->
          <div class="cart-summary">
            <h3>Ваш заказ</h3>
            <div class="cart-items-list">
              <div v-for="item in cartItems" :key="item.id" class="cart-item">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-quantity">× {{ item.quantity }}</span>
                <span class="item-price">{{ (item.price * item.quantity).toFixed(2) }} ₽</span>
              </div>
            </div>
            <div class="cart-total">
              <span>Итого:</span>
              <span class="total-price">{{ totalPrice.toFixed(2) }} ₽</span>
            </div>
          </div>

          <!-- Рекомендации -->
          <div v-if="recommendedItems.length > 0" class="recommendations-section">
            <h3>Рекомендуем к вашему заказу</h3>
            <div class="recommendations-grid">
              <div
                v-for="item in recommendedItems"
                :key="item.id"
                class="recommendation-card"
                :class="{ added: isItemInCart(item.id) }"
                @click="toggleRecommendation(item)"
              >
                <div class="recommendation-image">
                  <img
                    :src="item.image || item.image_url || '/placeholder-food.png'"
                    :alt="item.name"
                    @error="handleImageError"
                  />
                  <div v-if="isItemInCart(item.id)" class="added-badge">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>
                <div class="recommendation-info">
                  <h4>{{ item.name }}</h4>
                  <p class="recommendation-description">{{ item.description }}</p>
                  <div class="recommendation-footer">
                    <span class="recommendation-price">{{ item.price.toFixed(2) }} ₽</span>
                    <button
                      class="add-recommendation-btn"
                      :class="{ added: isItemInCart(item.id) }"
                      @click.stop="toggleRecommendation(item)"
                    >
                      {{ isItemInCart(item.id) ? 'Добавлено' : 'Добавить' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Кнопки действий -->
          <div class="actions">
            <button class="cancel-btn" @click="$emit('close')">Отменить</button>
            <button class="confirm-btn" @click="confirmOrder" :disabled="isLoading">
              <span v-if="!isLoading">Оформить заказ</span>
              <span v-else class="loading-spinner"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useOrdersStore, useMenuStore } from '@/stores'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  cartItems: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['close', 'confirm-order'])

const ordersStore = useOrdersStore()
const menuStore = useMenuStore()

const recommendedItems = ref([])
const addedRecommendations = ref([])
const isLoading = ref(false)

// Вычисляемая общая сумма с учетом добавленных рекомендаций
const totalPrice = computed(() => {
  const cartTotal = props.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const recommendationsTotal = addedRecommendations.value.reduce((sum, item) => sum + item.price, 0)
  return cartTotal + recommendationsTotal
})

// Проверка, добавлена ли рекомендация в корзину
const isItemInCart = (itemId) => {
  return addedRecommendations.value.some((item) => item.id === itemId)
}

// Загрузка рекомендаций для блюд в корзине
const loadRecommendations = async () => {
  if (!props.cartItems || props.cartItems.length === 0) {
    recommendedItems.value = []
    return
  }

  try {
    // Используем отдельные запросы для каждого блюда в корзине
    const allRecommendations = []
    const uniqueIds = new Set()

    console.log('🔄 Загружаем рекомендации для', props.cartItems.length, 'блюд(а)')

    for (const cartItem of props.cartItems) {
      try {
        const url = `http://83.222.9.90:8080/api/menu/${cartItem.id}/suggestions`
        console.log(`📤 Запрос рекомендаций для "${cartItem.name}" (${cartItem.id})`)

        const response = await fetch(url)

        if (response.ok) {
          const data = await response.json()
          console.log(`📥 Ответ для "${cartItem.name}":`, data)

          // API возвращает объект вида { suggestions: [...] }
          const suggestions = data.suggestions || []

          console.log(`  📋 Найдено ${suggestions.length} рекомендаций`)

          suggestions.forEach((suggestion) => {
            console.log('    🔍 Обрабатываем:', suggestion)

            // В suggestion содержатся поля: id, name, price, priority
            const itemId = suggestion.id

            if (itemId && !uniqueIds.has(itemId)) {
              uniqueIds.add(itemId)

              // Получаем полную информацию о блюде из меню
              const menuItem = menuStore.getMenuItemById(itemId)

              if (menuItem && menuItem.is_active !== false) {
                allRecommendations.push({
                  ...menuItem,
                  priority: suggestion.priority || 0,
                })
                console.log(`    ✅ Добавлено: ${menuItem.name}`)
              } else if (!menuItem) {
                console.warn(`    ⚠️ Блюдо ${suggestion.name} (${itemId}) не найдено в меню`)
              } else {
                console.warn(`    ⚠️ Блюдо ${menuItem.name} неактивно`)
              }
            } else if (!itemId) {
              console.warn('    ⚠️ Не удалось извлечь ID из рекомендации')
            }
          })
        } else if (response.status === 404) {
          console.log(`  ℹ️ Для "${cartItem.name}" рекомендаций не настроено`)
        } else {
          console.warn(`  ⚠️ Ошибка ${response.status} при загрузке рекомендаций`)
        }
      } catch (error) {
        console.error(`  ❌ Ошибка запроса для "${cartItem.name}":`, error)
      }
    }

    // Сортируем по приоритету
    allRecommendations.sort((a, b) => (a.priority || 0) - (b.priority || 0))

    recommendedItems.value = allRecommendations
    console.log('✅ Итого загружено рекомендаций:', allRecommendations.length)

    if (allRecommendations.length === 0) {
      console.log('ℹ️ Рекомендации не найдены или не настроены для блюд в корзине')
    }
  } catch (error) {
    console.error('❌ Общая ошибка загрузки рекомендаций:', error)
  }
}

// Добавление/удаление рекомендации
const toggleRecommendation = async (item) => {
  const index = addedRecommendations.value.findIndex((r) => r.id === item.id)

  if (index > -1) {
    // Удаляем из списка добавленных
    addedRecommendations.value.splice(index, 1)
  } else {
    // Добавляем в список
    addedRecommendations.value.push(item)
  }
}

// Подтверждение заказа
const confirmOrder = async () => {
  isLoading.value = true

  try {
    // Добавляем все рекомендации в корзину на сервере
    for (const item of addedRecommendations.value) {
      await ordersStore.addToCartServer(item.id, 1)
    }

    // Небольшая задержка для обработки на сервере
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Передаем событие подтверждения заказа
    emit('confirm-order')
  } catch (error) {
    console.error('❌ Ошибка при добавлении рекомендаций:', error)
  } finally {
    isLoading.value = false
  }
}

// Обработка ошибок загрузки изображений
const handleImageError = (event) => {
  event.target.src = '/placeholder-food.png'
}

// Загружаем рекомендации при открытии модалки
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      addedRecommendations.value = []
      loadRecommendations()
    }
  },
)
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  padding: 20px;
}

.popup-container {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 1100px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popup-header {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  color: white;
  padding: 28px 36px;
  position: relative;
}

.popup-header h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 15px;
  opacity: 0.95;
  margin: 0;
  font-weight: 400;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
  backdrop-filter: blur(10px);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.popup-content {
  overflow-y: auto;
  padding: 28px 36px;
  flex: 1;
}

.popup-content::-webkit-scrollbar {
  width: 8px;
}

.popup-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.popup-content::-webkit-scrollbar-thumb {
  background: #45a049;
  border-radius: 4px;
}

.cart-summary {
  background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 28px;
  border: 2px solid #c8e6c9;
}

.cart-summary h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #2e7d32;
}

.cart-items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 10px;
  font-size: 15px;
}

.item-name {
  flex: 1;
  font-weight: 600;
  color: #333;
}

.item-quantity {
  color: #666;
  margin: 0 16px;
  font-weight: 500;
}

.item-price {
  font-weight: 700;
  color: #45a049;
  min-width: 80px;
  text-align: right;
}

.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 2px solid #c8e6c9;
  font-size: 18px;
  font-weight: 700;
}

.total-price {
  color: #45a049;
  font-size: 24px;
}

.recommendations-section {
  margin-bottom: 28px;
}

.recommendations-section h3 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: #333;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.recommendation-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.recommendation-card:hover {
  border-color: #45a049;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(69, 160, 73, 0.2);
}

.recommendation-card.added {
  border-color: #45a049;
  background: linear-gradient(135deg, #f1f8f4 0%, #c8e6c9 100%);
}

.recommendation-image {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: #f3f4f6;
}

.recommendation-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.recommendation-card:hover .recommendation-image img {
  transform: scale(1.1);
}

.added-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #45a049;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(69, 160, 73, 0.4);
}

.recommendation-info {
  padding: 16px;
}

.recommendation-info h4 {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #333;
}

.recommendation-description {
  font-size: 13px;
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 36px;
}

.recommendation-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recommendation-price {
  font-size: 20px;
  font-weight: 700;
  color: #45a049;
}

.add-recommendation-btn {
  padding: 8px 16px;
  background: #45a049;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-recommendation-btn:hover {
  background: #3d8b40;
  transform: scale(1.05);
}

.add-recommendation-btn.added {
  background: #2e7d32;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 2px solid #e5e7eb;
}

.cancel-btn {
  padding: 14px 32px;
  background: #f3f4f6;
  color: #333;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.confirm-btn {
  padding: 14px 40px;
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(69, 160, 73, 0.3);
  min-width: 200px;
  position: relative;
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #3d8b40 0%, #2e7d32 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(69, 160, 73, 0.4);
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.3s ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
}
</style>
