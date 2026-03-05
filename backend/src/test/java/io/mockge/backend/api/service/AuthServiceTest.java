package io.mockge.backend.api.service;

import io.mockge.backend.TestFixtures;
import io.mockge.backend.api.dto.AuthRequest;
import io.mockge.backend.api.dto.AuthResponse;
import io.mockge.backend.api.dto.RegisterRequest;
import io.mockge.backend.api.entity.UserEntity;
import io.mockge.backend.api.repository.UserRepository;
import io.mockge.backend.api.security.CustomUserDetails;
import io.mockge.backend.api.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Юнит-тесты AuthService")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private AuthenticationManager authenticationManager;

    private AuthService authService;

    private UserEntity testUser;
    private final UUID testUserId = UUID.randomUUID();
    private final String testEmail = "test@example.com";
    private final String testPassword = "password123";
    private final String testName = "Test User";
    private final String encodedPassword = "encodedPassword123";
    private final String token = "test.jwt.token";

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtUtil, authenticationManager);

        testUser = TestFixtures.createUserEntity(testUserId, testEmail, encodedPassword, testName);
    }

    @Test
    @DisplayName("Регистрация нового пользователя успешна")
    void register_Success() {
        // Arrange
        RegisterRequest request = new RegisterRequest(testEmail, testPassword, testName);

        when(userRepository.existsByEmail(testEmail)).thenReturn(false);
        when(passwordEncoder.encode(testPassword)).thenReturn(encodedPassword);
        when(jwtUtil.generateToken(any(CustomUserDetails.class))).thenReturn(token);
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity user = invocation.getArgument(0);
            user.setId(testUserId);
            return user;
        });

        // Act
        AuthResponse response = authService.register(request);

        // Assert
        assertNotNull(response);
        assertEquals(token, response.getToken());
        assertEquals(token, response.getRefreshToken());
        assertNotNull(response.getUser());
        assertEquals(testEmail, response.getUser().getEmail());
        assertEquals(testName, response.getUser().getName());
        assertEquals(testUserId.toString(), response.getUser().getId());

        // Verify user was saved
        ArgumentCaptor<UserEntity> userCaptor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(userCaptor.capture());
        UserEntity savedUser = userCaptor.getValue();
        assertEquals(testEmail, savedUser.getEmail());
        assertEquals(encodedPassword, savedUser.getPasswordHash());
        assertEquals(testName, savedUser.getName());
        assertEquals(testUserId, savedUser.getId());
    }

    @Test
    @DisplayName("Регистрация пользователя с существующим email выбрасывает исключение")
    void register_EmailAlreadyExists_ThrowsException() {
        // Arrange
        RegisterRequest request = new RegisterRequest(testEmail, testPassword, testName);
        when(userRepository.existsByEmail(testEmail)).thenReturn(true);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authService.register(request)
        );
        assertEquals("Пользователь с таким email уже существует", exception.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Вход пользователя успешен")
    void login_Success() {
        // Arrange
        AuthRequest request = new AuthRequest(testEmail, testPassword);

        when(jwtUtil.generateToken(any(CustomUserDetails.class))).thenReturn(token);
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));

        // Act
        AuthResponse response = authService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals(token, response.getToken());
        assertEquals(token, response.getRefreshToken());
        assertEquals(testUserId.toString(), response.getUser().getId());
        assertEquals(testEmail, response.getUser().getEmail());
        assertEquals(testName, response.getUser().getName());

        verify(authenticationManager).authenticate(
                any(UsernamePasswordAuthenticationToken.class)
        );
    }

    @Test
    @DisplayName("Вход с неверным email выбрасывает исключение")
    void login_UserNotFound_ThrowsException() {
        // Arrange
        AuthRequest request = new AuthRequest(testEmail, testPassword);
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authService.login(request)
        );
        assertEquals("Неверный email или пароль", exception.getMessage());
    }

    @Test
    @DisplayName("Генерация auth response создает корректные DTO")
    void generateAuthResponse_CreatesCorrectDto() {
        // Arrange
        when(jwtUtil.generateToken(any(CustomUserDetails.class))).thenReturn(token);

        // Act - через метод register (который вызывает generateAuthResponse)
        RegisterRequest request = new RegisterRequest(testEmail, testPassword, testName);
        when(userRepository.existsByEmail(testEmail)).thenReturn(false);
        when(passwordEncoder.encode(testPassword)).thenReturn(encodedPassword);
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity user = invocation.getArgument(0);
            user.setId(testUserId);
            return user;
        });

        AuthResponse response = authService.register(request);

        // Assert
        assertNotNull(response);
        assertEquals(token, response.getToken());
        assertEquals(token, response.getRefreshToken());
        assertEquals(testEmail, response.getUser().getEmail());
        assertEquals(testName, response.getUser().getName());
        assertNotNull(response.getUser().getId());
        assertEquals(testUserId.toString(), response.getUser().getId());
    }
}
