<template>
  <div class="filter-container" :class="containerClass">
    <button
      v-for="filter in filters"
      :key="filter.value"
      class="control-button filter-btn"
      :class="{
        active: activeFilter === filter.value,
        ...filter.class,
      }"
      @click="handleFilterChange(filter.value)"
      :disabled="filter.disabled"
    >
      <span v-if="filter.icon" class="filter-icon" v-html="filter.icon"></span>
      <span class="filter-label">{{ filter.label }}</span>
      <span v-if="filter.count !== undefined" class="filter-count">{{ filter.count }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Активный фильтр
  activeFilter: {
    type: String,
    required: true,
  },

  // Массив фильтров для отображения
  filters: {
    type: Array,
    required: true,
    validator: (filters) => {
      return filters.every(
        (filter) => typeof filter === 'object' && 'value' in filter && 'label' in filter,
      )
    },
  },

  // Дополнительные CSS классы для контейнера
  containerClass: {
    type: [String, Object, Array],
    default: '',
  },

  // Размер кнопок
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },

  // Вариант отображения
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'compact', 'pills'].includes(value),
  },

  // Разрешить множественный выбор
  multiple: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['filter-change', 'update:activeFilter'])

// Вычисляемые классы для кнопок в зависимости от размера и варианта
const buttonClasses = computed(() => {
  const classes = []

  if (props.size === 'small') classes.push('size-small')
  if (props.size === 'large') classes.push('size-large')

  if (props.variant === 'compact') classes.push('variant-compact')
  if (props.variant === 'pills') classes.push('variant-pills')

  return classes.join(' ')
})

const handleFilterChange = (filterValue) => {
  if (props.multiple) {
    // Логика для множественного выбора (если понадобится в будущем)
    const currentFilters = Array.isArray(props.activeFilter)
      ? props.activeFilter
      : [props.activeFilter]

    const newFilters = currentFilters.includes(filterValue)
      ? currentFilters.filter((f) => f !== filterValue)
      : [...currentFilters, filterValue]

    emit('filter-change', newFilters)
    emit('update:activeFilter', newFilters)
  } else {
    emit('filter-change', filterValue)
    emit('update:activeFilter', filterValue)
  }
}
</script>

<style scoped>
.filter-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  background-color: #a5d9ff;
  padding: 14px 16px;
  border-radius: 15px;
  margin-top: 5px;
  overflow-x: auto;
  overflow-y: hidden;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.filter-container::-webkit-scrollbar {
  height: 8px;
}

.filter-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.filter-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.filter-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.control-button {
  display: flex;
  outline: none;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: none;
  border-radius: 25px;
  font-size: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f0f0f0;
  color: #333;
  position: relative;
  gap: 8px;
  flex-shrink: 0;
  white-space: nowrap;

  /* Размер по умолчанию (medium) */
  max-width: 284px;
  min-width: 200px;
  padding: 23px 30px;
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-button:not(:disabled):hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
}

.control-button.active {
  background-color: #4caf50;
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* Специальные стили для статусов заказов */
.control-button.status-preparing.active {
  background-color: #ff9800;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

.control-button.status-ready.active {
  background-color: #2196f3;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.control-button.status-completed.active {
  background-color: #4caf50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.control-button.status-cancelled.active {
  background-color: #f44336;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

/* Размеры кнопок */
.control-button.size-small {
  max-width: 180px;
  min-width: 150px;
  padding: 12px 24px;
  font-size: 16px;
}

.control-button.size-large {
  max-width: 350px;
  min-width: 300px;
  padding: 28px 110px;
  font-size: 28px;
}

/* Варианты отображения */
.filter-container.variant-compact {
  background-color: transparent;
  padding: 0;
  gap: 8px;
}

.variant-compact .control-button {
  min-width: auto;
  padding: 12px 20px;
  font-size: 16px;
  border-radius: 8px;
}

.variant-pills .control-button {
  border-radius: 50px;
  min-width: auto;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
}

/* Элементы внутри кнопок */
.filter-icon {
  font-size: 0.9em;
  opacity: 0.8;
}

.filter-label {
  white-space: nowrap;
}

.filter-count {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.8em;
  font-weight: bold;
  margin-left: 4px;
}

.control-button.active .filter-count {
  background: rgba(255, 255, 255, 0.3);
}

/* Адаптивность */
@media (max-width: 768px) {
  .filter-container {
    gap: 12px;
    padding: 12px;
    flex-wrap: wrap;
  }

  .control-button {
    min-width: auto;
    flex: 1;
    padding: 16px 20px;
    font-size: 18px;
  }

  .control-button.size-small {
    padding: 10px 16px;
    font-size: 14px;
  }

  .control-button.size-large {
    padding: 20px 24px;
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .filter-container {
    flex-direction: column;
    gap: 8px;
  }

  .control-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
