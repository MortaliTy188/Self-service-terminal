# Self Service Terminal

Система самообслуживания для ресторанов и кафе с комплексным управлением заказами, меню и административными функциями.

## 🏗️ Архитектура системы

### Технологический стек

- **Frontend Framework**: Vue 3 (Composition API)
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Build Tool**: Vite
- **Styling**: CSS3 с адаптивным дизайном
- **Linting**: ESLint + Prettier

### Структура проекта

```
src/
├── components/           # Vue компоненты
│   ├── MainPage/        # Пользовательский интерфейс
│   ├── OrdersPage/      # Административная панель
│   └── common/          # Переиспользуемые компоненты
├── stores/              # Pinia stores (состояние приложения)
├── views/               # Основные страницы-роуты
├── router/              # Маршрутизация
├── hooks/               # Композиционные функции
└── assets/              # Статические ресурсы
```

## 🗃️ Управление состоянием (Pinia Stores)

### 1. Main Store (`useMainStore`)

**Назначение**: Глобальные настройки и уведомления

**State:**

- `isLoading: boolean` - Глобальный индикатор загрузки
- `appTitle: string` - Название приложения
- `currentRoute: string` - Текущий маршрут
- `theme: object` - Настройки темы
- `globalError: string` - Глобальные ошибки
- `notifications: array` - Системные уведомления

**Actions:**

- `setLoading(loading)` - Управление глобальной загрузкой
- `setGlobalError(error)` - Обработка глобальных ошибок
- `addNotification(notification)` - Добавление уведомлений
- `removeNotification(id)` - Удаление уведомлений

### 2. Auth Store (`useAuthStore`)

**Назначение**: Аутентификация администраторов

**State:**

- `isAuthenticated: boolean` - Статус авторизации
- `sessionId: string` - ID сессии
- `sessionExpiry: timestamp` - Время истечения сессии
- `adminUser: object` - Данные админ-пользователя

**Локальные админ-ключи:**

```javascript
;['admin123', 'terminal-admin', 'management-key', 'settings-access']
```

**Actions:**

- `verifyAdminKey(adminKey)` - Проверка ключа (локально)
- `verifyAdminKeyServer(adminKey)` - Проверка через API
- `validateSession()` - Валидация сессии
- `logout()` - Выход из системы

**Server API Endpoints:**

```javascript
POST /api/admin/verify
{
  "adminKey": "string"
}
Response: {
  "success": boolean,
  "sessionId": "string",
  "expiresAt": "timestamp"
}

POST /api/admin/validate-session
{
  "sessionId": "string"
}
Response: {
  "valid": boolean
}
```

### 3. Menu Store (`useMenuStore`)

**Назначение**: Управление меню и категориями

**State:**

- `menuItems: array` - Список блюд
- `categories: array` - Категории меню
- `isLoading: boolean` - Статус загрузки
- `error: string` - Ошибки загрузки
- `selectedCategory: number` - Выбранная категория

**Computed:**

- `filteredMenuItems` - Блюда по категориям
- `categoriesWithCounts` - Категории с количеством блюд
- `availableMenuItems` - Доступные блюда

**Actions:**

- `fetchMenu()` - Загрузка меню
- `fetchCategories()` - Загрузка категорий
- `addMenuItem(item)` - Добавление блюда
- `updateMenuItem(id, updates)` - Обновление блюда
- `deleteMenuItem(id)` - Удаление блюда
- `addCategory(category)` - Добавление категории
- `updateCategory(id, updates)` - Обновление категории
- `deleteCategory(id)` - Удаление категории

**Server API Endpoints:**

```javascript
GET /api/menu
Response: [
  {
    "id": number,
    "name": "string",
    "description": "string",
    "price": number,
    "image": "string",
    "category_id": number,
    "is_available": boolean,
    "weight": number,
    "calories": number
  }
]

GET /api/categories
Response: [
  {
    "id": number,
    "name": "string",
    "color": "string",
    "is_active": boolean
  }
]

POST /api/menu - Создание блюда
PUT /api/menu/{id} - Обновление блюда
DELETE /api/menu/{id} - Удаление блюда

POST /api/categories - Создание категории
PUT /api/categories/{id} - Обновление категории
DELETE /api/categories/{id} - Удаление категории
```

