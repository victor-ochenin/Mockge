# Этап 3: Proxy Server - Summary

## Статус: ✅ ЗАВЕРШЁН

Дата завершения: 5 марта 2026 г.

---

## Обзор

Реализован полнофункциональный прокси-сервер для генерации мок-данных на основе схем. Сервер обрабатывает HTTP-запросы к поддоменам, читает схемы из Redis и генерирует данные согласно конфигурации.

---

## Реализованные функции

### ✅ Задача 3.1: Базовый сервер Fastify
- Инициализирован npm проект
- Установлены зависимости: fastify, @fastify/cors, @fastify/rate-limit
- Настроен TypeScript с строгой типизацией
- Создан базовый HTTP сервер на порту 3000

### ✅ Задача 3.2: Подключение к Redis
- Интегрирован ioredis клиент
- Настроено подключение к локальному Redis
- Реализована проверка соединения при старте
- Добавлена обработка ошибок подключения

### ✅ Задача 3.3: Wildcard Routing
- Реализован парсинг поддомена из hostname
- Middleware для извлечения subdomain (project123.mockge.io → project123)
- Возврат 404 для несуществующих схем
- Игнорирование localhost для health check

### ✅ Задача 3.4: Генерация данных по схеме
- Интегрирован @faker-js/faker для генерации реалистичных данных
- Поддержка типов полей: uuid, string, text, number, boolean, email, date, url, phone
- Автоматическая генерация для GET запросов
- Обработка POST запросов с объединением пользовательских данных

### ✅ Задача 3.5: Stateful Mocks
- Сохранение созданных объектов в Redis
- Поддержка PUT/PATCH для обновления
- Поддержка DELETE для удаления
- Получение объекта по ID
- Инкремент счётчиков запросов и ошибок

### ✅ Задача 3.6: Настройки мок-сервера
- **defaultLatency** - задержка ответа (мс)
- **errorRate** - процент случайных ошибок (0.0-1.0)
- **stateful** - включение/отключение сохранения состояния
- **maxItems** - максимальное количество элементов в состоянии

### ✅ Дополнительно реализовано:
- CORS для всех запросов
- Rate Limiting (100 запросов/минуту)
- Пагинация (_page, _limit)
- Поддержка множественного числа сущностей (users → User)
- Логирование с Pino
- Graceful shutdown

---

## Структура проекта

