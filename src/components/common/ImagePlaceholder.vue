<template>
  <div class="image-placeholder">
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      class="placeholder-svg"
    >
      <rect width="100%" height="100%" fill="#f3f4f6" />

      <!-- Иконка блюда -->
      <g transform="translate(100, 100)">
        <!-- Тарелка -->
        <circle cx="0" cy="10" r="45" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2" />

        <!-- Еда на тарелке -->
        <circle cx="-15" cy="5" r="12" fill="#fbbf24" />
        <circle cx="10" cy="8" r="10" fill="#f59e0b" />
        <circle cx="0" cy="-5" r="8" fill="#dc2626" />

        <!-- Столовые приборы -->
        <line x1="-55" y1="-20" x2="-55" y2="25" stroke="#9ca3af" stroke-width="2" />
        <line x1="-60" y1="-15" x2="-50" y2="-15" stroke="#9ca3af" stroke-width="2" />
        <line x1="-57" y1="-10" x2="-53" y2="-10" stroke="#9ca3af" stroke-width="2" />

        <line x1="55" y1="-20" x2="55" y2="25" stroke="#9ca3af" stroke-width="2" />
        <line x1="50" y1="-15" x2="60" y2="-15" stroke="#9ca3af" stroke-width="2" />
      </g>

      <!-- Текст -->
      <text
        x="100"
        y="170"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="12"
        fill="#6b7280"
      >
        Фото блюда
      </text>
    </svg>
  </div>
</template>

<style scoped>
.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 8px;
}

.placeholder-svg {
  max-width: 200px;
  max-height: 200px;
}
</style>