### 4. Orders Store (`useOrdersStore`)

**Назначение**: Управление заказами и корзиной

**State:**

- `orders: array` - Список заказов
- `currentCart: array` - Текущая корзина
- `isLoading: boolean` - Статус загрузки
- `error: string` - Ошибки
- `lastOrder: object` - Последний заказ

**Computed:**

- `cartTotal` - Общая сумма корзины
- `cartItemsCount` - Количество товаров в корзине
- `ordersByStatus` - Заказы по статусам
- `pendingOrders` - Ожидающие заказы
- `completedOrders` - Выполненные заказы

**Order Statuses:**

- `pending` - "Готовится" (оранжевый)
- `ready` - "Готов к выдаче" (зеленый)
- `completed` - "Выполнено" (синий)
- `cancelled` - "Отменён" (красный)

**Actions:**

- `fetchOrders()` - Загрузка заказов
- `addToCart(item, quantity)` - Добавление в корзину
- `removeFromCart(itemId)` - Удаление из корзины
- `updateCartItem(itemId, quantity)` - Обновление количества
- `clearCart()` - Очистка корзины
- `createOrder(orderData)` - Создание заказа
- `updateOrderStatus(orderId, status)` - Обновление статуса

**Server API Endpoints:**

```javascript
GET /api/orders
Response: [
  {
    "id": number,
    "orderTime": "string",
    "orderType": "string",
    "tableNumber": number,
    "status": "string",
    "totalPrice": number,
    "createdAt": "timestamp",
    "cartItems": array
  }
]

POST /api/orders
{
  "tableNumber": number,
  "orderType": "string",
  "cartItems": [
    {
      "id": number,
      "name": "string",
      "price": number,
      "quantity": number
    }
  ],
  "totalPrice": number
}

PATCH /api/orders/{id}/status
{
  "status": "string"
}
```

### 5. Waiter Store (`useWaiterStore`)

**Назначение**: Система вызова официанта

**State:**

- `notifications: array` - Уведомления официанта
- `isLoading: boolean` - Статус загрузки
- `error: string` - Ошибки
- `callHistory: array` - История вызовов

**Computed:**

- `activeNotifications` - Активные уведомления
- `resolvedNotifications` - Решенные уведомления
- `notificationsByTable` - Группировка по столам
- `urgentNotifications` - Срочные уведомления (>5 мин)

**Actions:**

- `callWaiter(tableNumber)` - Вызов официанта
- `fetchNotifications()` - Загрузка уведомлений
- `markNotificationAsResolved(id)` - Отметка как решенное
- `simulateNewNotification(tableNumber)` - Симуляция уведомления
- `clearCallHistory()` - Очистка истории

**Server API Endpoints:**

```javascript
POST /api/waiter/call
{
  "tableNumber": number,
  "timestamp": "ISO string",
  "type": "waiter_call"
}

GET /api/waiter/notifications
Response: [
  {
    "id": number,
    "tableNumber": number,
    "reason": "string",
    "timestamp": "ISO string",
    "resolved": boolean,
    "urgent": boolean
  }
]

PATCH /api/waiter/notifications/{id}/resolve
DELETE /api/waiter/notifications/{id}
```

### 6. Settings Store (`useSettingsStore`)

**Назначение**: Системные настройки и конфигурация

**State:**

- `splashSettings` - Настройки заставки
- `apiSettings` - Настройки API подключения
- `systemSettings` - Системные настройки
- `deviceSettings` - Управление устройствами

**API Settings:**

- `serverUrl: "http://83.222.9.90:8080"`
- `apiKey: "string"`
- `requestTimeout: 30` (секунд)
- `syncInterval: 300` (секунд)
- `isConnected: boolean`

**Actions:**

- `testApiConnection()` - Тест подключения к серверу
- `updateApiSettings(settings)` - Обновление настроек API
- `exportSettings()` - Экспорт конфигурации
- `importSettings(file)` - Импорт конфигурации

**Health Check Endpoint:**

