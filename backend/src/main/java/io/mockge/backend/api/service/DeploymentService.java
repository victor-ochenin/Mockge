package io.mockge.backend.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.mockge.backend.api.dto.DeploySchemaRequest;
import io.mockge.backend.api.dto.DeploymentDto;
import io.mockge.backend.api.entity.DeploymentEntity;
import io.mockge.backend.api.entity.SchemaEntity;
import io.mockge.backend.api.repository.DeploymentRepository;
import io.mockge.backend.api.repository.SchemaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class DeploymentService {

    private static final Logger logger = LoggerFactory.getLogger(DeploymentService.class);

    private final DeploymentRepository deploymentRepository;
    private final SchemaRepository schemaRepository;
    private final ObjectMapper objectMapper;
    private final RedisService redisService;

    public DeploymentService(DeploymentRepository deploymentRepository,
                             SchemaRepository schemaRepository,
                             ObjectMapper objectMapper,
                             RedisService redisService) {
        this.deploymentRepository = deploymentRepository;
        this.schemaRepository = schemaRepository;
        this.objectMapper = objectMapper;
        this.redisService = redisService;
    }

    @Transactional
    public DeploymentDto deploy(UUID schemaId, DeploySchemaRequest request) {
        logger.info("Starting deployment for schema: {}", schemaId);

        SchemaEntity schema = schemaRepository.findById(schemaId)
                .orElseThrow(() -> new IllegalArgumentException("Схема не найдена"));

        logger.info("Found schema: {} with project: {}", schemaId, schema.getProject().getId());

        // Очищаем ВСЕ старые схемы проекта из Redis перед деплоем новой
        // Находим все деплои проекта и удаляем их ключи из Redis
        List<DeploymentEntity> oldDeployments = deploymentRepository.findByProjectId(schema.getProject().getId());
        for (DeploymentEntity oldDeployment : oldDeployments) {
            logger.info("Cleaning old deployment from Redis: subdomain={}", oldDeployment.getSubdomain());
            redisService.deleteSchema(oldDeployment.getSubdomain());
        }
        if (!oldDeployments.isEmpty()) {
            logger.info("Cleaned {} old deployments from Redis", oldDeployments.size());
        } else {
            logger.info("No old deployments to clean for project: {}", schema.getProject().getId());
        }

        DeploymentEntity deployment = new DeploymentEntity();
        deployment.setSchema(schema);
        deployment.setSubdomain(request.getSubdomain());
        deployment.setStatus("active");

        logger.info("Deploying with subdomain: {}", request.getSubdomain());

        // Устанавливаем настройки по умолчанию или из запроса
        if (request.getSettings() != null) {
            try {
                String settingsJson = objectMapper.writeValueAsString(request.getSettings());
                deployment.setSettings(settingsJson);
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Ошибка сериализации настроек", e);
            }
        } else {
            // Пустые настройки по умолчанию
            deployment.setSettings("{}");
        }

        deploymentRepository.save(deployment);
        logger.info("Deployment saved to database: {}", deployment.getId());

        // Публикуем схему в Redis для прокси-сервера
        try {
            Object schemaJson = objectMapper.readValue(schema.getSchemaJson(), Object.class);
            logger.info("Publishing schema to Redis for subdomain: {}", request.getSubdomain());
            redisService.publishSchema(request.getSubdomain(), schemaJson);
        } catch (JsonProcessingException e) {
            logger.error("Ошибка публикации схемы в Redis", e);
            throw new IllegalArgumentException("Ошибка публикации схемы в Redis", e);
        }

        logger.info("Deployment completed successfully for schema: {}", schemaId);
        return toDto(deployment);
    }

    @Transactional(readOnly = true)
    public DeploymentDto findById(UUID id) {
        DeploymentEntity deployment = deploymentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Деплой не найден"));
        return toDto(deployment);
    }

    private DeploymentDto toDto(DeploymentEntity deployment) {
        DeploymentDto dto = new DeploymentDto();
        dto.setId(deployment.getId());
        dto.setSchemaId(deployment.getSchema().getId());
        dto.setSubdomain(deployment.getSubdomain());
        dto.setStatus(deployment.getStatus());
        dto.setUrl("http://" + deployment.getSubdomain() + ".mockge.local:3000");
        dto.setCreatedAt(deployment.getCreatedAt());
        return dto;
    }
}
