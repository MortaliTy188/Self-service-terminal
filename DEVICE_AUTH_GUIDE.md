# 📱 Система авторизации планшетов

## Общий принцип работы

### 1. Регистрация устройства

Android-приложение при первом запуске регистрирует устройство на сервере:

```javascript
POST /api/devices/register
{
  "android_id": "unique_android_id",
  "model": "Samsung Galaxy Tab A7",
  "os_version": "13.0",
  "app_version": "1.0.0"
}

// Ответ:
{
  "device_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "device": {
    "android_id": "unique_android_id",
    "model": "Samsung Galaxy Tab A7",
    ...
  }
}
```

### 2. Назначение номера стола (Admin)

Администратор через админ-панель назначает `short_id` (номер стола) устройству:

```javascript
POST /api/admin/assign-device
{
  "android_id": "unique_android_id",
  "short_id": "5"
}
```

### 3. Создание заказа

Когда планшет готов (зарегистрирован + назначен short_id), заказы создаются с авторизацией:

```javascript
POST /api/orders
Headers: {
  "Authorization": "Bearer {device_token}"
}
Body: {
  "device_android_id": "unique_android_id",
  "table_short_id": "5",
  "items": [
    { "menu_item_id": "menu_001", "qty": 2 }
  ],
  "total": 1500
}
```

### 4. Обновление статуса устройства

Периодически планшет отправляет свой статус:

```javascript
POST /api/devices/{android_id}/status
Headers: {
  "Authorization": "Bearer {device_token}"
}
Body: {
  "battery": 85,
  "last_activity": "2025-10-05T10:00:00Z"
}
```

## Использование в коде

### Device Store

```javascript
import { useDeviceStore } from '@/stores/device'

const deviceStore = useDeviceStore()

// Проверка, зарегистрировано ли устройство
if (deviceStore.isDeviceReady) {
  // Устройство готово для работы
}

// Инициализация устройства (автоматически при запуске)
await deviceStore.initializeDevice()

// Регистрация нового устройства (для админа)
await deviceStore.registerDevice({
  android_id: 'test_001',
  model: 'Samsung Tab',
  os_version: '13.0',
  app_version: '1.0.0',
})

// Назначение номера стола (для админа)
await deviceStore.assignShortId('test_001', '5')

// Создание заказа от устройства
await deviceStore.createDeviceOrder({
  items: [{ menu_item_id: 'menu_001', qty: 2, price: 750 }],
  total: 1500,
})
```

### Orders Store (автоматическое определение)

```javascript
import { useOrdersStore } from '@/stores/orders'

const ordersStore = useOrdersStore()

// Метод автоматически определит, использовать ли device API
await ordersStore.createOrder(orderDetails)
// Если устройство готово -> использует device API
// Если браузер -> использует обычный API
```

## Интеграция с Android

### Требуемые методы в Android

Android-приложение должно предоставить WebView следующий интерфейс:

```java
class WebAppInterface {
    @JavascriptInterface
    public String getAndroidId() {
        return Settings.Secure.getString(
            context.getContentResolver(),
            Settings.Secure.ANDROID_ID
        );
    }

    @JavascriptInterface
    public String getModel() {
        return Build.MODEL;
    }

    @JavascriptInterface
    public String getOSVersion() {
        return Build.VERSION.RELEASE;
    }

    @JavascriptInterface
    public String getAppVersion() {
        return BuildConfig.VERSION_NAME;
    }
}

// Подключение к WebView
webView.addJavascriptInterface(
    new WebAppInterface(this),
    "Android"
);
```

### Проверка доступности в Vue

```javascript
// В device store автоматически проверяется:
const isAndroidApp = computed(() => {
  return !!(window.Android && typeof window.Android.getAndroidId === 'function')
})
```

## Админ-панель

### Управление устройствами

1. Переход в раздел "Управление устройствами" в админ-панели
2. Кнопка "Зарегистрировать планшет" для ручной регистрации
3. Кнопка "Назначить стол" для привязки устройства к столу
4. Просмотр статуса устройств (онлайн, заряд батареи, последняя активность)

### Workflow

```
1. Регистрация планшета
   ↓
2. Назначение номера стола (short_id)
   ↓
3. Устройство готово к работе
   ↓
4. Создание заказов с авторизацией
```

## Хранение данных

### LocalStorage

Данные устройства сохраняются в localStorage:

```javascript
{
  "androidId": "unique_id",
  "deviceToken": "jwt_token",
  "shortId": "5",
  "deviceInfo": { ... },
  "isRegistered": true
}
```

### Автоматическая инициализация

При загрузке приложения:

1. Проверка данных в localStorage
2. Проверка наличия Android интерфейса
3. Автоматическая регистрация при необходимости
4. Восстановление сессии

## API Endpoints

| Endpoint                           | Method | Описание                 | Auth         |
| ---------------------------------- | ------ | ------------------------ | ------------ |
| `/api/devices/register`            | POST   | Регистрация устройства   | -            |
| `/api/devices/{android_id}`        | GET    | Информация об устройстве | -            |
| `/api/devices/{android_id}/status` | POST   | Обновление статуса       | device_token |
| `/api/admin/assign-device`         | POST   | Назначение short_id      | admin        |
| `/api/orders`                      | POST   | Создание заказа          | device_token |

## Безопасность

1. **device_token** - JWT токен для авторизации планшета
2. Токен передается в заголовке `Authorization: Bearer {token}`
3. Сервер проверяет токен при каждом запросе
4. Назначение short_id доступно только админам

## Troubleshooting

### Устройство не регистрируется

- Проверьте доступность API
- Проверьте наличие Android интерфейса
- Проверьте console.log для ошибок

### Заказы не создаются

- Убедитесь, что устройство зарегистрировано
- Проверьте наличие short_id
- Проверьте валидность device_token

### Статус "Офлайн"

- Обновите статус устройства вручную
- Проверьте последнюю активность
- Перезагрузите приложение на планшете