```javascript
GET /api/health
Headers: {
  "Authorization": "Bearer {apiKey}"
}
Response: {
  "status": "ok",
  "timestamp": "ISO string"
}
```

## 🔌 Интеграция с сервером

### Базовая конфигурация

- **Base URL**: `http://83.222.9.90:8080`
- **API Prefix**: `/api`
- **Content-Type**: `application/json`
- **Timeout**: 30 секунд (настраивается)

### Авторизация

API использует Bearer токены для защищенных эндпоинтов:

```javascript
Headers: {
  "Authorization": "Bearer {apiKey}",
  "Content-Type": "application/json"
}
```

### Обработка ошибок

Все API запросы включают обработку ошибок:

```javascript
try {
  const response = await fetch(endpoint, options)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
} catch (error) {
  console.error('API Error:', error)
  // Fallback к локальным данным или показ ошибки
}
```

## 📡 Подробная документация API эндпоинтов

### 🏥 Проверка состояния сервера

#### `GET /api/health`

**Назначение**: Проверка доступности сервера и валидности API ключа

**Клиентский запрос:**

```javascript
const response = await fetch('/api/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer {apiKey}', // опционально
  },
})
```

**Ответ сервера (200 OK):**

```javascript
{
  "status": "ok",
  "timestamp": "2025-09-27T10:30:00.000Z",
  "server": "Self-Service Terminal API v1.0",
  "uptime": 86400 // секунды
}
```

**Ответ сервера (401 Unauthorized):**

```javascript
{
  "error": "Invalid API key",
  "code": "AUTH_FAILED"
}
```

### 🍽️ Управление меню

#### `GET /api/menu`

**Назначение**: Получение полного списка блюд

**Клиентский запрос:**

```javascript
const response = await fetch('/api/menu', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer {apiKey}', // опционально
  },
})
```

**Query Parameters:**

- `category_id` (optional) - Фильтр по категории
- `is_available` (optional) - Только доступные блюда (true/false)
- `limit` (optional) - Ограничение количества результатов
- `offset` (optional) - Смещение для пагинации

**Ответ сервера (200 OK):**

```javascript
{
  "data": [
    {
      "id": 1,
      "name": "Борщ с говядиной",
      "description": "Традиционный украинский борщ с говядиной, свеклой и сметаной",
      "price": 350,
      "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300",
      "category_id": 5,
      "weight": 400,
      "calories": 250,
      "ingredients": "Говядина, свекла, капуста, морковь, лук",
      "isActive": true,
      "isRecommended": false,
      "isVegetarian": false
    }
  ],
  "total": 8,
  "limit": 20,
  "offset": 0
}
```

**Используемые поля в клиенте:**

- `id` - Уникальный идентификатор
- `name` - Название блюда (обязательно)
- `description` - Описание блюда (обязательно)
- `price` - Цена в рублях (обязательно)
- `image` - URL изображения (может быть null)
- `category_id` - ID категории (обязательно)
- `weight` - Вес в граммах
- `calories` - Калорийность
- `ingredients` - Состав блюда (строка)
- `isActive` - Активность блюда (boolean)
- `isRecommended` - Рекомендуемое (boolean)
- `isVegetarian` - Вегетарианское (boolean)

#### `POST /api/menu`

**Назначение**: Создание нового блюда

**Клиентский запрос:**

```javascript
const formData = {
  name: 'Борщ украинский',
  description: 'Традиционный украинский борщ с говядиной, свеклой и сметаной',
  price: 350,
  category_id: 5,
  image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd', // или null
  weight: 400,
  calories: 250,
  ingredients: 'Говядина, свекла, капуста, морковь, лук, томатная паста',
  isActive: true,
  isRecommended: false,
  isVegetarian: false,
}

const response = await fetch('/api/menu', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer {apiKey}',
  },
  body: JSON.stringify(formData),
})
```

**Ответ сервера (201 Created):**

