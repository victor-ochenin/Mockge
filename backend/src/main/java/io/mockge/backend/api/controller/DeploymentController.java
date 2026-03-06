package io.mockge.backend.api.controller;

import io.mockge.backend.api.dto.DeploymentDto;
import io.mockge.backend.api.service.DeploymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/mock/deployments")
public class DeploymentController {

    private final DeploymentService deploymentService;

    public DeploymentController(DeploymentService deploymentService) {
        this.deploymentService = deploymentService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeploymentDto> getDeployment(@PathVariable UUID id) {
        DeploymentDto deployment = deploymentService.findById(id);
        return ResponseEntity.ok(deployment);
    }

    @GetMapping
    public ResponseEntity<List<DeploymentDto>> getAllDeployments() {
        // Заглушка - можно расширить позже
        return ResponseEntity.ok(List.of());
    }
}
