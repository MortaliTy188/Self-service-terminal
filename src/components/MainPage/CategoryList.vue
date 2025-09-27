<template>
  <div class="categoriesContainer">
    <div v-if="isLoading" class="loading">Загрузка категорий...</div>
    <div v-else-if="error" class="error">Ошибка: {{ error }}</div>
    <div v-else>
      <!-- Добавляем кнопку "Все категории" -->
      <div class="category">
        <button
          class="button"
          :class="{ active: selectedCategory === null }"
          @click="$emit('selectCategory', null)"
        >
          Все категории
        </button>
      </div>
      <!-- Отображаем категории с сервера -->
      <div v-for="category in categories" :key="category.id" class="category">
        <button
          class="button"
          :class="{ active: selectedCategory === category.id }"
          @click="$emit('selectCategory', category.id)"
        >
          {{ category.name }}
        </button>
      </div>
    </div>
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
</script>

<style scoped>
.categoriesContainer {
  flex: none;
  display: flex;
  align-items: center;
  padding: 20px 15px;
  flex-direction: column;
  gap: 12px;
  background: white;
  overflow-y: auto;
  max-height: 100%;
  width: 280px;
  min-width: 280px;
  border-radius: 20px;
  border: 1px solid #333;
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
  font-size: 22px;
  font-weight: 600;
  color: #333;
  border-radius: 15px;
  padding: 18px 24px;
  border: 2px solid #f0f0f0;
  width: 100%;
  max-width: 250px;
  min-width: 207px;
  height: 70px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.button:hover {
  background: #f8f9fa;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #e0e0e0;
}

.button.active {
  background: #4caf50;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
  border-color: #4caf50;
}
</style>