```javascript
{
  "id": 9,
  "message": "Menu item created successfully",
  "data": {
    "id": 9,
    "name": "Борщ украинский",
    "description": "Традиционный украинский борщ с говядиной, свеклой и сметаной",
    "price": 350,
    "category_id": 5,
    "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd",
    "weight": 400,
    "calories": 250,
    "ingredients": "Говядина, свекла, капуста, морковь, лук, томатная паста",
    "isActive": true,
    "isRecommended": false,
    "isVegetarian": false,
    "created_at": "2025-09-27T12:00:00.000Z"
  }
}
    "calories": 250,
    "created_at": "2025-09-27T12:00:00.000Z"
  }
}
```

#### `PUT /api/menu/{id}`

**Назначение**: Обновление существующего блюда

**Клиентский запрос:**

```javascript
const updates = {
  name: 'Борщ украинский (обновленный)',
  price: 380,
  isActive: false,
  isRecommended: true,
  // только измененные поля
}

const response = await fetch(`/api/menu/${itemId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer {apiKey}',
  },
  body: JSON.stringify(updates),
})
```

**Ответ сервера (200 OK):**

```javascript
{
  "message": "Menu item updated successfully",
  "data": {
    "id": 5,
    "name": "Борщ украинский (обновленный)",
    "price": 380,
    "isActive": false,
    "isRecommended": true,
    "updated_at": "2025-09-27T12:30:00.000Z"
  }
}
```

#### `DELETE /api/menu/{id}`

**Назначение**: Удаление блюда

**Клиентский запрос:**

```javascript
const response = await fetch(`/api/menu/${itemId}`, {
  method: 'DELETE',
  headers: {
    Authorization: 'Bearer {apiKey}',
  },
})
```

**Ответ сервера (200 OK):**

```javascript
{
  "message": "Menu item deleted successfully",
  "deleted_id": 5
}
```

### 📋 Управление категориями

#### `GET /api/categories`

**Назначение**: Получение списка категорий

**Клиентский запрос:**

```javascript
const response = await fetch('/api/categories', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
```

**Ответ сервера (200 OK):**

```javascript
{
  "data": [
    {
      "id": 1,
      "name": "Напитки"
    },
    {
      "id": 2,
      "name": "Основные блюда"
    },
    {
      "id": 5,
      "name": "Супы"
    }
  ]
}
```

**Используемые поля в клиенте:**

- `id` - Уникальный идентификатор категории
- `name` - Название категории (обязательно)

#### `POST /api/categories`

**Назначение**: Создание новой категории

**Клиентский запрос:**

```javascript
const categoryData = {
  name: 'Новая категория',
}

const response = await fetch('/api/categories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer {apiKey}',
  },
  body: JSON.stringify(categoryData),
})
```

**Ответ сервера (201 Created):**

```javascript
{
  "id": 8,
  "message": "Category created successfully",
  "data": {
    "id": 8,
    "name": "Новая категория",
    "created_at": "2025-09-27T12:00:00.000Z"
  }
}
```

#### `PUT /api/categories/{id}`

**Назначение**: Обновление категории

**Клиентский запрос:**

```javascript
const updates = {
  name: 'Обновленное название',
}

