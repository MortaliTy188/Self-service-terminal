/**
 * Утилиты для работы с заказами
 */

/**
 * Форматирует номер заказа в читаемый вид
 * @param {string} orderId - ID заказа (например: "ord_1728490123456" или "123456")
 * @returns {string} - Отформатированный номер (например: "#4901")
 */
export const formatOrderNumber = (orderId) => {
  if (!orderId) return '#0000'

  // Убираем префикс "ord_" если есть
  const cleanId = orderId.toString().replace(/^ord_/, '')

  // Берем последние 4 цифры и добавляем решетку
  const lastFourDigits = cleanId.slice(-4).padStart(4, '0')
  return `#${lastFourDigits}`
}

/**
 * Генерирует читаемый номер заказа для отображения на основе времени
 * @returns {string} - Читаемый номер заказа (например: "#4901")
 */
export const generateReadableOrderNumber = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')

  // Используем часы и минуты для создания читаемого номера
  return `#${hours}${minutes}`
}

/**
 * Создает уникальный ID заказа для API
 * @returns {string} - Уникальный ID заказа (например: "ord_1728490123456")
 */
export const generateOrderId = () => {
  return `ord_${Date.now()}`
}
