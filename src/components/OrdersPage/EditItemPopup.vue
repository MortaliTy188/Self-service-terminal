<template>
  <div v-if="show" class="popup-overlay" @click="closePopup">
    <div class="popup-container" @click.stop>
      <div class="popup-header">
        <h2>{{ isEditMode ? 'Редактирование блюда' : 'Добавление блюда' }}</h2>
        <button class="close-btn" @click="closePopup">×</button>
      </div>

      <form @submit.prevent="saveChanges" class="edit-form">
        <div class="form-row">
          <!-- Изображение -->
          <div class="image-section">
            <div class="image-preview">
              <img
                :src="editedItem.image || placeholderImage"
                :alt="editedItem.name"
                @error="handleImageError"
                class="preview-image"
              />
              <div class="image-overlay">
                <button type="button" class="change-image-btn" @click="triggerFileInput">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 9V22H21V9L12 2Z" stroke="currentColor" stroke-width="2" />
                    <path d="M12 15.5L16 11.5H13V6H11V11.5H8L12 15.5Z" fill="currentColor" />
                  </svg>
                  Изменить фото
                </button>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              class="hidden-file-input"
            />
            <p class="image-hint">Загрузите изображение или укажите URL</p>
            <input
              v-model="editedItem.image"
              type="url"
              placeholder="https://example.com/image.jpg"
              class="image-url-input"
            />
          </div>

          <!-- Основная информация -->
          <div class="info-section">
            <div class="form-group">
              <label for="name">Название блюда *</label>
              <input
                id="name"
                v-model="editedItem.name"
                type="text"
                required
                placeholder="Введите название блюда"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="price">Цена (₽) *</label>
              <input
                id="price"
                v-model.number="editedItem.price"
                type="number"
                min="0"
                step="1"
                required
                placeholder="0"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="category">Категория *</label>
              <select id="category" v-model="editedItem.category_id" required class="form-select">
                <option value="">Выберите категорию</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
              <p class="category-hint">Управление категориями доступно в разделе "Категории"</p>
            </div>

            <div class="form-group">
              <label for="weight">Вес (г)</label>
              <input
                id="weight"
                v-model.number="editedItem.weight"
                type="number"
                min="0"
                placeholder="0"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="calories">Калории</label>
              <input
                id="calories"
                v-model.number="editedItem.calories"
                type="number"
                min="0"
                placeholder="0"
                class="form-input"
              />
            </div>
          </div>
        </div>

        <div class="form-group full-width">
          <label for="description">Описание</label>
          <textarea
            id="description"
            v-model="editedItem.description"
            rows="4"
            placeholder="Введите описание блюда..."
            class="form-textarea"
          ></textarea>
        </div>

        <div class="form-group full-width">
          <label for="ingredients">Состав</label>
          <textarea
            id="ingredients"
            v-model="editedItem.ingredients"
            rows="3"
            placeholder="Перечислите ингредиенты..."
            class="form-textarea"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="editedItem.isActive" type="checkbox" class="form-checkbox" />
              <span class="checkbox-text">Активное блюдо</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="editedItem.isRecommended" type="checkbox" class="form-checkbox" />
              <span class="checkbox-text">Рекомендуемое</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="editedItem.isVegetarian" type="checkbox" class="form-checkbox" />
              <span class="checkbox-text">Вегетарианское</span>
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="closePopup">Отмена</button>
          <button type="submit" class="btn-primary" :disabled="!isFormValid">
            Сохранить изменения
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCategories } from '@/hooks'
import placeholderImage from '@/assets/image 28.png'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  item: {
    type: Object,
    default: () => ({}),
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'save'])

// Получаем категории
const { categories } = useCategories()

// Реф для файла
const fileInput = ref(null)

// Редактируемый элемент
const editedItem = ref({
  id: null,
  name: '',
  price: 0,
  category_id: '',
  image: '',
  description: '',
  ingredients: '',
  weight: 0,
  calories: 0,
  isActive: true,
  isRecommended: false,
  isVegetarian: false,
})

// Валидация формы
const isFormValid = computed(() => {
  return editedItem.value.name.trim() && editedItem.value.price > 0 && editedItem.value.category_id
})

// Следим за изменением пропсов show и item
watch(
  [() => props.show, () => props.item, () => props.isEditMode],
  ([show, newItem, isEdit]) => {
    if (show) {
      if (newItem && isEdit) {
        // Режим редактирования - заполняем данными существующего элемента
        editedItem.value = {
          id: newItem.id || null,
          name: newItem.name || '',
          price: newItem.price || 0,
          category_id: newItem.category_id || '',
          image: newItem.image || '',
          description: newItem.description || '',
          ingredients: newItem.ingredients || '',
          weight: newItem.weight || 0,
          calories: newItem.calories || 0,
          isActive: newItem.isActive !== false,
          isRecommended: newItem.isRecommended || false,
          isVegetarian: newItem.isVegetarian || false,
        }
      } else if (!isEdit) {
        // Режим добавления - сбрасываем форму
        editedItem.value = {
          id: null,
          name: '',
          price: 0,
          category_id: '',
          image: '',
          description: '',
          ingredients: '',
          weight: 0,
          calories: 0,
          isActive: true,
          isRecommended: false,
          isVegetarian: false,
        }
      }
    }
  },
  { immediate: true },
)

const closePopup = () => {
  emit('close')
}

const saveChanges = () => {
  if (isFormValid.value) {
    emit('save', { ...editedItem.value })
    closePopup()
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleImageUpload = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    // Создаем URL для предварительного просмотра
    const imageUrl = URL.createObjectURL(file)
    editedItem.value.image = imageUrl

    // Здесь можно добавить логику загрузки файла на сервер
    // Пока используем локальный URL для предпросмотра
  }
}

const handleImageError = (event) => {
  event.target.src = placeholderImage
}
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.popup-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0;
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 24px;
}

.popup-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.edit-form {
  padding: 0 24px 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.image-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-preview {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px dashed #d1d5db;
  margin: 0 auto;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.change-image-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  color: #374151;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.change-image-btn:hover {
  background: #f3f4f6;
}

.hidden-file-input {
  display: none;
}

.image-hint {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  margin: 0;
}

.image-url-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-select,
.form-textarea {
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #ff6b35;
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-direction: row !important;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #ff6b35;
}

.checkbox-text {
  font-size: 14px;
  color: #374151;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary,
.btn-primary {
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  min-width: 120px;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #ff6b35;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #e55a2b;
}

.btn-primary:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

/* Стили для подсказки о категориях */
.category-hint {
  font-size: 12px;
  color: #6b7280;
  margin: 4px 0 0 0;
  font-style: italic;
}

@media (max-width: 768px) {
  .popup-container {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .image-preview {
    width: 150px;
    height: 150px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-secondary,
  .btn-primary {
    width: 100%;
  }

  .new-category-form .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .btn-save-category,
  .btn-cancel-category {
    width: 100%;
  }
}
</style>
