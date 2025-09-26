# Функционал вызова официанта

## Описание

Реализована система вызова официанта с уведомлениями между страницами клиента (MainPage) и администратора (OrdersPage).

## Архитектура

### Хуки (Hooks)

- `useWaiterNotifications.js` - основная логика для работы с вызовами официанта

### Компоненты

- `WaiterPopup.vue` - popup для клиентской страницы с индикацией загрузки
- `WaiterNotificationPopup.vue` - popup уведомления для административной страницы

## Логика работы

### 1. Вызов официанта (MainPage)

```javascript
// Пользователь нажимает кнопку "Вызвать официанта"
const callWaiter = async () => {
  showWaiterPopup.value = true

  const tableNumber = 5 // номер стола

  try {
    // Отправка запроса на сервер
    const result = await callWaiterAPI(tableNumber)

    if (result.success) {
      // Создание уведомления для демонстрации
      simulateNewNotification(tableNumber)
    }
  } catch (error) {
    console.error('Ошибка при вызове официанта:', error)
  }
}
```

### 2. Получение уведомлений (OrdersPage)

```javascript
// Отслеживание новых уведомлений
watch(
  notifications,
  (newNotifications, oldNotifications) => {
    if (newNotifications.length > 0 && oldNotifications) {
      const pendingNotifications = newNotifications.filter(
        (n) => n.status === 'pending' && !oldNotifications.some((old) => old.id === n.id),
      )

      if (pendingNotifications.length > 0) {
        showNewNotification(pendingNotifications[0])
      }
    }
  },
  { deep: true },
)
```

## API Эндпоинты (закомментированы)

### Вызов официанта

```javascript
// POST /waiter/call
{
  "tableNumber": 5,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "type": "waiter_call"
}
```

### Получение уведомлений

```javascript
// GET /waiter/notifications
// Возвращает массив уведомлений
```

### Отметка как выполненное

```javascript
// PATCH /waiter/notifications/{id}/resolve
```

### Удаление уведомления

```javascript
// DELETE /waiter/notifications/{id}
```

## Заглушки для тестирования

### Данные уведомлений

```javascript
const mockNotifications = [
  {
    id: 1,
    tableNumber: 5,
    timestamp: new Date(Date.now() - 300000).toISOString(),
    type: 'waiter_call',
    status: 'pending',
    message: 'Клиент вызывает официанта',
  },
]
```

### Имитация вызова

- При вызове официанта на MainPage создается новое уведомление
- Уведомление появляется в списке на OrdersPage
- Показывается popup с деталями вызова

## Интеграция с реальным сервером

1. Раскомментировать реальные API вызовы в `useWaiterNotifications.js`
2. Раскомментировать методы API в `api.js`
3. Настроить WebSocket для real-time уведомлений
4. Убрать заглушки и симуляции

## Статусы уведомлений

- `pending` - ожидает обработки
- `resolved` - обработано официантом

## UI/UX особенности

- Индикация загрузки при отправке запроса
- Автоматическое появление popup при новых уведомлениях
- Возможность отметить уведомление как выполненное
- Адаптивный дизайн для мобильных устройств
