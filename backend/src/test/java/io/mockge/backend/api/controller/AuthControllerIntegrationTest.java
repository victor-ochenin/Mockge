package io.mockge.backend.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.mockge.backend.api.dto.AuthRequest;
import io.mockge.backend.api.dto.AuthResponse;
import io.mockge.backend.api.dto.RegisterRequest;
import io.mockge.backend.api.entity.UserEntity;
import io.mockge.backend.api.repository.UserRepository;
import io.mockge.backend.api.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Интеграционные тесты AuthController")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Регистрация нового пользователя успешна")
    void register_Success() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest(
                "newuser@example.com",
                "password123",
                "New User"
        );

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.user.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.user.name").value("New User"));

        // Verify user was saved
        assertTrue(userRepository.existsByEmail("newuser@example.com"));
    }

    @Test
    @DisplayName("Регистрация с существующим email возвращает ошибку")
    void register_EmailAlreadyExists_ReturnsError() throws Exception {
        // Arrange
        UserEntity existingUser = new UserEntity();
        existingUser.setId(UUID.randomUUID());
        existingUser.setEmail("existing@example.com");
        existingUser.setPasswordHash(passwordEncoder.encode("password123"));
        existingUser.setName("Existing User");
        userRepository.save(existingUser);

        RegisterRequest request = new RegisterRequest(
                "existing@example.com",
                "password123",
                "Another User"
        );

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is5xxServerError());
    }

    @Test
    @DisplayName("Регистрация с пустым email возвращает ошибку валидации")
    void register_EmptyEmail_ReturnsValidationError() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest(
                "",
                "password123",
                "User"
        );

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Регистрация с коротким паролем возвращает ошибку валидации")
    void register_ShortPassword_ReturnsValidationError() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest(
                "user@example.com",
                "12345",
                "User"
        );

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Регистрация с некорректным email возвращает ошибку валидации")
    void register_InvalidEmail_ReturnsValidationError() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest(
                "invalid-email",
                "password123",
                "User"
        );

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Вход пользователя успешен")
    void login_Success() throws Exception {
        // Arrange
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setEmail("loginuser@example.com");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setName("Login User");
        userRepository.save(user);

        AuthRequest request = new AuthRequest(
                "loginuser@example.com",
                "password123"
        );

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.user.email").value("loginuser@example.com"))
                .andExpect(jsonPath("$.user.name").value("Login User"));
    }

    @Test
    @DisplayName("Вход с неверным паролем возвращает ошибку")
    void login_WrongPassword_ReturnsError() throws Exception {
        // Arrange
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setEmail("user@example.com");
        user.setPasswordHash(passwordEncoder.encode("correctpassword"));
        user.setName("User");
        userRepository.save(user);

        AuthRequest request = new AuthRequest(
                "user@example.com",
                "wrongpassword"
        );

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Вход с несуществующим email возвращает ошибку")
    void login_NonExistentEmail_ReturnsError() throws Exception {
        // Arrange
        AuthRequest request = new AuthRequest(
                "nonexistent@example.com",
                "password123"
        );

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Вход с пустым email возвращает ошибку валидации")
    void login_EmptyEmail_ReturnsValidationError() throws Exception {
        // Arrange
        AuthRequest request = new AuthRequest("", "password123");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Получение токена и его валидация")
    void login_TokenValidation_Success() throws Exception {
        // Arrange
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setEmail("validtoken@example.com");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setName("Token User");
        userRepository.save(user);

        AuthRequest request = new AuthRequest(
                "validtoken@example.com",
                "password123"
        );

        // Act
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String responseContent = result.getResponse().getContentAsString();
        AuthResponse response = objectMapper.readValue(responseContent, AuthResponse.class);

        // Assert
        assertNotNull(response.getToken());
        assertNotNull(response.getRefreshToken());

        // Validate token using JwtUtil
        String username = jwtUtil.extractUsername(response.getToken());
        assertEquals("validtoken@example.com", username);
    }
}