const response = await fetch(`/api/categories/${categoryId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer {apiKey}',
  },
  body: JSON.stringify(updates),
})
```

**Ответ сервера (200 OK):**

```javascript
{
  "message": "Category updated successfully",
  "data": {
    "id": 5,
    "name": "Обновленное название",
    "updated_at": "2025-09-27T12:30:00.000Z"
  }
}
```

#### `DELETE /api/categories/{id}`

**Назначение**: Удаление категории

**Клиентский запрос:**

```javascript
const response = await fetch(`/api/categories/${categoryId}`, {
  method: 'DELETE',
  headers: {
    Authorization: 'Bearer {apiKey}',
  },
})
```

**Ответ сервера (200 OK):**

```javascript
{
  "message": "Category deleted successfully",
  "deleted_id": 5
}
```

### 🛒 Управление заказами

#### `GET /api/orders`

**Назначение**: Получение списка заказов

**Клиентский запрос:**

```javascript
const response = await fetch('/api/orders?status=pending&limit=10', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer {apiKey}',
  },
})
```

**Query Parameters:**

- `status` - Фильтр по статусу: `pending`, `ready`, `completed`, `cancelled`
- `table_number` - Фильтр по номеру стола
- `date_from` & `date_to` - Фильтр по дате (ISO format)
- `limit` & `offset` - Пагинация

**Ответ сервера (200 OK):**

```javascript
{
  "data": [
    {
      "id": 1,
      "orderTime": "12:30", // отформатированное время
      "orderType": "За столом", // "За столом", "С собой", "Доставка"
      "tableNumber": 5, // номер стола или null
      "status": "ready", // "pending", "ready", "completed", "cancelled"
      "totalPrice": 580,
      "createdAt": "2025-09-27T12:30:00.000Z",
      "items": "2x Бургер, 1x Кола", // строковое представление
      "cartItems": [
        {
          "id": 1,
          "name": "Бургер",
          "price": 250,
          "quantity": 2
        },
        {
          "id": 2,
          "name": "Кола",
          "price": 80,
          "quantity": 1
        }
      ]
    }
  ],
  "total": 6,
  "summary": {
    "pending": 2,
    "ready": 1,
    "completed": 2,
    "cancelled": 1
  }
}
```

**Используемые поля в клиенте:**

- `id` - Уникальный идентификатор заказа
- `orderTime` - Время создания (HH:MM формат)
- `orderType` - Тип заказа
- `tableNumber` - Номер стола (может быть null)
- `status` - Статус заказа
- `totalPrice` - Общая стоимость
- `createdAt` - Полная дата создания (ISO)
- `items` - Строковое представление товаров
- `cartItems` - Детальный список товаров

#### `POST /api/orders`

**Назначение**: Создание нового заказа

**Клиентский запрос:**

```javascript
const orderData = {
  tableNumber: 5,
  orderType: 'За столом', // "За столом", "С собой", "Доставка"
  cartItems: [
    {
      id: 1,
      name: 'Бургер',
      price: 250,
      quantity: 2,
    },
    {
      id: 8,
      name: 'Кола',
      price: 80,
      quantity: 1,
    },
  ],
  customerName: '', // опционально
  specialRequests: '', // опционально
  total: 580, // вычисляется клиентом
}

const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(orderData),
})
```

**Ответ сервера (201 Created):**

```javascript
{
  "id": 7,
  "message": "Order created successfully",
  "data": {
    "id": 7,
    "orderTime": "13:45",
    "orderType": "За столом",
    "tableNumber": 5,
    "status": "pending",
    "totalPrice": 580,
    "createdAt": "2025-09-27T13:45:00.000Z",
    "cartItems": [
      // полный список товаров
    ]
  }
}
```

#### `PATCH /api/orders/{id}/status`

**Назначение**: Обновление статуса заказа

**Клиентский запрос:**

```javascript
const statusUpdate = {
  status: 'ready', // "pending", "ready", "completed", "cancelled"
}

const response = await fetch(`/api/orders/${orderId}/status`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer {apiKey}',
  },
  body: JSON.stringify(statusUpdate),
})
```

**Ответ сервера (200 OK):**

```javascript
{
  "message": "Order status updated successfully",
  "data": {
    "id": 7,
    "status": "ready",
    "updated_at": "2025-09-27T13:50:00.000Z"
  }
}
```

**Статусы заказов в клиенте:**

- `pending` - "Готовится" (оранжевый цвет)
- `ready` - "Готов к выдаче" (зеленый цвет)
- `completed` - "Выполнено" (синий цвет)
- `cancelled` - "Отменён" (красный цвет)

### 👨‍💼 Система вызова официанта

#### `POST /api/waiter/call`

**Назначение**: Вызов официанта к столу

**Клиентский запрос:**

```javascript
const waiterCall = {
  tableNumber: 5,
  timestamp: new Date().toISOString(),
  type: 'waiter_call',
}

const response = await fetch('/api/waiter/call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(waiterCall),
})
```

**Ответ сервера (201 Created):**

```javascript
{
  "id": 4,
  "message": "Waiter call registered successfully",
  "data": {
    "id": 4,
    "tableNumber": 5,
    "timestamp": "2025-09-27T12:50:00.000Z",
    "resolved": false
  }
}
```

#### `GET /api/waiter/notifications`

**Назначение**: Получение всех уведомлений официанта

**Клиентский запрос:**

```javascript
const response = await fetch('/api/waiter/notifications?status=pending', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer {apiKey}',
  },
})
```

**Query Parameters:**

- `status` - Фильтр по статусу (`pending`, `resolved`)
- `table_number` - Фильтр по столу

**Ответ сервера (200 OK):**

```javascript
{
  "data": [
    {
      "id": 1,
      "tableNumber": 5,
      "timestamp": "2025-09-27T12:40:00.000Z",
      "resolved": false
    },
    {
      "id": 2,
      "tableNumber": 3,
      "timestamp": "2025-09-27T12:35:00.000Z",
      "resolved": true
    }
  ],
  "summary": {
    "pending": 2,
    "resolved": 5
  }
}
```

**Используемые поля в клиенте:**

- `id` - Уникальный идентификатор уведомления
- `tableNumber` - Номер стола
- `timestamp` - Время создания (ISO формат)
- `resolved` - Статус решения (boolean)

#### `PATCH /api/waiter/notifications/{id}/resolve`

**Назначение**: Отметка уведомления как решенного

**Клиентский запрос:**

```javascript
const resolution = {
  resolved_by: 'Официант Иван', // опционально
  resolution_note: 'Помог с выбором блюда', // опционально
}

const response = await fetch(`/api/waiter/notifications/${notificationId}/resolve`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer {apiKey}',
  },
  body: JSON.stringify(resolution),
})
```

**Ответ сервера (200 OK):**

```javascript
{
  "message": "Notification resolved successfully",
  "data": {
    "id": 1,
    "resolved": true,
    "resolved_at": "2025-09-27T12:55:00.000Z",
    "response_time": 15 // минуты с момента создания
  }
}
```

#### `DELETE /api/waiter/notifications/{id}`

**Назначение**: Удаление уведомления

**Клиентский запрос:**

```javascript
const response = await fetch(`/api/waiter/notifications/${notificationId}`, {
  method: 'DELETE',
  headers: {
    Authorization: 'Bearer {apiKey}',
  },
})
```

### 🔐 Административная аутентификация

#### `POST /api/admin/verify`

**Назначение**: Проверка админ-ключа и создание сессии

**Клиентский запрос:**

```javascript
const loginData = {
  adminKey: 'terminal-admin', // один из валидных ключей
}

const response = await fetch('/api/admin/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(loginData),
})
```

**Валидные админ-ключи в клиенте:**

```javascript
;['admin123', 'terminal-admin', 'management-key', 'settings-access']
```

**Ответ сервера (200 OK):**

```javascript
{
  "success": true,
  "sessionId": "sess_abc123def456",
  "expiresAt": "2025-09-27T16:50:00.000Z", // +2 часа
  "message": "Доступ к админ-панели получен"
}
```

**Ответ сервера (401 Unauthorized):**

```javascript
{
  "success": false,
  "error": "Неверный админ-ключ",
  "code": "INVALID_CREDENTIALS"
}
```

#### `POST /api/admin/validate-session`

**Назначение**: Проверка валидности сессии

**Клиентский запрос:**

```javascript
const sessionData = {
  sessionId: 'sess_abc123def456',
}

const response = await fetch('/api/admin/validate-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(sessionData),
})
```

**Ответ сервера (200 OK - валидная сессия):**

```javascript
{
  "valid": true,
  "expiresAt": "2025-09-27T16:50:00.000Z",
  "timeRemaining": 7200 // секунды до истечения
}
```

**Ответ сервера (401 Unauthorized - невалидная сессия):**

```javascript
{
  "valid": false,
  "error": "Session expired or invalid"
}
```

### 📊 Статистика и аналитика (дополнительно)

#### `GET /api/analytics/summary`

**Назначение**: Получение общей статистики

**Query Parameters:**

- `period` - Период (today, week, month)
- `date_from` & `date_to` - Кастомный период

**Response (200 OK):**

```javascript
{
  "period": "today",
  "orders": {
    "total": 25,
    "completed": 18,
    "cancelled": 2,
    "pending": 5,
    "average_time": 18 // минуты
  },
  "revenue": {
    "total": 12500,
    "currency": "RUB"
  },
  "popular_items": [
    {
      "menu_item_id": 15,
      "name": "Бургер классический",
      "orders_count": 12,
      "revenue": 3000
    }
  ],
  "waiter_calls": {
    "total": 8,
    "resolved": 6,
    "average_response_time": 4 // минуты
  }
}
```

### WebSocket соединения (Real-time обновления)

#### Подключение к WebSocket

```javascript
const wsUrl = `ws://83.222.9.90:8080/ws?token=${apiKey}`
const ws = new WebSocket(wsUrl)

ws.onopen = () => {
  console.log('WebSocket connected')
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  handleRealtimeUpdate(data)
}

ws.onclose = () => {
  console.log('WebSocket disconnected')
  // Переподключение через 5 секунд
  setTimeout(() => connectWebSocket(), 5000)
}
```

#### Типы WebSocket сообщений

```javascript
// Новый заказ
{
  "type": "new_order",
  "data": {
    "order_id": 26,
    "table_number": 5,
    "total_price": 580
  }
}

// Обновление статуса заказа
{
  "type": "order_status_changed",
  "data": {
    "order_id": 25,
    "old_status": "pending",
    "new_status": "ready"
  }
}

// Вызов официанта
{
  "type": "waiter_called",
  "data": {
    "notification_id": 15,
    "table_number": 5,
    "reason": "help_with_order",
    "priority": "normal"
  }
}

// Обновление меню
{
  "type": "menu_updated",
  "data": {
    "action": "item_added", // "item_added", "item_updated", "item_deleted"
    "menu_item_id": 52
  }
}
```

### 🚨 Обработка ошибок и коды ответов

#### HTTP Status Codes

- **200 OK** - Успешный запрос
- **201 Created** - Ресурс успешно создан
- **400 Bad Request** - Неверные данные запроса
- **401 Unauthorized** - Требуется авторизация
- **403 Forbidden** - Доступ запрещен
- **404 Not Found** - Ресурс не найден
- **409 Conflict** - Конфликт данных
- **422 Unprocessable Entity** - Ошибки валидации
- **500 Internal Server Error** - Внутренняя ошибка сервера

#### Стандартный формат ошибок

```javascript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      },
      {
        "field": "price",
        "message": "Price must be greater than 0"
      }
    ]
  },
  "timestamp": "2025-09-27T12:30:00.000Z",
  "path": "/api/menu"
}
```

#### Коды ошибок приложения

- **AUTH_FAILED** - Ошибка аутентификации
- **SESSION_EXPIRED** - Сессия истекла
- **VALIDATION_ERROR** - Ошибка валидации данных
- **RESOURCE_NOT_FOUND** - Ресурс не найден
- **INSUFFICIENT_PERMISSIONS** - Недостаточно прав
- **RATE_LIMIT_EXCEEDED** - Превышен лимит запросов
- **MENU_ITEM_UNAVAILABLE** - Блюдо недоступно
- **ORDER_ALREADY_PROCESSED** - Заказ уже обработан

### 🔒 Безопасность и ограничения

#### Rate Limiting

- **Общие запросы**: 1000 запросов/час на IP
- **Создание заказов**: 60 запросов/час на IP
- **Вызов официанта**: 20 запросов/час на стол

#### Валидация данных

```javascript
// Пример валидации для создания блюда
{
  "name": {
    "required": true,
    "max_length": 100,
    "min_length": 3
  },
  "price": {
    "required": true,
    "type": "number",
    "min_value": 1,
    "max_value": 999999
  },
  "category_id": {
    "required": true,
    "type": "integer",
    "exists_in": "categories.id"
  },
  "image": {
    "optional": true,
    "type": "url_or_base64",
    "max_size": "5MB"
  }
}
```

#### Фильтрация и санитизация

- HTML теги автоматически экранируются
- SQL инъекции предотвращаются через параметризованные запросы
- XSS защита через Content-Security-Policy
- Загружаемые файлы проверяются на тип и размер

## 🎨 Пользовательский интерфейс

### Главная страница (Customer Interface)

**Компоненты:**

- `CategoryList` - Выбор категорий
- `FoodGrid` - Отображение блюд
- `FoodCard` - Карточка блюда
- `ShoppingCart` - Корзина покупок
- `OrderPopup` - Оформление заказа

**Workflow:**

1. Выбор категории → фильтрация блюд
2. Добавление в корзину → обновление состояния
3. Оформление заказа → создание заказа
4. Вызов официанта → создание уведомления

### Административная панель (Admin Interface)

**Вкладки:**

- **Заказы** - Управление статусами заказов
- **Меню** - CRUD операции с блюдами и категориями
- **Устройства** - Мониторинг терминалов
- **Настройки** - Конфигурация системы

**Функции:**

- Фильтрация заказов по статусам
- Редактирование блюд с изображениями
- Управление категориями
- Настройка API подключения
- Экспорт/импорт настроек

## 🔄 Жизненный цикл заказа

1. **Создание заказа** (Customer)
   - Добавление блюд в корзину
   - Оформление заказа
   - Отправка на сервер

2. **Обработка заказа** (Admin)
   - Получение уведомления
   - Изменение статуса на "Готовится"
   - Обновление в real-time

3. **Готовность** (Admin)
   - Статус "Готов к выдаче"
   - Уведомление клиента

4. **Завершение** (Admin)
   - Статус "Выполнено"
   - Архивация заказа

## 🧪 Тестирование API интеграции

### Проверка подключения

```javascript
// Тест базового подключения
const testConnection = async () => {
  try {
    const response = await fetch('http://83.222.9.90:8080/api/health')
    const data = await response.json()

    if (data.status === 'ok') {
      console.log('✅ Сервер доступен')
      return true
    }
  } catch (error) {
    console.log('❌ Сервер недоступен:', error.message)
    return false
  }
}
```

### Пример полного цикла заказа

```javascript
// 1. Загрузка меню
const menu = await fetch('/api/menu').then((r) => r.json())
console.log(`Загружено ${menu.data.length} блюд`)

