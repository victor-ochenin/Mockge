# Руководство по ручному тестированию Mockge

## Архитектура стенда

```
┌─────────────────────────────────────────────────────────────┐
│                     Ваш компьютер                           │
│                                                             │
│  ┌─────────────────┐      ┌─────────────────────────────┐   │
│  │   Postman       │      │    Docker Containers        │   │
│  │  (тесты API)    │─────▶│  ┌───────┐  ┌───────────┐   │   │
│  │  localhost      │      │  │ Redis │  │  Proxy    │   │   │
│  │                 │      │  │ :6379 │  │  :3000    │   │   │
│  └─────────────────┘      │  └───────┘  └───────────┘   │   │
│                           │  ┌───────────┐              │   │
│  ┌─────────────────┐      │  │ PostgreSQL│              │   │
│  │   Backend       │─────▶│  │  :5432    │              │   │
│  │   (Java, IDE)   │      │  └───────────┘              │   │
│  │  localhost:8080 │      │                             │   │
│  └─────────────────┘      └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Запущенные сервисы

| Сервис | Порт | Статус |
|--------|------|--------|
| PostgreSQL | 5432 | ✅ в контейнере |
| Redis | 6379 | ✅ в контейнере |
| Proxy | 3000 | ✅ в контейнере |
| Backend | 8080 | ⚠️ запустить локально |

---

## Шаг 1: Запуск Backend

Backend нужно запустить локально из IDE или через Maven:

```bash
cd backend
mvn spring-boot:run
```

Или через IDE (IntelliJ IDEA / Eclipse):
- Запустить класс с `@SpringBootApplication`
- Убедиться, что порт `8080`

**Проверка подключения к БД:**
- Backend должен подключиться к `jdbc:postgresql://localhost:5432/mockge`
- Логин: `postgres`, пароль: `postgres`

**Проверка подключения к Redis:**
- Backend должен подключиться к `localhost:6379`

---

## Шаг 2: Проверка здоровья сервисов

### 2.1. Проверка Proxy (health check)

**Запрос:**
```
GET http://localhost:3000/health
```

**Ожидаемый ответ:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-05T15:35:00.000Z"
}
```

**Postman:**
1. Создать новый запрос → `GET http://localhost:3000/health`
2. Нажать **Send**
3. Проверить статус `200 OK`

---

### 2.2. Проверка Backend (Swagger UI)

**Запрос:**
```
GET http://localhost:8080/swagger-ui.html
```

**Ожидаемый результат:**
- Откроется Swagger UI с доступными эндпоинтами API

**Postman:**
1. `GET http://localhost:8080/api/health` (или аналогичный health endpoint)
2. Статус `200 OK`

---

## Шаг 3: Регистрация пользователя

**Запрос:**
```
POST http://localhost:8080/api/auth/register
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "email": "test@example.com",
  "password": "Test123!",
  "name": "Test User"
}
```

**Ожидаемый ответ:**
```json
{
  "id": "uuid...",
  "email": "test@example.com",
  "name": "Test User",
  "createdAt": "2026-03-05T15:35:00.000Z"
}
```

**Postman:**
1. Создать POST запрос
2. Вкладка **Body** → **raw** → **JSON**
3. Вставить JSON выше
4. Нажать **Send**
5. Сохранить `id` пользователя для следующих шагов

---

## Шаг 4: Аутентификация (Login)

**Запрос:**
```
POST http://localhost:8080/api/auth/login
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "email": "test@example.com",
  "password": "Test123!"
}
```

