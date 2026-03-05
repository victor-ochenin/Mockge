package io.mockge.backend.api.service;

import io.mockge.backend.TestFixtures;
import io.mockge.backend.api.dto.CreateProjectRequest;
import io.mockge.backend.api.dto.ProjectDto;
import io.mockge.backend.api.dto.UpdateProjectRequest;
import io.mockge.backend.api.entity.ProjectEntity;
import io.mockge.backend.api.entity.UserEntity;
import io.mockge.backend.api.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Юнит-тесты ProjectService")
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserService userService;

    private ProjectService projectService;

    private UserEntity testOwner;
    private ProjectEntity testProject;
    private final UUID testUserId = UUID.randomUUID();
    private final UUID testProjectId = UUID.randomUUID();
    private final String projectName = "Test Project";
    private final String projectDescription = "Test Description";

    @BeforeEach
    void setUp() {
        projectService = new ProjectService(projectRepository, userService);

        testOwner = TestFixtures.createUserEntity(testUserId, "owner@example.com", "hash", "Owner");
        testProject = TestFixtures.createProjectEntity(testProjectId, projectName, projectDescription, testOwner);
    }

    @Test
    @DisplayName("Поиск всех проектов владельца успешен")
    void findAllByOwnerId_Success() {
        // Arrange
        ProjectEntity project1 = TestFixtures.createProjectEntity("Project 1", "Desc 1", testOwner);
        ProjectEntity project2 = TestFixtures.createProjectEntity("Project 2", "Desc 2", testOwner);
        List<ProjectEntity> projects = Arrays.asList(project1, project2);

        when(projectRepository.findByOwnerId(testUserId)).thenReturn(projects);

        // Act
        List<ProjectDto> result = projectService.findAllByOwnerId(testUserId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Project 1", result.get(0).getName());
        assertEquals("Project 2", result.get(1).getName());
        assertEquals(testUserId, result.get(0).getOwnerId());
        assertEquals(testUserId, result.get(1).getOwnerId());
    }

    @Test
    @DisplayName("Поиск проектов пустого владельца возвращает пустой список")
    void findAllByOwnerId_EmptyList() {
        // Arrange
        when(projectRepository.findByOwnerId(testUserId)).thenReturn(List.of());

        // Act
        List<ProjectDto> result = projectService.findAllByOwnerId(testUserId);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Создание проекта успешно")
    void create_Success() {
        // Arrange
        CreateProjectRequest request = new CreateProjectRequest(projectName, projectDescription);
        when(userService.findById(testUserId)).thenReturn(testOwner);
        when(projectRepository.save(any(ProjectEntity.class))).thenAnswer(invocation -> {
            ProjectEntity entity = invocation.getArgument(0);
            if (entity.getId() == null) {
                entity.setId(UUID.randomUUID());
            }
            entity.setCreatedAt(Instant.now());
            entity.setUpdatedAt(Instant.now());
            return entity;
        });

        // Act
        ProjectDto result = projectService.create(request, testUserId);

        // Assert
        assertNotNull(result);
        assertEquals(projectName, result.getName());
        assertEquals(projectDescription, result.getDescription());
        assertEquals(testUserId, result.getOwnerId());
        assertNotNull(result.getId());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());

        verify(projectRepository).save(any(ProjectEntity.class));
    }

    @Test
    @DisplayName("Поиск проекта по ID успешен")
    void findById_Success() {
        // Arrange
        when(projectRepository.findById(testProjectId)).thenReturn(Optional.of(testProject));

        // Act
        ProjectDto result = projectService.findById(testProjectId);

        // Assert
        assertNotNull(result);
        assertEquals(testProjectId, result.getId());
        assertEquals(projectName, result.getName());
        assertEquals(projectDescription, result.getDescription());
        assertEquals(testUserId, result.getOwnerId());
    }

    @Test
    @DisplayName("Поиск несуществующего проекта выбрасывает исключение")
    void findById_NotFound_ThrowsException() {
        // Arrange
        when(projectRepository.findById(testProjectId)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> projectService.findById(testProjectId)
        );
        assertEquals("Проект не найден", exception.getMessage());
    }

    @Test
    @DisplayName("Обновление проекта владельцем успешно")
    void update_ByOwner_Success() {
        // Arrange
        UpdateProjectRequest request = new UpdateProjectRequest("Updated Name", "Updated Description");
        when(projectRepository.findById(testProjectId)).thenReturn(Optional.of(testProject));
        when(projectRepository.save(any(ProjectEntity.class))).thenAnswer(invocation -> {
            ProjectEntity entity = invocation.getArgument(0);
            entity.setUpdatedAt(Instant.now());
            return entity;
        });

        // Act
        ProjectDto result = projectService.update(testProjectId, request, testUserId);

        // Assert
        assertNotNull(result);
        assertEquals("Updated Name", result.getName());
        assertEquals("Updated Description", result.getDescription());
        assertEquals(testUserId, result.getOwnerId());

        verify(projectRepository).save(testProject);
    }

    @Test
    @DisplayName("Обновление проекта с частичными данными")
    void update_PartialData_Success() {
        // Arrange
        UpdateProjectRequest request = new UpdateProjectRequest("Only Name", null);
        when(projectRepository.findById(testProjectId)).thenReturn(Optional.of(testProject));
        when(projectRepository.save(any(ProjectEntity.class))).thenAnswer(invocation -> {
            ProjectEntity entity = invocation.getArgument(0);
            entity.setUpdatedAt(Instant.now());
            return entity;
        });

        // Act
        ProjectDto result = projectService.update(testProjectId, request, testUserId);

        // Assert
        assertNotNull(result);
        assertEquals("Only Name", result.getName());
        assertEquals(projectDescription, result.getDescription()); // Описание не изменилось
    }

    @Test
    @DisplayName("Обновление проекта не владельцем выбрасывает исключение")
    void update_ByNonOwner_ThrowsException() {
        // Arrange
        UUID otherUserId = UUID.randomUUID();
        UpdateProjectRequest request = new UpdateProjectRequest("Name", "Desc");
        when(projectRepository.findById(testProjectId)).thenReturn(Optional.of(testProject));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> projectService.update(testProjectId, request, otherUserId)
        );
        assertEquals("Только владелец может редактировать проект", exception.getMessage());
        verify(projectRepository, never()).save(any());
    }

    @Test
    @DisplayName("Обновление несуществующего проекта выбрасывает исключение")
    void update_NotFound_ThrowsException() {
        // Arrange
        UpdateProjectRequest request = new UpdateProjectRequest("Name", "Desc");
        when(projectRepository.findById(testProjectId)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> projectService.update(testProjectId, request, testUserId)
        );
        assertEquals("Проект не найден", exception.getMessage());
    }

    @Test
    @DisplayName("Удаление проекта владельцем успешно")
    void delete_ByOwner_Success() {
        // Arrange
        when(projectRepository.findById(testProjectId)).thenReturn(Optional.of(testProject));
        doNothing().when(projectRepository).delete(testProject);

        // Act
        projectService.delete(testProjectId, testUserId);

        // Assert
        verify(projectRepository).delete(testProject);
    }

    @Test
    @DisplayName("Удаление проекта не владельцем выбрасывает исключение")
    void delete_ByNonOwner_ThrowsException() {
        // Arrange
        UUID otherUserId = UUID.randomUUID();
        when(projectRepository.findById(testProjectId)).thenReturn(Optional.of(testProject));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> projectService.delete(testProjectId, otherUserId)
        );
        assertEquals("Только владелец может удалять проект", exception.getMessage());
        verify(projectRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Удаление несуществующего проекта выбрасывает исключение")
    void delete_NotFound_ThrowsException() {
        // Arrange
        when(projectRepository.findById(testProjectId)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> projectService.delete(testProjectId, testUserId)
        );
        assertEquals("Проект не найден", exception.getMessage());
    }
}
