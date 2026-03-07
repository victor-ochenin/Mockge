package io.mockge.backend.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.mockge.backend.api.dto.CreateSchemaRequest;
import io.mockge.backend.api.dto.SchemaDto;
import io.mockge.backend.api.entity.ProjectEntity;
import io.mockge.backend.api.entity.SchemaEntity;
import io.mockge.backend.api.entity.UserEntity;
import io.mockge.backend.api.repository.ProjectRepository;
import io.mockge.backend.api.repository.SchemaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SchemaService {

    private final SchemaRepository schemaRepository;
    private final ProjectRepository projectRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    public SchemaService(SchemaRepository schemaRepository,
                         ProjectRepository projectRepository,
                         UserService userService,
                         ObjectMapper objectMapper) {
        this.schemaRepository = schemaRepository;
        this.projectRepository = projectRepository;
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<SchemaDto> findByProjectId(UUID projectId) {
        return schemaRepository.findByProjectId(projectId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SchemaDto findById(UUID id) {
        SchemaEntity schema = schemaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Схема не найдена"));
        return toDto(schema);
    }

    @Transactional
    public SchemaDto create(UUID projectId, CreateSchemaRequest request, UUID userId) {
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        UserEntity user = userService.findById(userId);

        // Получаем следующую версию
        int nextVersion = schemaRepository.findByProjectIdAndIsActive(projectId, true)
                .map(s -> s.getVersion() + 1)
                .orElse(1);

        SchemaEntity schema = new SchemaEntity();
        schema.setProject(project);
        schema.setVersion(nextVersion);
        schema.setName(request.getName());
        schema.setCreatedBy(user);
        schema.setIsActive(false);

        // Сохраняем схему как JSON
        try {
            String schemaJson = objectMapper.writeValueAsString(request.getSchemaJson());
            schema.setSchemaJson(schemaJson);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Ошибка сериализации схемы", e);
        }

        schemaRepository.save(schema);
        return toDto(schema);
    }

    @Transactional
    public SchemaDto activate(UUID schemaId, UUID userId) {
        SchemaEntity schema = schemaRepository.findById(schemaId)
                .orElseThrow(() -> new IllegalArgumentException("Схема не найдена"));

        if (!schema.getCreatedBy().getId().equals(userId)) {
            throw new IllegalArgumentException("Только создатель может активировать схему");
        }

        // Деактивируем все схемы этого проекта
        List<SchemaEntity> projectSchemas = schemaRepository.findByProjectId(schema.getProject().getId());
        for (SchemaEntity s : projectSchemas) {
            s.setIsActive(false);
        }
        schemaRepository.saveAll(projectSchemas);

        // Активируем нужную схему
        schema.setIsActive(true);
        schemaRepository.save(schema);

        return toDto(schema);
    }

    @Transactional(readOnly = true)
    public SchemaDto findActiveByProjectId(UUID projectId) {
        return schemaRepository.findByProjectIdAndIsActive(projectId, true)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalArgumentException("Активная схема не найдена"));
    }

    private SchemaDto toDto(SchemaEntity schema) {
        SchemaDto dto = new SchemaDto();
        dto.setId(schema.getId());
        dto.setProjectId(schema.getProject().getId());
        dto.setName(schema.getName());
        dto.setVersion(schema.getVersion());
        dto.setIsActive(schema.getIsActive());
        dto.setCreatedAt(schema.getCreatedAt());

        // Парсим JSON схему
        try {
            Object schemaObj = objectMapper.readValue(schema.getSchemaJson(), Object.class);
            dto.setSchemaJson(schemaObj);
        } catch (JsonProcessingException e) {
            // Игнорируем ошибки парсинга для существующих записей
        }

        return dto;
    }
}