**Ожидаемый ответ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "expiresIn": 3600
}
```

**Postman:**
1. Создать POST запрос
2. Вкладка **Body** → **raw** → **JSON**
3. Вставить JSON выше
4. Нажать **Send**
5. **Сохранить `accessToken`** (Environment Variables → Add)

---

## Шаг 5: Создание проекта

**Запрос:**
```
POST http://localhost:8080/api/projects
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "name": "Test API Project",
  "description": "Project for manual testing"
}
```

**Ожидаемый ответ:**
```json
{
  "id": "proj-uuid...",
  "name": "Test API Project",
  "description": "Project for manual testing",
  "ownerId": "user-uuid...",
  "createdAt": "2026-03-05T15:35:00.000Z"
}
```

**Postman:**
1. Создать POST запрос
2. Вкладка **Authorization** → Type: **Bearer Token** → Token: `{{accessToken}}`
3. Вкладка **Body** → **raw** → **JSON**
4. Вставить JSON выше
5. Нажать **Send**
6. **Сохранить `id` проекта**

---

## Шаг 6: Создание схемы (Schema)

**Запрос:**
```
POST http://localhost:8080/api/projects/{projectId}/schemas
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "name": "User API Schema",
  "entities": [
    {
      "id": "entity_user",
      "name": "User",
      "fields": [
        {
          "id": "field_id",
          "name": "id",
          "type": "uuid",
          "primary": true,
          "generated": true
        },
        {
          "id": "field_email",
          "name": "email",
          "type": "email",
          "required": true,
          "faker": "internet.email"
        },
        {
          "id": "field_name",
          "name": "name",
          "type": "string",
          "faker": "person.fullName"
        },
        {
          "id": "field_age",
          "name": "age",
          "type": "number",
          "min": 18,
          "max": 80
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

**Ожидаемый ответ:**
```json
{
  "id": "schema-uuid...",
  "projectId": "proj-uuid...",
  "name": "User API Schema",
  "version": 1,
  "schemaJson": { ... },
  "createdAt": "2026-03-05T15:35:00.000Z"
}
```

**Postman:**
1. Заменить `{projectId}` на ID из шага 5
2. Вкладка **Authorization** → Bearer Token
3. Вкладка **Body** → JSON схема
4. Нажать **Send**
5. **Сохранить `id` схемы**

---

## Шаг 7: Активация схемы

**Запрос:**
```
POST http://localhost:8080/api/schemas/{schemaId}/activate
Authorization: Bearer {{accessToken}}
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "message": "Schema activated"
}
```

**Что происходит:**
- Backend помечает схему как активную
- Эта схема будет использоваться для генерации мок-данных

---

## Шаг 8: Деплой мок-сервера

**Запрос:**
```
POST http://localhost:8080/api/schemas/{schemaId}/deploy
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Тело запроса (опционально):**
```json
{
  "subdomain": "test-project",
  "settings": {
    "defaultLatency": 100,
    "errorRate": 0.05
  }
}
```

**Ожидаемый ответ:**
```json
{
  "id": "deployment-uuid...",
  "schemaId": "schema-uuid...",
  "subdomain": "test-project",
  "status": "active",
  "url": "https://test-project.mockge.io",
  "createdAt": "2026-03-05T15:35:00.000Z"
}
```

**Что происходит:**
- Backend публикует схему в Redis по ключу `mock:test-project:schema`
- Proxy может читать эту схему

---

## Шаг 9: Проверка схемы в Redis

**Через Redis CLI (в контейнере):**
```bash
docker exec -it mockge-redis redis-cli
> KEYS mock:*
> GET mock:test-project:schema
```

**Ожидаемый результат:**
```json
{
  "id": "schema-uuid...",
  "name": "User API Schema",
  "entities": [...]
}
```

**Через Postman (если есть endpoint):**
```
GET http://localhost:8080/api/schemas/{schemaId}
Authorization: Bearer {{accessToken}}
```

---

## Шаг 10: Тестирование Proxy (генерация данных)

Теперь Proxy должен читать схему из Redis и генерировать данные.

### 10.1. Health Check Proxy

**Запрос:**
```
GET http://localhost:3000/health
```

**Ожидаемый ответ:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-05T15:35:00.000Z"
}
```

---

### 10.2. GET /users (список)

**Запрос:**
```
GET http://localhost:3000/users
```

**Ожидаемый ответ:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "age": 35
  },
  {
    "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "email": "jane.smith@example.com",
    "name": "Jane Smith",
    "age": 28
  }
]
```

**Postman:**
1. Создать GET запрос → `http://localhost:3000/users`
2. Нажать **Send**
3. Проверить, что данные сгенерированы по схеме

---

### 10.3. GET /users/:id (один объект)

**Запрос:**
```
GET http://localhost:3000/users/123
```

**Ожидаемый ответ:**
```json
{
  "id": "123",
  "email": "user123@example.com",
  "name": "User Name",
  "age": 42
}
```

---

### 10.4. POST /users (создание)

**Запрос:**
```
POST http://localhost:3000/users
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "email": "custom@example.com",
  "name": "Custom User",
  "age": 30
}
```

**Ожидаемый ответ:**
```json
{
  "id": "generated-uuid...",
  "email": "custom@example.com",
  "name": "Custom User",
  "age": 30
}
```

**Что происходит:**
- Proxy генерирует `id` автоматически
- Остальные поля берутся из запроса
- Если `stateful: true` → данные сохраняются в Redis

---

### 10.5. GET /users с пагинацией

**Запрос:**
```
GET http://localhost:3000/users?_page=2&_limit=5
```

**Ожидаемый ответ:**
```json
[
  {...}, {...}, {...}, {...}, {...}
]
```

---

### 10.6. Проверка статистики в Redis

**Через Redis CLI:**
```bash
docker exec -it mockge-redis redis-cli
> GET mock:test-project:stats:requests
```

**Ожидаемый результат:**
```
"15"  (количество запросов)
```

---

## Шаг 11: Проверка логов Proxy

**Просмотр логов контейнера:**
```bash
docker logs mockge-proxy --tail 50
```

**Ожидаемый результат:**
```
{"level":30,"time":1709654100000,"msg":"Request received","method":"GET","url":"/users"}
{"level":30,"time":1709654100100,"msg":"Response sent","status":200}
```

---

## Чек-лист успешного тестирования

- [ ] Backend запущен и подключён к PostgreSQL и Redis
- [ ] Proxy запущен в контейнере и видит Redis
- [ ] Пользователь зарегистрирован
- [ ] Проект создан
- [ ] Схема создана и активирована
- [ ] Мок-сервер задеплоен (схема в Redis)
- [ ] Proxy генерирует данные по схеме
- [ ] POST создаёт записи (stateful)
- [ ] Пагинация работает
- [ ] Статистика запросов пишется в Redis

---

## Возможные проблемы и решения

### 1. Backend не подключается к PostgreSQL

**Ошибка:**
```
Connection refused to localhost:5432
```

**Решение:**
```bash
# Проверить, что контейнер запущен
docker-compose ps

# Проверить логи
docker logs mockge-postgres
```

---

### 2. Proxy не видит схему в Redis

**Ошибка:**
```
Mock server not found
```

**Решение:**
```bash
# Проверить ключи в Redis
docker exec -it mockge-redis redis-cli KEYS mock:*

# Если ключей нет → деплой не сработал
# Проверить логи backend
```

---

### 3. Proxy не подключается к Redis

**Ошибка:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Решение:**
- Proxy в контейнере должен использовать `REDIS_HOST=redis`, а не `localhost`
- Проверить переменные окружения:
  ```bash
  docker exec mockge-proxy env | grep REDIS
  ```

---

### 4. 404 на /users

**Причина:** Схема не найдена или эндпоинт не определён

**Решение:**
1. Проверить, что схема активирована
2. Проверить ключ в Redis: `mock:test-project:schema`
3. Проверить, что entity называется `User` (имя сущности → эндпоинт `/users`)

---

## Postman Collection (импорт)

Создайте коллекцию в Postman с переменными окружения:

**Environment Variables:**
```
accessToken = <значение из login>
projectId = <значение из create project>
schemaId = <значение из create schema>
subdomain = test-project
```

**Запросы:**
1. `POST {{baseUrl}}/api/auth/register`
2. `POST {{baseUrl}}/api/auth/login` → сохранить токен
3. `POST {{baseUrl}}/api/projects` → сохранить projectId
4. `POST {{baseUrl}}/api/projects/{{projectId}}/schemas` → сохранить schemaId
5. `POST {{baseUrl}}/api/schemas/{{schemaId}}/activate`
6. `POST {{baseUrl}}/api/schemas/{{schemaId}}/deploy`
7. `GET http://localhost:3000/users`
8. `GET http://localhost:3000/users/1`
9. `POST http://localhost:3000/users`

---

## Следующие шаги

После успешного ручного тестирования:
1. Написать интеграционные тесты (Testcontainers)
2. Настроить CI/CD пайплайн
3. Добавить e2e тесты frontend
