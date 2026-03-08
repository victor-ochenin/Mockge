package io.mockge.backend.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class RedisService {

    private static final Logger logger = LoggerFactory.getLogger(RedisService.class);

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public RedisService(RedisTemplate<String, Object> redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Публикация схемы в Redis для прокси-сервера
     * Ключ: mock:{subdomain}:schema
     */
    public void publishSchema(String subdomain, Object schema) {
        String key = "mock:" + subdomain + ":schema";
        try {
            String schemaJson = objectMapper.writeValueAsString(schema);
            logger.info("Publishing schema to Redis: key={}, size={} bytes", key, schemaJson.length());
            
            // Проверяем подключение к Redis
            String ping = redisTemplate.execute(
                (org.springframework.data.redis.connection.RedisConnection connection) -> 
                    connection.ping()
            );
            logger.debug("Redis PING response: {}", ping);
            
            redisTemplate.opsForValue().set(key, schemaJson);
            
            // Проверяем, что ключ действительно записан
            Boolean exists = redisTemplate.hasKey(key);
            logger.info("Schema published successfully to Redis: key={}, exists={}", key, exists);
        } catch (JsonProcessingException e) {
            logger.error("Ошибка сериализации схемы для Redis", e);
            throw new IllegalArgumentException("Ошибка сериализации схемы для Redis", e);
        }
    }

    /**
     * Удаление схемы из Redis по поддомену
     */
    public void deleteSchema(String subdomain) {
        String key = "mock:" + subdomain + ":schema";
        logger.info("Deleting schema from Redis: key={}", key);
        redisTemplate.delete(key);
        logger.info("Schema deleted from Redis: key={}", key);
    }

    /**
     * Получение схемы из Redis
     */
    public String getSchema(String subdomain) {
        String key = "mock:" + subdomain + ":schema";
        Object value = redisTemplate.opsForValue().get(key);
        return value != null ? value.toString() : null;
    }

    /**
     * Сохранение состояния для stateful мок-сервера
     * Ключ: mock:{subdomain}:state:{entity}
     */
    public void saveState(String subdomain, String entity, Object data) {
        String key = "mock:" + subdomain + ":state:" + entity;
        try {
            String dataJson = objectMapper.writeValueAsString(data);
            redisTemplate.opsForValue().set(key, dataJson, 24, TimeUnit.HOURS);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Ошибка сериализации состояния для Redis", e);
        }
    }

    /**
     * Получение состояния из Redis
     */
    public String getState(String subdomain, String entity) {
        String key = "mock:" + subdomain + ":state:" + entity;
        Object value = redisTemplate.opsForValue().get(key);
        return value != null ? value.toString() : null;
    }

    /**
     * Инкремент счётчика запросов
     */
    public void incrementRequestCount(String subdomain) {
        String key = "mock:" + subdomain + ":stats:requests";
        redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, 24, TimeUnit.HOURS);
    }

    /**
     * Получение статистики запросов
     */
    public Long getRequestCount(String subdomain) {
        String key = "mock:" + subdomain + ":stats:requests";
        Object value = redisTemplate.opsForValue().get(key);
        return value != null ? Long.parseLong(value.toString()) : 0L;
    }
}
