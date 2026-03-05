# Mockge Proxy Server

Прокси-сервер для генерации мок-данных в проекте Mockge.

## Описание

Proxy Server - это ядро системы Mockge, которое обрабатывает запросы к мок-серверам и генерирует данные на основе схем, хранящихся в Redis.

## Функции

- **Генерация данных** - автоматическая генерация тестовых данных на основе схемы
- **Stateful mocks** - сохранение состояния между запросами (POST/PUT/DELETE)
- **Настройка задержек** - имитация медленного ответа
- **Имитация ошибок** - настройка процента ошибок
- **CORS** - поддержка cross-origin запросов
- **Rate Limiting** - защита от DDoS
- **Пагинация** - поддержка `_page` и `_limit` параметров

## Быстрый старт

### Локальная разработка

1. Запустите Redis (через Docker):
```bash
docker run -d -p 6379:6379 redis:7
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите сервер разработки:
```bash
npm run dev
```

4. Проверьте работу:
```bash
curl http://localhost:3000/health
```

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт сервера | `3000` |
| `REDIS_HOST` | Хост Redis | `localhost` |
| `REDIS_PORT` | Порт Redis | `6379` |
| `REDIS_PASSWORD` | Пароль Redis | - |
| `NODE_ENV` | Среда (development/production) | `development` |

## Команды

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка TypeScript
npm run build

# Запуск продакшн версии
npm start

# Запуск тестов
npm test

# Запуск тестов с покрытием
npm run test:coverage

# Проверка типов
npm run typecheck
```

## API

### Health Check

```
GET /health
```

Ответ:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Мок-запросы

Запросы к мок-серверу отправляются на поддомен:

```
GET https://project123.mockge.io/users
POST https://project123.mockge.io/products
```

#### Поддерживаемые методы

- `GET /{entity}` - список сущностей
- `GET /{entity}/{id}` - одна сущность
- `POST /{entity}` - создать
- `PUT /{entity}/{id}` - обновить
- `PATCH /{entity}/{id}` - частичное обновление
- `DELETE /{entity}/{id}` - удалить

#### Query параметры

- `_page` - страница (по умолчанию 1)
- `_limit` - элементов на странице (по умолчанию 10)

## Формат схемы

Схема хранится в Redis по ключу `mock:{subdomain}:schema`:

```json
{
  "id": "schema_1",
  "name": "Test API",
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
        },
        {
          "id": "field_3",
          "name": "name",
          "type": "string"
        }
      ]
    }
  ],
  "settings": {
    "defaultLatency": 100,
    "errorRate": 0.05,
    "stateful": true,
    "maxItems": 10
  }
}
```

### Типы полей

- `uuid` - UUID v4
- `string` - случайная строка
- `text` - случайный текст
- `number` - случайное число
- `boolean` - true/false
- `email` - email адрес
- `date` - дата в ISO формате
- `url` - URL
- `phone` - номер телефона

## Docker

### Сборка образа

```bash
docker build -t mockge/proxy:latest .
```

### Запуск контейнера

```bash
docker run -d \
  -p 3000:3000 \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  --name mockge-proxy \
  mockge/proxy:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  proxy:
    image: mockge/proxy:latest
    ports:
      - "3000:3000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## Тестирование

### Модульные тесты

- `generator.test.ts` - тесты генератора данных
- `mockState.test.ts` - тесты сервиса состояния

### Интеграционные тесты

- `server.test.ts` - тесты HTTP сервера

Запуск:
```bash
npm test
```

## Структура проекта

```
proxy/
├── src/
│   ├── config/          # Конфигурация
│   ├── database/        # Подключение к Redis
│   ├── services/        # Бизнес-логика
│   │   ├── generator.ts # Генерация данных
│   │   └── mockState.ts # Управление состоянием
│   ├── types/           # TypeScript типы
│   │   └── schema.ts    # Типы схемы
│   ├── utils/           # Утилиты
│   │   └── logger.ts    # Логгер
│   ├── index.ts         # Точка входа
│   └── server.ts        # HTTP сервер
├── tests/               # Тесты
├── Dockerfile
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Технологии

- **Fastify** - HTTP сервер
- **ioredis** - Redis клиент
- **@faker-js/faker** - Генерация тестовых данных
- **Pino** - Логгер
- **TypeScript** - Типизация
- **Vitest** - Тестирование

## Лицензия

ISC
