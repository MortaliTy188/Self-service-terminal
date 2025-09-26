# FilterButtons - Переиспользуемый компонент фильтров

## Описание

Универсальный компонент для создания кнопок-фильтров с поддержкой различных размеров, стилей и конфигураций.

## Пропсы

### activeFilter (required)

- **Тип:** `String`
- **Описание:** Текущий активный фильтр

### filters (required)

- **Тип:** `Array`
- **Описание:** Массив объектов фильтров
- **Структура объекта:**
  ```javascript
  {
    value: String,        // Значение фильтра (обязательно)
    label: String,        // Отображаемый текст (обязательно)
    icon: String,         // HTML иконка (опционально)
    count: Number,        // Счетчик элементов (опционально)
    disabled: Boolean,    // Отключен ли фильтр (опционально)
    class: Object|String  // Дополнительные CSS классы (опционально)
  }
  ```

### containerClass

- **Тип:** `String | Object | Array`
- **По умолчанию:** `''`
- **Описание:** Дополнительные CSS классы для контейнера

### size

- **Тип:** `String`
- **По умолчанию:** `'medium'`
- **Варианты:** `'small'`, `'medium'`, `'large'`
- **Описание:** Размер кнопок

### variant

- **Тип:** `String`
- **По умолчанию:** `'default'`
- **Варианты:** `'default'`, `'compact'`, `'pills'`
- **Описание:** Вариант отображения

### multiple

- **Тип:** `Boolean`
- **По умолчанию:** `false`
- **Описание:** Разрешить множественный выбор

## События

### filter-change

- **Параметры:** `filterValue`
- **Описание:** Срабатывает при изменении фильтра

### update:activeFilter

- **Параметры:** `filterValue`
- **Описание:** Для поддержки v-model

## Пример использования

```vue
<template>
  <FilterButtons
    :active-filter="activeFilter"
    :filters="orderFilters"
    size="medium"
    variant="default"
    @filter-change="handleFilterChange"
  />
</template>

<script setup>
import { FilterButtons } from '@/components/common'

const activeFilter = ref('all')

const orderFilters = computed(() => [
  {
    value: 'all',
    label: 'Все заказы',
    icon: '📋',
    count: 15,
  },
  {
    value: 'pending',
    label: 'В ожидании',
    icon: '⏳',
    count: 5,
    class: { 'status-pending': true },
  },
  {
    value: 'completed',
    label: 'Выполненные',
    icon: '✅',
    count: 10,
  },
])

const handleFilterChange = (value) => {
  activeFilter.value = value
}
</script>
```

## CSS классы

### Размеры

- `.size-small` - маленькие кнопки
- `.size-large` - большие кнопки

### Варианты

- `.variant-compact` - компактный вид без фона
- `.variant-pills` - скругленные кнопки-пилюли

### Состояния

- `.active` - активная кнопка
- `:disabled` - отключенная кнопка
