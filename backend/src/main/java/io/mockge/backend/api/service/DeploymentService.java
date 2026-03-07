package io.mockge.backend.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.mockge.backend.api.dto.DeploySchemaRequest;
import io.mockge.backend.api.dto.DeploymentDto;
import io.mockge.backend.api.entity.DeploymentEntity;
import io.mockge.backend.api.entity.SchemaEntity;
import io.mockge.backend.api.repository.DeploymentRepository;
import io.mockge.backend.api.repository.SchemaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DeploymentService {

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
        SchemaEntity schema = schemaRepository.findById(schemaId)
                .orElseThrow(() -> new IllegalArgumentException("Схема не найдена"));

        DeploymentEntity deployment = new DeploymentEntity();
        deployment.setSchema(schema);
        deployment.setSubdomain(request.getSubdomain());
        deployment.setStatus("active");

        if (request.getSettings() != null) {
            try {
                String settingsJson = objectMapper.writeValueAsString(request.getSettings());
                deployment.setSettings(settingsJson);
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Ошибка сериализации настроек", e);
            }
        }

        deploymentRepository.save(deployment);

        // Публикуем схему в Redis для прокси-сервера
        try {
            Object schemaJson = objectMapper.readValue(schema.getSchemaJson(), Object.class);
            redisService.publishSchema(request.getSubdomain(), schemaJson);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Ошибка публикации схемы в Redis", e);
        }

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
