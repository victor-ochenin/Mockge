package io.mockge.backend.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.mockge.backend.api.dto.CreateProjectRequest;
import io.mockge.backend.api.dto.ProjectDto;
import io.mockge.backend.api.dto.UpdateProjectRequest;
import io.mockge.backend.api.entity.ProjectEntity;
import io.mockge.backend.api.entity.UserEntity;
import io.mockge.backend.api.repository.ProjectRepository;
import io.mockge.backend.api.repository.UserRepository;
import io.mockge.backend.api.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Интеграционные тесты ProjectController")
class ProjectControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private UserEntity testUser;
    private String authToken;

    @BeforeEach
    void setUp() {
        projectRepository.deleteAll();
        userRepository.deleteAll();

        // Создаем тестового пользователя
        testUser = new UserEntity();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("testuser@example.com");
        testUser.setPasswordHash(passwordEncoder.encode("password123"));
        testUser.setName("Test User");
        userRepository.save(testUser);

        // Получаем токен аутентификации
        authToken = "Bearer " + jwtUtil.generateToken(
                new org.springframework.security.core.userdetails.User(
                        testUser.getEmail(),
                        testUser.getPasswordHash(),
                        java.util.Collections.emptyList()
                )
        );
    }

    @Test
    @DisplayName("Создание проекта успешно")
    void createProject_Success() throws Exception {
        // Arrange
        CreateProjectRequest request = new CreateProjectRequest(
                "Test Project",
                "Test Description"
        );

        // Act & Assert
        MvcResult result = mockMvc.perform(post("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Test Project"))
                .andExpect(jsonPath("$.description").value("Test Description"))
                .andExpect(jsonPath("$.ownerId").value(testUser.getId().toString()))
                .andReturn();

        // Verify project was saved
        String responseContent = result.getResponse().getContentAsString();
        ProjectDto response = objectMapper.readValue(responseContent, ProjectDto.class);
        assertTrue(projectRepository.findById(response.getId()).isPresent());
    }

    @Test
    @DisplayName("Создание проекта с пустым названием возвращает ошибку валидации")
    void createProject_EmptyName_ReturnsValidationError() throws Exception {
        // Arrange
        CreateProjectRequest request = new CreateProjectRequest("", "Description");

        // Act & Assert
        mockMvc.perform(post("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Получение списка проектов владельца успешно")
    void getProjects_Success() throws Exception {
        // Arrange
        ProjectEntity project1 = createProject("Project 1", "Description 1", testUser);
        ProjectEntity project2 = createProject("Project 2", "Description 2", testUser);
        projectRepository.saveAll(java.util.List.of(project1, project2));

        // Act & Assert
        mockMvc.perform(get("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, authToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].ownerId").value(testUser.getId().toString()))
                .andExpect(jsonPath("$[1].ownerId").value(testUser.getId().toString()));
    }

    @Test
    @DisplayName("Получение пустого списка проектов")
    void getProjects_EmptyList() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, authToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("Получение проекта по ID успешно")
    void getProject_Success() throws Exception {
        // Arrange
        ProjectEntity project = createProject("Single Project", "Single Description", testUser);
        projectRepository.save(project);

        // Act & Assert
        mockMvc.perform(get("/api/projects/{id}", project.getId())
                        .header(HttpHeaders.AUTHORIZATION, authToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(project.getId().toString()))
                .andExpect(jsonPath("$.name").value("Single Project"))
                .andExpect(jsonPath("$.description").value("Single Description"));
    }

    @Test
    @DisplayName("Получение несуществующего проекта возвращает ошибку")
    void getProject_NotFound() throws Exception {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();

        // Act & Assert
        mockMvc.perform(get("/api/projects/{id}", nonExistentId)
                        .header(HttpHeaders.AUTHORIZATION, authToken))
                .andExpect(status().is5xxServerError());
    }

    @Test
    @DisplayName("Обновление проекта владельцем успешно")
    void updateProject_ByOwner_Success() throws Exception {
        // Arrange
        ProjectEntity project = createProject("Original Name", "Original Description", testUser);
        projectRepository.save(project);

        UpdateProjectRequest request = new UpdateProjectRequest(
                "Updated Name",
                "Updated Description"
        );

        // Act & Assert
        mockMvc.perform(put("/api/projects/{id}", project.getId())
                        .header(HttpHeaders.AUTHORIZATION, authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(project.getId().toString()))
                .andExpect(jsonPath("$.name").value("Updated Name"))
                .andExpect(jsonPath("$.description").value("Updated Description"));
    }

    @Test
    @DisplayName("Обновление проекта с частичными данными")
    void updateProject_PartialData_Success() throws Exception {
        // Arrange
        ProjectEntity project = createProject("Original Name", "Original Description", testUser);
        projectRepository.save(project);

        UpdateProjectRequest request = new UpdateProjectRequest("Only Name Updated", null);

        // Act & Assert
        MvcResult result = mockMvc.perform(put("/api/projects/{id}", project.getId())
                        .header(HttpHeaders.AUTHORIZATION, authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String responseContent = result.getResponse().getContentAsString();
        ProjectDto response = objectMapper.readValue(responseContent, ProjectDto.class);
        assertEquals("Only Name Updated", response.getName());
        assertEquals("Original Description", response.getDescription());
    }

    @Test
    @DisplayName("Обновление несуществующего проекта возвращает ошибку")
    void updateProject_NotFound() throws Exception {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        UpdateProjectRequest request = new UpdateProjectRequest("Name", "Desc");

        // Act & Assert
        mockMvc.perform(put("/api/projects/{id}", nonExistentId)
                        .header(HttpHeaders.AUTHORIZATION, authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is5xxServerError());
    }

    @Test
    @DisplayName("Удаление проекта владельцем успешно")
    void deleteProject_ByOwner_Success() throws Exception {
        // Arrange
        ProjectEntity project = createProject("To Delete", "Description", testUser);
        projectRepository.save(project);
        UUID projectId = project.getId();

        // Act & Assert
        mockMvc.perform(delete("/api/projects/{id}", projectId)
                        .header(HttpHeaders.AUTHORIZATION, authToken))
                .andExpect(status().isNoContent());

        // Verify project was deleted
        assertFalse(projectRepository.findById(projectId).isPresent());
    }

    @Test
    @DisplayName("Удаление несуществующего проекта возвращает ошибку")
    void deleteProject_NotFound() throws Exception {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();

        // Act & Assert
        mockMvc.perform(delete("/api/projects/{id}", nonExistentId)
                        .header(HttpHeaders.AUTHORIZATION, authToken))
                .andExpect(status().is5xxServerError());
    }

    @Test
    @DisplayName("Запрос без токена аутентификации возвращает 401")
    void requestWithoutToken_ReturnsUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Запрос с невалидным токеном возвращает ошибку")
    void requestWithInvalidToken_ReturnsError() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer invalid.token.here"))
                .andExpect(status().isUnauthorized());
    }

    // Helper method
    private ProjectEntity createProject(String name, String description, UserEntity owner) {
        ProjectEntity project = new ProjectEntity();
        project.setId(UUID.randomUUID());
        project.setName(name);
        project.setDescription(description);
        project.setOwner(owner);
        return project;
    }
}
