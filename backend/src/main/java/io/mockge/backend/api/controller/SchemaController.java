package io.mockge.backend.api.controller;

import io.mockge.backend.api.dto.CreateSchemaRequest;
import io.mockge.backend.api.dto.DeploySchemaRequest;
import io.mockge.backend.api.dto.DeploymentDto;
import io.mockge.backend.api.dto.SchemaDto;
import io.mockge.backend.api.security.CustomUserDetails;
import io.mockge.backend.api.service.DeploymentService;
import io.mockge.backend.api.service.SchemaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class SchemaController {

    private final SchemaService schemaService;
    private final DeploymentService deploymentService;

    public SchemaController(SchemaService schemaService, DeploymentService deploymentService) {
        this.schemaService = schemaService;
        this.deploymentService = deploymentService;
    }

    @PostMapping("/projects/{projectId}/schemas")
    public ResponseEntity<SchemaDto> createSchema(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateSchemaRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        SchemaDto schema = schemaService.create(projectId, request, userDetails.getUser().getId());
        return ResponseEntity.ok(schema);
    }

    @GetMapping("/projects/{projectId}/schemas")
    public ResponseEntity<List<SchemaDto>> getSchemas(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<SchemaDto> schemas = schemaService.findByProjectId(projectId);
        return ResponseEntity.ok(schemas);
    }

    @GetMapping("/projects/{projectId}/schemas/active")
    public ResponseEntity<SchemaDto> getActiveSchema(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        SchemaDto schema = schemaService.findActiveByProjectId(projectId);
        return ResponseEntity.ok(schema);
    }

    @PostMapping("/schemas/{schemaId}/activate")
    public ResponseEntity<SchemaDto> activateSchema(
            @PathVariable UUID schemaId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        SchemaDto schema = schemaService.activate(schemaId, userDetails.getUser().getId());
        return ResponseEntity.ok(schema);
    }

    @GetMapping("/schemas/{schemaId}")
    public ResponseEntity<SchemaDto> getSchema(
            @PathVariable UUID schemaId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        SchemaDto schema = schemaService.findById(schemaId);
        return ResponseEntity.ok(schema);
    }

    @PostMapping("/schemas/{schemaId}/deploy")
    public ResponseEntity<DeploymentDto> deploySchema(
            @PathVariable UUID schemaId,
            @Valid @RequestBody(required = false) DeploySchemaRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (request == null) {
            request = new DeploySchemaRequest();
        }
        if (request.getSubdomain() == null) {
            request.setSubdomain("mock-" + schemaId.toString().substring(0, 8));
        }
        DeploymentDto deployment = deploymentService.deploy(schemaId, request);
        return ResponseEntity.ok(deployment);
    }
}
