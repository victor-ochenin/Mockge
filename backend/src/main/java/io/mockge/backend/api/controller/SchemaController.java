package io.mockge.backend.api.controller;

import io.mockge.backend.api.dto.CreateSchemaRequest;
import io.mockge.backend.api.dto.SchemaDto;
import io.mockge.backend.api.security.CustomUserDetails;
import io.mockge.backend.api.service.SchemaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
public class SchemaController {

    private final SchemaService schemaService;

    public SchemaController(SchemaService schemaService) {
        this.schemaService = schemaService;
    }

    @PostMapping("/{projectId}/schemas")
    public ResponseEntity<SchemaDto> createSchema(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateSchemaRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        SchemaDto schema = schemaService.create(projectId, request, userDetails.getUser().getId());
        return ResponseEntity.ok(schema);
    }

    @GetMapping("/{projectId}/schemas")
    public ResponseEntity<List<SchemaDto>> getSchemas(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<SchemaDto> schemas = schemaService.findByProjectId(projectId);
        return ResponseEntity.ok(schemas);
    }

    @GetMapping("/{projectId}/schemas/active")
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
}
