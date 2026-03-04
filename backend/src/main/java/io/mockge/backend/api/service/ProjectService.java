package io.mockge.backend.api.service;

import io.mockge.backend.api.dto.CreateProjectRequest;
import io.mockge.backend.api.dto.ProjectDto;
import io.mockge.backend.api.dto.UpdateProjectRequest;
import io.mockge.backend.api.entity.ProjectEntity;
import io.mockge.backend.api.entity.UserEntity;
import io.mockge.backend.api.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<ProjectDto> findAllByOwnerId(UUID ownerId) {
        return projectRepository.findByOwnerId(ownerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectDto create(CreateProjectRequest request, UUID ownerId) {
        UserEntity owner = userService.findById(ownerId);

        ProjectEntity project = ProjectEntity.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(owner)
                .build();

        projectRepository.save(project);
        return toDto(project);
    }

    @Transactional(readOnly = true)
    public ProjectDto findById(UUID id) {
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));
        return toDto(project);
    }

    @Transactional
    public ProjectDto update(UUID id, UpdateProjectRequest request, UUID currentUserId) {
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        if (!project.getOwner().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("Только владелец может редактировать проект");
        }

        if (request.getName() != null) {
            project.setName(request.getName());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }

        projectRepository.save(project);
        return toDto(project);
    }

    @Transactional
    public void delete(UUID id, UUID currentUserId) {
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        if (!project.getOwner().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("Только владелец может удалять проект");
        }

        projectRepository.delete(project);
    }

    private ProjectDto toDto(ProjectEntity project) {
        return ProjectDto.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .ownerId(project.getOwner().getId())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
