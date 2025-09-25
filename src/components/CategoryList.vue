<template>
  <div class="categoriesContainer">
    <div v-for="(category, index) in categories" :key="index" class="category">
      <button
        class="button"
        :class="{ active: selectedCategory === category }"
        @click="$emit('selectCategory', category)"
      >
        {{ category }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  categories: {
    type: Array,
    required: true,
  },
  selectedCategory: {
    type: String,
    default: 'Все категории',
  },
})

defineEmits(['selectCategory'])
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
