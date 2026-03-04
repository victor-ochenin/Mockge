# Mockge: Визуальный конструктор API и генератор мок-серверов

## Техническая спецификация проекта (Software Design Document)

| Версия | Дата | Автор | Изменения |
|--------|------|-------|-----------|
| 1.0 | 2024 | — | Начальная версия |

---

## Оглавление

1. [Краткое описание продукта](#1-краткое-описание-продукта)
2. [Целевая аудитория и пользовательские сценарии](#2-целевая-аудитория-и-пользовательские-сценарии)
3. [Функциональные требования](#3-функциональные-требования)
4. [Нефункциональные требования](#4-нефункциональные-требования)
5. [Архитектура системы](#5-архитектура-системы)
6. [Стек технологий](#6-стек-технологий)
7. [Модели данных](#7-модели-данных)
8. [API интерфейсы](#8-api-интерфейсы)
9. [Прокси-сервер (ядро системы)](#9-прокси-сервер-ядро-системы)
10. [Пользовательский интерфейс](#10-пользовательский-интерфейс)
11. [Этапы разработки (Roadmap)](#11-этапы-разработки-roadmap)
12. [Монетизация](#12-монетизация)
13. [Конкуренты и позиционирование](#13-конкуренты-и-позиционирование)
14. [Риски и способы их минимизации](#14-риски-и-способы-их-минимизации)

---

## 1. Краткое описание продукта

**Mockge** — это веб-сервис для визуального проектирования данных и мгновенного создания мок-серверов. Продукт позволяет разработчикам, дизайнерам и продакт-менеджерам «рисовать» структуру данных мышкой, а получать работающий REST API с документацией, генерацией тестовых данных и возможностью совместной работы.

**Ключевая ценность:** «Нарисуй данные — получи API за 5 минут. Не пиши YAML, не разбирайся в OpenAPI.»

---

## 2. Целевая аудитория и пользовательские сценарии

### 2.1 Целевая аудитория

| Сегмент | Описание | Потребность |
|---------|----------|-------------|
| **Фронтенд-разработчики** | Создают интерфейсы, зависят от бэкенда | Быстро получить работающий API для вёрстки и тестирования |
| **Бэкенд-разработчики** | Проектируют API | Визуализировать структуру данных, согласовать с командой |
| **Fullstack-разработчики** | Делают прототипы | Быстро набросать бэкенд для MVP |
| **Технические PM** | Управляют требованиями | Понять и согласовать структуры данных без кода |
| **Дизайнеры** | Проектируют UI | Понимать, какие данные будут приходить |

### 2.2 Основные пользовательские сценарии

#### Сценарий 1: Создание нового мок-сервера с нуля
1. Пользователь заходит на сайт, нажимает «Создать проект»
2. Открывается визуальный редактор
3. Пользователь перетаскивает сущности (User, Product, Order) на холст
4. Добавляет поля, настраивает типы (string, number, email)
5. Создаёт связи между сущностями (User has many Orders)
6. Нажимает «Деплой»
7. Получает URL вида `https://project123.mockge.io`
8. Готово! Можно отправлять запросы

#### Сценарий 2: Импорт существующего API
1. Пользователь загружает OpenAPI/Swagger файл
2. Система автоматически строит визуальную схему
3. Пользователь дорабатывает (добавляет поля, правит)
4. Деплоит мок-сервер

#### Сценарий 3: Командная работа
1. Пользователь создаёт проект
2. Приглашает коллег по email
3. Все одновременно видят схему
4. Менеджер правит поля → фронтендер видит изменения в реальном времени

---

## 3. Функциональные требования

### 3.1 Управление проектами
- Регистрация и аутентификация (email + пароль, OAuth)
- Создание/редактирование/удаление проектов
- Приглашение участников в проект (роли: admin, editor, viewer)
- История изменений схемы (версионность)

### 3.2 Визуальный редактор схем
- **Палитра компонентов:** предопределённые типы сущностей (User, Product, Order, Custom)
- **Drag-and-drop** сущностей на холст
- **Редактор полей:**
  - Добавление/удаление полей
  - Настройка типа (string, number, boolean, email, date, url, phone)
  - Настройка формата (min, max, pattern)
  - Обязательность поля
  - Генерация примеров (Faker.js presets)
- **Визуальные связи:** «один ко многим», «один к одному», «многие ко многим»
- **Автоматическое создание эндпоинтов** на основе схемы (REST conventions)

### 3.3 Мок-сервер
- Автоматическое выделение поддомена `*.mockge.io`
- Поддержка REST методов: GET, POST, PUT, PATCH, DELETE
- Поддержка фильтрации, сортировки, пагинации (query params)
- **Умная генерация данных:**
  - Поле `email` → валидный email
  - Поле `avatar` → ссылка на картинку
  - Поле `name` → человеческое имя
- **Имитация поведения:**
  - Задержки (latency): от 0 до 10 секунд
  - Процент ошибок (rate limiting simulation)
  - Конкретные статус-коды (200, 404, 500)
- **Stateful моки:**
  - Сохранение состояния между запросами
  - Счётчики, списки созданных объектов

### 3.4 Документация и экспорт
- Автоматическая генерация **Swagger/OpenAPI** спецификации
- Интерактивная документация (как Swagger UI)
- **Генерация кода:**
  - TypeScript типы
  - Java DTO (Data Transfer Objects)
  - Python Pydantic модели
- Экспорт в OpenAPI YAML/JSON
- Экспорт в Postman коллекцию

### 3.5 Дополнительные возможности
- История запросов к мок-серверу (инспектор трафика)
- Webhooks при изменении схемы
- Поддержка GraphQL (базовая)
- Локальный туннель (как ngrok) для моков локально

---

## 4. Нефункциональные требования

### 4.1 Производительность
- **Прокси-сервер:** время ответа < 10 мс (p95) при 1000 RPS
- **API:** время ответа < 200 мс
- Поддержка до 10 000 одновременных подключений к мок-серверам
- Автомасштабирование прокси-серверов при росте нагрузки

### 4.2 Надежность
- Доступность 99.9% (SLA)
- Автоматическое восстановление после сбоев
- Репликация данных (PostgreSQL)
- Кэширование схем в Redis (отказоустойчивый кластер)

### 4.3 Безопасность
- Шифрование данных в покое (AES-256) и в транзите (TLS 1.3)
- JWT-аутентификация с ограниченным временем жизни
- Rate limiting для API (защита от DDoS)
- Изоляция мок-серверов (невозможно повлиять на чужие данные)
- Санитизация вводимых данных

### 4.4 Масштабируемость
- Горизонтальное масштабирование прокси-серверов
- Геораспределение (EDGE) для низкой задержки
- Поддержка до 1 млн активных мок-серверов

### 4.5 Юзабилити
- Интуитивный интерфейс (zero learning curve)
- Onboarding для новых пользователей
- Поддержка мобильных устройств (базовая)

---

## 5. Архитектура системы

### 5.1 Общая схема

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│ React Frontend  │────▶│ Java Spring API │────▶│ PostgreSQL      │
│                 │     │                 │     │ Redis (кэш)     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 │ публикация схемы
                                 ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│ Клиенты моков   │────▶│ Node.js Proxy   │────▶│ Redis (данные)  │
│ (разработчики)  │     │ (масштабируется)│     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 5.2 Компоненты системы

| Компонент | Технологии | Назначение |
|-----------|------------|------------|
| **Frontend** | React + TypeScript + Vite + React Flow | Визуальный редактор, UI |
| **Backend API** | Java 17+ Spring Boot | Управление пользователями, проектами, схемами |
| **Proxy Server** | Node.js + Fastify + Redis | Обработка запросов к мокам, генерация данных |
| **Database** | PostgreSQL (основная), Redis (кэш/данные моков) | Хранение данных |
| **Message Queue** | RabbitMQ (опционально) | События при изменении схем |

### 5.3 Потоки данных

#### Поток 1: Создание схемы
1. Frontend отправляет JSON схемы на Backend API
2. Backend валидирует, сохраняет в PostgreSQL
3. Backend публикует схему в Redis (ключ: `mock:{projectId}`)
4. Backend возвращает URL мок-сервера

#### Поток 2: Запрос к мок-серверу
1. Клиент делает GET `https://project123.mockge.io/users`
2. DNS направляет на любой Proxy Server (load balancer)
3. Proxy парсит subdomain `project123`
4. Proxy берёт схему из Redis (`mock:project123`)
5. Генерирует данные по правилам схемы
6. Возвращает JSON клиенту

---

## 6. Стек технологий

### 6.1 Frontend

| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 18.2+ | Основной фреймворк |
| TypeScript | 5.0+ | Типизация |
| Vite | 4.0+ | Сборщик |
| React Flow | 11.0+ | Визуальный редактор (холст) |
| TailwindCSS | 3.0+ | Стилизация |
| Zustand | 4.0+ | Управление состоянием |
| React Hook Form | 7.0+ | Формы |
| TanStack Query | 4.0+ | Работа с API |
| OpenAPI Generator | - | Генерация клиента API |

### 6.2 Backend API

| Технология | Версия | Назначение |
|------------|--------|------------|
| Java | 17 LTS | Язык программирования |
| Spring Boot | 3.1+ | Основной фреймворк |
| Spring Security | 6.0+ | Аутентификация |
| Spring Data JPA | 3.0+ | ORM |
| PostgreSQL | 15+ | Реляционная БД |
| Redis | 7.0+ | Кэш, хранение схем |
| Liquibase | 4.0+ | Миграции БД |
| MapStruct | 1.5+ | Маппинг DTO |
| Lombok | 1.18+ | Бойлерплейт |
| Springdoc OpenAPI | 2.0+ | Документация API |
| Testcontainers | 1.0+ | Интеграционные тесты |
| JUnit 5 | 5.9+ | Модульные тесты |

### 6.3 Proxy Server

| Технология | Версия | Назначение |
|------------|--------|------------|
| Node.js | 20+ | Среда выполнения |
| TypeScript | 5.0+ | Типизация |
| Fastify | 4.0+ | HTTP сервер (высокая производительность) |
| ioredis | 5.0+ | Redis клиент |
| @faker-js/faker | 8.0+ | Генерация тестовых данных |
| json-schema-faker | - | Генерация из JSON Schema |
| Handlebars | 4.0+ | Шаблонизация |
| Pino | 8.0+ | Логирование |
| prom-client | 14.0+ | Метрики для Prometheus |
| Bull | 4.0+ | Очереди (опционально) |

### 6.4 Инфраструктура

| Компонент | Технология |
|-----------|------------|
| Контейнеризация | Docker |
| Оркестрация | Kubernetes (EKS/GKE) |
| CI/CD | GitHub Actions |
| Хостинг фронтенда | Vercel / AWS S3 + CloudFront |
| Хостинг бэкенда | AWS EKS / Railway |
| База данных | AWS RDS for PostgreSQL |
| Redis | AWS ElastiCache / Redis Cloud |
| Мониторинг | Prometheus + Grafana |
| Логи | ELK Stack / DataDog |
| Ошибки | Sentry |

---

## 7. Модели данных

### 7.1 PostgreSQL (реляционные данные)

```sql
-- Пользователи
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Проекты
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Участники проекта
CREATE TABLE project_members (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'admin', 'editor', 'viewer'
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- Версии схемы (храним JSON)
CREATE TABLE schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    schema_json JSONB NOT NULL,  -- Вся визуальная схема
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT false,
    UNIQUE(project_id, version)
);

-- Деплои мок-серверов
CREATE TABLE mock_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schema_id UUID NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'deleted'
    settings JSONB DEFAULT '{}',  -- latency, error_rate и т.д.
    request_count BIGINT DEFAULT 0,
    last_request_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP  -- для триальных аккаунтов
);

-- Индексы
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_schemas_project ON schemas(project_id);
CREATE INDEX idx_schemas_active ON schemas(project_id, is_active);
CREATE INDEX idx_mock_subdomain ON mock_deployments(subdomain);
CREATE INDEX idx_mock_status ON mock_deployments(status);
```

### 7.2 Redis (кэш и данные моков)

```
# Ключи Redis

# Схема мок-сервера (TTL: бесконечно, обновляется при деплое)
mock:{subdomain}:schema -> JSON строка со схемой

# Статистика запросов (TTL: 1 день, инкрементится)
mock:{subdomain}:stats:requests -> счётчик
mock:{subdomain}:stats:errors -> счётчик

# Rate limiting (TTL: 1 час)
ratelimit:{subdomain}:{ip} -> счётчик

# Состояние для stateful моков (TTL: настраивается)
mock:{subdomain}:state:{entity} -> JSON массив/объект
```

### 7.3 Формат JSON схемы

```json
{
  "id": "uuid",
  "name": "Мой интернет-магазин",
  "entities": [
    {
      "id": "entity_1",
      "name": "User",
      "fields": [
        {
          "id": "field_1",
          "name": "id",
          "type": "uuid",
          "primary": true,
          "generated": true
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
          "type": "string",
          "faker": "person.fullName"
        },
        {
          "id": "field_4",
          "name": "age",
          "type": "number",
          "min": 18,
          "max": 99
        }
      ]
    },
    {
      "id": "entity_2",
      "name": "Order",
      "fields": [
        {
          "id": "field_5",
          "name": "id",
          "type": "uuid",
          "primary": true
        },
        {
          "id": "field_6",
          "name": "userId",
          "type": "uuid",
          "relation": {
            "entity": "entity_1",
            "type": "manyToOne"
          }
        },
        {
          "id": "field_7",
          "name": "total",
          "type": "number",
          "min": 10,
          "max": 1000
        }
      ]
    }
  ],
  "endpoints": {
    "users": {
      "list": "/users",
      "detail": "/users/:id",
      "create": "/users",
      "update": "/users/:id",
      "delete": "/users/:id"
    },
    "orders": {
      "list": "/orders",
      "userOrders": "/users/:userId/orders"
    }
  },
  "settings": {
    "defaultLatency": 100,
    "errorRate": 0.05,
    "stateful": true
  }
}
```

## 8. API интерфейсы

### 8.1 Backend API (REST)

#### Аутентификация

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `POST` | `/api/auth/register` | Регистрация |
| `POST` | `/api/auth/login` | Вход |
| `POST` | `/api/auth/refresh` | Обновление токена |
| `POST` | `/api/auth/logout` | Выход |
| `GET` | `/api/auth/me` | Текущий пользователь |

#### Проекты

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/api/projects` | Список проектов |
| `POST` | `/api/projects` | Создать проект |
| `GET` | `/api/projects/{id}` | Получить проект |
| `PUT` | `/api/projects/{id}` | Обновить проект |
| `DELETE` | `/api/projects/{id}` | Удалить проект |
| `GET` | `/api/projects/{id}/members` | Участники проекта |
| `POST` | `/api/projects/{id}/members` | Добавить участника |
| `DELETE` | `/api/projects/{id}/members/{userId}` | Удалить участника |

#### Схемы

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/api/projects/{projectId}/schemas` | Версии схем |
| `POST` | `/api/projects/{projectId}/schemas` | Создать версию |
| `GET` | `/api/schemas/{schemaId}` | Получить схему |
| `PUT` | `/api/schemas/{schemaId}` | Обновить схему |
| `POST` | `/api/schemas/{schemaId}/activate` | Активировать версию |
| `POST` | `/api/schemas/{schemaId}/deploy` | Деплой мок-сервера |
| `GET` | `/api/schemas/{schemaId}/export/openapi` | Экспорт в OpenAPI |
| `POST` | `/api/schemas/{schemaId}/export/typescript` | Экспорт TypeScript типов |
| `POST` | `/api/schemas/{schemaId}/export/java` | Экспорт Java DTO |

#### Мок-серверы

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/api/mock/deployments` | Список деплоев |
| `GET` | `/api/mock/deployments/{id}` | Информация о деплое |
| `PUT` | `/api/mock/deployments/{id}/settings` | Обновить настройки (latency, errors) |
| `DELETE` | `/api/mock/deployments/{id}` | Остановить мок-сервер |
| `GET` | `/api/mock/deployments/{id}/stats` | Статистика запросов |
| `GET` | `/api/mock/deployments/{id}/logs` | Последние запросы |

### 8.2 Proxy API (мок-сервер)

Прокси-сервер не имеет своего API в привычном смысле. Он просто отвечает на запросы клиентов в соответствии со схемой:

#### REST эндпоинты, определяемые схемой

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/{entity}` | Список сущностей |
| `GET` | `/{entity}/{id}` | Одна сущность |
| `POST` | `/{entity}` | Создать |
| `PUT` | `/{entity}/{id}` | Обновить |
| `PATCH` | `/{entity}/{id}` | Частичное обновление |
| `DELETE` | `/{entity}/{id}` | Удалить |
| `GET` | `/{entity}/{id}/{related}` | Связанные сущности |

#### Query параметры (поддержка):

- `_page`, `_limit` — пагинация
- `_sort`, `_order` — сортировка
- `_filter` — фильтрация
- `_fields` — выбор полей
- `_embed` — подгрузка связанных сущностей

## 9. Прокси-сервер (ядро системы)

### 9.1 Архитектура прокси

```
┌─────────────────────────────────────────────────────────────┐
│  Load Balancer (AWS ALB / Nginx)                            │
│  Распределяет запросы по экземплярам прокси                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Proxy Node 1  │    │ Proxy Node 2  │    │ Proxy Node N  │
│ (Fastify)     │    │ (Fastify)     │    │ (Fastify)     │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │  Redis Cluster  │
                    │  (схемы, стейт) │
                    └─────────────────┘
```

### 9.2 Обработка запроса (псевдокод)

```typescript
// fastify-server.ts
import Fastify from 'fastify';

const app = Fastify({ logger: true });

// Middleware: парсинг subdomain
app.addHook('onRequest', async (request, reply) => {
  const host = request.hostname;
  const subdomain = host.split('.')[0]; // project123.mockge.io -> project123

  if (subdomain === 'mockge' || subdomain === 'www') {
    // Это запрос к основному сайту, пропускаем
    return;
  }

  request.subdomain = subdomain;
});

// Главный обработчик всех запросов к мокам
app.all('/*', async (request, reply) => {
  const { subdomain } = request;
  const path = request.url;
  const method = request.method;

  // 1. Получаем схему из Redis
  const schemaKey = `mock:${subdomain}:schema`;
  const schemaJson = await redis.get(schemaKey);

  if (!schemaJson) {
    return reply.status(404).send({ error: 'Mock server not found' });
  }

  const schema = JSON.parse(schemaJson);

  // 2. Находим эндпоинт в схеме
  const endpoint = findEndpoint(schema, path, method);

  if (!endpoint) {
    return reply.status(404).send({ error: 'Endpoint not found' });
  }

  // 3. Имитация задержки
  const latency = schema.settings?.defaultLatency || 0;
  await delay(latency);

  // 4. Имитация ошибок
  const errorRate = schema.settings?.errorRate || 0;
  if (Math.random() < errorRate) {
    return reply.status(500).send({ error: 'Internal Server Error (simulated)' });
  }

  // 5. Генерация данных
  let data;

  if (method === 'GET' && path.match(/\/[^\/]+\/\d+$/)) {
    // Один объект
    data = generateEntity(schema, endpoint.entity);
  } else if (method === 'GET') {
    // Список
    const count = endpoint.pagination?.defaultSize || 10;
    data = Array.from({ length: count }, () => generateEntity(schema, endpoint.entity));
  } else if (method === 'POST') {
    // Создание
    data = {
      ...generateEntity(schema, endpoint.entity),
      ...request.body,
      id: generateId()
    };

    // Сохраняем в state, если включено
    if (schema.settings?.stateful) {
      await saveToState(subdomain, endpoint.entity, data);
    }
  } else {
    data = { message: 'Mock response', method, path };
  }

  // 6. Инкрементируем статистику
  await redis.incr(`mock:${subdomain}:stats:requests`);

  // 7. Отправляем ответ
  return reply.send(data);
});

// Генерация одного объекта по схеме
function generateEntity(schema, entityName) {
  const entity = schema.entities.find(e => e.name === entityName);
  const result = {};

  for (const field of entity.fields) {
    if (field.generated) {
      // Используем Faker.js
      result[field.name] = generateFakerValue(field.faker);
    } else if (field.type === 'string') {
      result[field.name] = faker.lorem.word();
    } else if (field.type === 'number') {
      result[field.name] = faker.number.int({ min: field.min || 0, max: field.max || 100 });
    } else if (field.type === 'email') {
      result[field.name] = faker.internet.email();
    } else if (field.type === 'date') {
      result[field.name] = faker.date.past();
    }
    // и т.д.
  }

  return result;
}

app.listen({ port: 3000 });
```

### 9.3 Масштабирование прокси

```yaml
# kubernetes/deployment-proxy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mock-proxy
spec:
  replicas: 5
  selector:
    matchLabels:
      app: mock-proxy
  template:
    metadata:
      labels:
        app: mock-proxy
    spec:
      containers:
      - name: proxy
        image: mockge/proxy:latest
        env:
        - name: REDIS_HOST
          value: redis-cluster
        - name: REDIS_PORT
          value: "6379"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mock-proxy-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mock-proxy
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 10. Пользовательский интерфейс

### 10.1 Основные экраны

#### Экран 1: Дашборд проектов
- Список проектов пользователя
- Кнопка «Создать проект»
- Статистика по мок-серверам
- Приглашения в командные проекты

#### Экран 2: Визуальный редактор (главный экран)

```
┌─────────────────────────────────────────────────────────────┐
│  [Проект: Интернет-магазин]  [Share]  [Deploy]  [Settings] │
├───────────┬─────────────────────────────────────────────────┤
│ Палитра   │                   Холст                         │
│ ┌───────┐ │  ┌──────────────┐        ┌──────────────┐       │
│ │ User  │ │  │    User      │        │    Order     │       │
│ ├───────┤ │  │ ──────────── │        │ ──────────── │       │
│ │Product│ │  │ id: uuid     │───────▶│ id: uuid     │       │
│ ├───────┤ │  │ name: string │        │ userId: uuid │       │
│ │ Order │ │  │ email: email │        │ total: number│       │
│ ├───────┤ │  │ age: number  │        │ status: string│      │
│ │Custom │ │  └──────────────┘        └──────────────┘       │
│ └───────┘ │                                                   │
└───────────┴─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Свойства: Поле email                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Тип: email                                           │    │
│  │ Обязательное: [x]                                    │    │
│  │ Faker: internet.email                                │    │
│  │ Уникальное: [ ]                                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

#### Экран 3: Управление мок-сервером
- URL мок-сервера
- Статистика запросов (графики)
- Настройки (latency, error rate)
- Логи последних запросов
- Кнопка «Перезапустить»
- Документация (Swagger UI)

#### Экран 4: Настройки проекта
- Управление участниками
- История версий
- Настройки экспорта
- Webhooks
- Удаление проекта
