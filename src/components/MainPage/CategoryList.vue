<template>
  <div class="categoriesContainer">
    <div v-if="isLoading" class="loading">Загрузка категорий...</div>
    <div v-else-if="error" class="error">Ошибка: {{ error }}</div>
    <template v-else>
      <!-- Кнопка меню (показывает все категории) -->
      <div class="category">
        <button
          class="button"
          :class="{ active: selectedCategory === null }"
          @click="$emit('selectCategory', null)"
        >
          <span class="buttonLabel">Меню</span>
        </button>
      </div>
      <!-- Фильтр "Акции" должен идти сразу после "Меню" -->
      <div class="category">
        <button
          class="button"
          :class="{ promo: true, active: selectedCategory === PROMO_FILTER }"
          @click="$emit('selectCategory', PROMO_FILTER)"
        >
          <span class="buttonLabel">Акции</span>
        </button>
      </div>
      <!-- Отображаем категории с сервера -->
      <template v-for="category in categories" :key="category.id">
        <div class="category">
          <button
            class="button"
            :class="{ active: selectedCategory === category.id }"
            @click="$emit('selectCategory', category.id)"
          >
            <span class="buttonLabel">{{ category.name }}</span>
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMenuStore } from '@/stores'

const props = defineProps({
  selectedCategory: {
    type: String,
    default: null,
  },
})

defineEmits(['selectCategory'])

// Используем store для получения категорий
const menuStore = useMenuStore()
const categories = computed(() => menuStore.categories)
const isLoading = computed(() => menuStore.isLoading)
const error = computed(() => menuStore.error)

const PROMO_FILTER = '__PROMO__'
</script>

<style scoped>
.categoriesContainer {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: transparent;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  min-width: 0;
}

.category {
  flex: none;
}

.loading,
.error {
  padding: 20px;
  text-align: center;
  font-size: 16px;
  color: #666;
}

.error {
  color: #d32f2f;
  background: #ffebee;
  border-radius: 8px;
  border: 1px solid #ffcdd2;
}

.button {
  background: white;
  font-size: 18px;
  font-weight: 600;
  color: #8a8a8a;
  border-radius: 50px;
  padding: 0 18px;
  border: none;
  width: 135px;
  max-width: 135px;
  min-width: 135px;
  height: 55px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.buttonLabel {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.button.promo {
  background-image: linear-gradient(90deg, #d41313 0%, #ffbcbc 100%);
  color: #ffffff;
}

.button.promo:hover {
  background-image: linear-gradient(90deg, #d41313 0%, #ffbcbc 100%);
}

.button.promo.active {
  background-image: linear-gradient(90deg, #d41313 0%, #ffbcbc 100%);
  color: #ffffff;
}

.button:hover {
  background: #f8f9fa;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.button.active {
  background: white;
  color: #ff0606;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

@media (max-width: 1115px) {
  .categoriesContainer {
    padding: 12px 12px;
  }

  .button {
    font-size: 16px;
    padding: 0 16px;
    height: 52px;
    width: 135px;
    max-width: 135px;
    min-width: 135px;
  }
}
</style>
