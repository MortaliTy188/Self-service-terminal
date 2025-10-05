<template>
  <div class="server-mode-selector">
    <h3 class="section-title">Режим сервера</h3>
    <div class="mode-options">
      <div
        class="mode-option"
        :class="{ active: apiConfigStore.currentMode === 'local' }"
        @click="switchToLocal"
      >
        <div class="mode-icon">🖥️</div>
        <div class="mode-info">
          <h4>Локальный сервер</h4>
          <p>localhost:8080</p>
          <small>Разработка и тестирование</small>
        </div>
      </div>

      <div
        class="mode-option"
        :class="{ active: apiConfigStore.currentMode === 'public' }"
        @click="switchToPublic"
      >
        <div class="mode-icon">🌐</div>
        <div class="mode-info">
          <h4>Публичный сервер</h4>
          <p>83.222.9.90:8080</p>
          <small>Продакшн сервер</small>
        </div>
      </div>
    </div>

    <div class="current-config">
      <p><strong>Текущий URL:</strong> {{ apiConfigStore.baseUrl }}</p>
    </div>
  </div>
</template>

<script setup>
import { useApiConfigStore } from '@/stores/apiConfig'

const apiConfigStore = useApiConfigStore()

const switchToLocal = () => {
  apiConfigStore.switchServerMode('local')
}

const switchToPublic = () => {
  apiConfigStore.switchServerMode('public')
}
</script>

<style scoped>
.server-mode-selector {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.mode-options {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.mode-option {
  flex: 1;
  padding: 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-option:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.mode-option.active {
  border-color: #28a745;
  background: linear-gradient(135deg, #d4edda 0%, #f8f9fa 100%);
}

.mode-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.mode-info h4 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.mode-info p {
  margin: 0 0 4px 0;
  color: #666;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.mode-info small {
  color: #888;
  font-size: 12px;
}

.current-config {
  padding: 12px;
  background: #e9ecef;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.current-config p {
  margin: 0;
  color: #495057;
  font-size: 14px;
}

.current-config strong {
  color: #333;
}

@media (max-width: 768px) {
  .mode-options {
    flex-direction: column;
  }

  .mode-option {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}
</style>