// 2. Загрузка категорий
const categories = await fetch('/api/categories').then((r) => r.json())
console.log(`Загружено ${categories.data.length} категорий`)

// 3. Создание заказа
const newOrder = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table_number: 5,
    order_type: 'dine_in',
    items: [
      { menu_item_id: 1, quantity: 2 },
      { menu_item_id: 8, quantity: 1 },
    ],
  }),
}).then((r) => r.json())

console.log(`Создан заказ #${newOrder.order_number}`)

// 4. Обновление статуса
await fetch(`/api/orders/${newOrder.id}/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'ready' }),
})

console.log('Заказ готов к выдаче')
```

## 🔄 Миграция с mock данных на реальный API

### Этапы интеграции

1. **Этап 1**: Замена статических данных на API вызовы в store
2. **Этап 2**: Добавление обработки ошибок и fallback
3. **Этап 3**: Подключение WebSocket для real-time обновлений
4. **Этап 4**: Оптимизация кеширования и производительности

## 🔧 Установка и запуск

```bash
# Клонирование репозитория
git clone <repository-url>
cd Self-service-terminal

# Установка зависимостей
npm install

# Режим разработки
npm run dev

# Сборка для продакшена
npm run build

# Предварительный просмотр сборки
npm run preview

# Линтинг кода
npm run lint
```

## 📱 Адаптивность и совместимость

- **Responsive Design**: Поддержка планшетов и десктопов
- **Touch Support**: Оптимизация для сенсорных экранов
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Node.js**: 20.19.0+ или 22.12.0+

## 🚀 Развертывание

### Production Build

```bash
npm run build
# Файлы готовы в папке dist/
```

### Environment Variables

```env
VITE_API_BASE_URL=http://83.222.9.90:8080
VITE_WS_URL=ws://83.222.9.90:8080/ws
VITE_APP_TITLE=Self Service Terminal
```

### Server Configuration

Настройка прокси для API запросов в `vite.config.js`:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://83.222.9.90:8080',
      changeOrigin: true
    }
  }
}
```

## 📄 Лицензия

MIT License - см. файл LICENSE для деталей.
