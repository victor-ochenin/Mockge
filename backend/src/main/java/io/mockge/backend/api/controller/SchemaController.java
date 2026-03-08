package io.mockge.backend.api.controller;

import io.mockge.backend.api.dto.CreateSchemaRequest;
import io.mockge.backend.api.dto.DeploySchemaRequest;
import io.mockge.backend.api.dto.DeploymentDto;
import io.mockge.backend.api.dto.SchemaDto;
import io.mockge.backend.api.entity.UserEntity;
import io.mockge.backend.api.service.DeploymentService;
import io.mockge.backend.api.service.SchemaService;
import io.mockge.backend.api.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class SchemaController {

    private static final Logger logger = LoggerFactory.getLogger(SchemaController.class);

    private final SchemaService schemaService;
    private final DeploymentService deploymentService;
    private final UserService userService;

    public SchemaController(SchemaService schemaService, DeploymentService deploymentService, UserService userService) {
        this.schemaService = schemaService;
        this.deploymentService = deploymentService;
        this.userService = userService;
    }

    @PostMapping("/projects/{projectId}/schemas")
    public ResponseEntity<SchemaDto> createSchema(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateSchemaRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            String username = userDetails.getUsername();
            logger.info("Creating schema for user: {}", username);
            // Ищем пользователя по clerk_id, так как email может быть в любом формате
            UserEntity user = userService.findByClerkIdOrEmail(username);
            if (user == null) {
                logger.error("User not found: {}", username);
                return ResponseEntity.status(404).build();
            }
            logger.info("Found user: {} with id: {}", user.getEmail(), user.getId());
            SchemaDto schema = schemaService.create(projectId, request, user.getId());
            return ResponseEntity.ok(schema);
        } catch (IllegalArgumentException e) {
            logger.error("Bad request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Ошибка при создании схемы", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/projects/{projectId}/schemas")
    public ResponseEntity<List<SchemaDto>> getSchemas(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        List<SchemaDto> schemas = schemaService.findByProjectId(projectId);
        return ResponseEntity.ok(schemas);
    }

    @GetMapping("/projects/{projectId}/schemas/active")
    public ResponseEntity<SchemaDto> getActiveSchema(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        SchemaDto schema = schemaService.findActiveByProjectId(projectId);
        if (schema == null) {
            return ResponseEntity.status(404).build();
        }
        return ResponseEntity.ok(schema);
    }

    @PostMapping("/schemas/{schemaId}/activate")
    public ResponseEntity<SchemaDto> activateSchema(
            @PathVariable UUID schemaId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        UserEntity user = userService.findByEmail(userDetails.getUsername());
        SchemaDto schema = schemaService.activate(schemaId, user.getId());
        return ResponseEntity.ok(schema);
    }

    @GetMapping("/schemas/{schemaId}")
    public ResponseEntity<SchemaDto> getSchema(
            @PathVariable UUID schemaId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        SchemaDto schema = schemaService.findById(schemaId);
        return ResponseEntity.ok(schema);
    }

    @PostMapping("/schemas/{schemaId}/deploy")
    public ResponseEntity<DeploymentDto> deploySchema(
            @PathVariable UUID schemaId,
            @Valid @RequestBody(required = false) DeploySchemaRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        
        // Получаем схему чтобы найти проект и его subdomain
        SchemaDto schema = schemaService.findById(schemaId);
        if (schema == null) {
            return ResponseEntity.status(404).build();
        }
        
        if (request == null) {
            request = new DeploySchemaRequest();
        }
        
        // Используем subdomain проекта - это гарантирует 1 ключ в Redis на проект
        if (request.getSubdomain() == null) {
            request.setSubdomain(schema.getProjectSubdomain());
        }
        
        DeploymentDto deployment = deploymentService.deploy(schemaId, request);
        return ResponseEntity.ok(deployment);
    }
}
