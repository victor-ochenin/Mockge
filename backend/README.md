# Mockge Backend

Backend API для проекта Mockge на Java 17 + Spring Boot 3.2

## Требования

- Java 17+
- Maven 3.8+ или Docker
- PostgreSQL 15
- Redis 7

## Запуск

### Вариант 1: Через Maven

```bash
# Убедитесь, что PostgreSQL и Redis запущены
docker-compose up -d postgres redis

# Запуск приложения
mvn spring-boot:run
```

### Вариант 2: Через Docker

```bash
docker-compose up -d
```

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход

### Проекты (требуется авторизация)
- `GET /api/projects` - Список проектов
- `POST /api/projects` - Создать проект
- `GET /api/projects/{id}` - Получить проект
- `PUT /api/projects/{id}` - Обновить проект
- `DELETE /api/projects/{id}` - Удалить проект

## Документация

После запуска Swagger UI доступен по адресу:
http://localhost:8080/swagger-ui.html

## Тесты

```bash
mvn test
```
