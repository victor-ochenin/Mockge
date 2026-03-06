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

**Статус:** ✅ Реализовано

**Что сделано:**
- Создан `DeploymentEntity` для таблицы `mock_deployments`
- Создан `DeploymentRepository`
- Создан `DeploymentService` с методом `deploy()`
- Создан `DeploymentController` для управления деплоями
- Добавлен эндпоинт `POST /api/schemas/{schemaId}/deploy` в `SchemaController`
- Созданы DTO: `DeploySchemaRequest`, `DeploymentDto`

**Примечание:** Таблица `mock_deployments` уже существует в БД (миграция 005-create-mock-deployments.xml)

2026-03-06T08:45:03.905+03:00 DEBUG 38812 --- [nio-8080-exec-2] o.s.security.web.FilterChainProxy        : Secured POST /api/schemas/b57c2d79-6fda-495c-9c7d-beaa043a3421/deploy
Hibernate: 
    select
        se1_0.id,
        se1_0.created_at,
        se1_0.created_by,
        se1_0.is_active,
        se1_0.name,
        se1_0.project_id,
        se1_0.schema_json,
        se1_0.version 
    from
        schemas se1_0 
    where
        se1_0.id=?
Hibernate: 
    insert 
    into
        mock_deployments
        (created_at, expires_at, request_count, schema_id, settings, status, subdomain, id) 
    values
        (?, ?, ?, ?, ?, ?, ?, ?)
2026-03-06T08:45:04.162+03:00  WARN 38812 --- [nio-8080-exec-2] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 0, SQLState: 23502
2026-03-06T08:45:04.162+03:00 ERROR 38812 --- [nio-8080-exec-2] o.h.engine.jdbc.spi.SqlExceptionHelper   : ERROR: null value in column "created_at" of relation "mock_deployments" violates not-null constraint
  Подробности: Failing row contains (9beef46d-1e8a-44ef-9658-95714a8012df, b57c2d79-6fda-495c-9c7d-beaa043a3421, test-project, active, {"errorRate": 0.05, "defaultLatency": 100}, 0, null, null, null).