```
proxy/
├── src/
│   ├── config/
│   │   └── index.ts           # Конфигурация (порт, Redis)
│   ├── database/
│   │   └── redis.ts           # Redis клиент
│   ├── services/
│   │   ├── generator.ts       # Генерация данных (Faker.js)
│   │   ├── generator.test.ts  # Тесты генератора
│   │   ├── mockState.ts       # Управление состоянием
│   │   └── mockState.test.ts  # Тесты состояния
│   ├── types/
│   │   └── schema.ts          # TypeScript типы схемы
│   ├── utils/
│   │   └── logger.ts          # Логгер (Pino)
│   ├── index.ts               # Точка входа
│   ├── server.ts              # HTTP сервер (Fastify)
│   └── server.test.ts         # Интеграционные тесты
├── Dockerfile                 # Docker образ
├── .dockerignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## Тестирование

### Модульные тесты (24 теста)
- **generator.test.ts** (11 тестов)
  - Генерация UUID для primary полей
  - Генерация по типам: string, number, boolean, email, date, url, phone
  - Генерация сущности со всеми полями
  - Уникальность значений

- **mockState.test.ts** (13 тестов)
  - Чтение/запись схемы из Redis
  - Работа с состоянием (get, save, add, update, delete)
  - Поиск по ID
  - Обработка невалидных данных

### Интеграционные тесты (7 тестов)
- Health check endpoint
- Обработка запросов без поддомена (400)
- Обработка несуществующего проекта (404)
- GET запрос списка сущностей (200)
- POST запрос создания сущности (201)
- CORS заголовки

### Покрытие
```
Test Files:  3 passed (3)
Tests:       31 passed (31)
```

### Запуск тестов
```bash
npm test              # Запуск тестов
npm run test:coverage # С покрытием
```

---

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт сервера | `3000` |
| `REDIS_HOST` | Хост Redis | `localhost` |
| `REDIS_PORT` | Порт Redis | `6379` |
| `REDIS_PASSWORD` | Пароль Redis | - |
| `NODE_ENV` | Среда | `development` |

---

## API Endpoints

### Health Check
```
GET /health
→ 200 OK: { "status": "ok", "timestamp": "..." }
```

### Мок-запросы (через поддомен)
```
GET    https://project123.mockge.io/users
GET    https://project123.mockge.io/users/:id
POST   https://project123.mockge.io/users
PUT    https://project123.mockge.io/users/:id
PATCH  https://project123.mockge.io/users/:id
DELETE https://project123.mockge.io/users/:id
```

### Query параметры
- `_page` - страница (default: 1)
- `_limit` - элементов на странице (default: 10)

---

## Формат схемы в Redis

Ключ: `mock:{subdomain}:schema`

```json
{
  "id": "schema_uuid",
  "name": "My API",
  "entities": [
    {
      "id": "entity_1",
      "name": "User",
      "fields": [
        {
          "id": "field_1",
          "name": "id",
          "type": "uuid",
          "primary": true
        },
        {
          "id": "field_2",
          "name": "email",
          "type": "email",
          "required": true,
          "faker": "internet.email"
        }
      ]
    }
  ],
  "settings": {
    "defaultLatency": 100,
    "errorRate": 0.05,
    "stateful": true,
    "maxItems": 100
  }
}
```

---

## Docker

### Сборка
```bash
docker build -t mockge/proxy:latest .
```

### Запуск
```bash
docker run -d \
  -p 3000:3000 \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  mockge/proxy:latest
```

---

## Технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| Node.js | 20+ | Среда выполнения |
| TypeScript | 5.0+ | Типизация |
| Fastify | 5.0+ | HTTP сервер |
| ioredis | 5.0+ | Redis клиент |
| @faker-js/faker | 10.0+ | Генерация данных |
| Pino | 10.0+ | Логирование |
| Vitest | 4.0+ | Тестирование |

---

## Проверка выполнения этапа

### ✅ Чек-лист из spec

- [x] `npm run dev` - сервер запускается
- [x] `curl http://localhost:3000` - ответ с сервером
- [x] В логах видно "Connected to Redis"
- [x] Парсинг поддомена работает (project1.mockge.local → project1)
- [x] 404 для несуществующих схем
- [x] Генерация данных по схеме (GET /users → массив пользователей)
- [x] POST сохраняет данные (stateful)
- [x] GET возвращает сохранённые данные
- [x] Задержки и ошибки настраиваются

### ✅ Тесты
- [x] Модульные тесты для generator.ts
- [x] Модульные тесты для mockState.ts
- [x] Интеграционные тесты для server.ts
- [x] Все 31 тестов проходят

### ✅ Документация
- [x] README.md с инструкциями
- [x] Dockerfile для продакшена
- [x] .dockerignore
- [x] Summary в папке proxy

---

## Следующие шаги (Этап 4: Frontend)

1. Инициализация Vite + React + TypeScript
2. Настройка TailwindCSS
3. Страницы аутентификации (Login/Register)
4. Dashboard со списком проектов
5. Интеграция с Backend API

---

## Команды для запуска

```bash
# Установка зависимостей
cd proxy
npm install

# Запуск в режиме разработки (требуется Redis)
npm run dev

# Запуск тестов
npm test

# Сборка для продакшена
npm run build
npm start

# Docker
docker build -t mockge/proxy:latest .
docker run -d -p 3000:3000 -e REDIS_HOST=localhost mockge/proxy:latest
```

---

**Этап 3 завершён успешно!** 🎉
