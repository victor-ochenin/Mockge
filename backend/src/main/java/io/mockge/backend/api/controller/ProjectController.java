package io.mockge.backend.api.controller;

import io.mockge.backend.api.dto.CreateProjectRequest;
import io.mockge.backend.api.dto.ProjectDto;
import io.mockge.backend.api.dto.UpdateProjectRequest;
import io.mockge.backend.api.security.CustomUserDetails;
import io.mockge.backend.api.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectDto>> getProjects(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ProjectDto> projects = projectService.findAllByOwnerId(userDetails.getUser().getId());
        return ResponseEntity.ok(projects);
    }

    @PostMapping
    public ResponseEntity<ProjectDto> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ProjectDto project = projectService.create(request, userDetails.getUser().getId());
        return ResponseEntity.ok(project);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProject(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ProjectDto project = projectService.findById(id);
        return ResponseEntity.ok(project);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectDto> updateProject(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProjectRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ProjectDto project = projectService.update(id, request, userDetails.getUser().getId());
        return ResponseEntity.ok(project);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        projectService.delete(id, userDetails.getUser().getId());
        return ResponseEntity.noContent().build();
    }
}
