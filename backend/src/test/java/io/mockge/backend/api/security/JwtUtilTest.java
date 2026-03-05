package io.mockge.backend.api.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Юнит-тесты JwtUtil")
class JwtUtilTest {

    private JwtUtil jwtUtil;
    private final String testSecret = "test-secret-key-for-jwt-token-generation-must-be-long-enough";
    private final long testExpirationMs = 3600000; // 1 hour
    private UserDetails testUserDetails;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(testSecret, testExpirationMs);
        testUserDetails = new User("test@example.com", "password", Collections.emptyList());
    }

    @Test
    @DisplayName("Генерация токена успешна")
    void generateToken_Success() {
        // Act
        String token = jwtUtil.generateToken(testUserDetails);

        // Assert
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.length() > 0);
    }

    @Test
    @DisplayName("Извлечение username из токена успешно")
    void extractUsername_Success() {
        // Arrange
        String token = jwtUtil.generateToken(testUserDetails);

        // Act
        String username = jwtUtil.extractUsername(token);

        // Assert
        assertEquals("test@example.com", username);
    }

    @Test
    @DisplayName("Извлечение срока действия токена успешно")
    void extractExpiration_Success() {
        // Arrange
        String token = jwtUtil.generateToken(testUserDetails);

        // Act
        Date expiration = jwtUtil.extractExpiration(token);

        // Assert
        assertNotNull(expiration);
        assertTrue(expiration.after(new Date()));
    }

    @Test
    @DisplayName("Валидация корректного токена успешна")
    void validateToken_ValidToken_Success() {
        // Arrange
        String token = jwtUtil.generateToken(testUserDetails);

        // Act
        boolean isValid = jwtUtil.validateToken(token, testUserDetails);

        // Assert
        assertTrue(isValid);
    }

    @Test
    @DisplayName("Валидация токена с неверным username失败")
    void validateToken_WrongUsername_Fails() {
        // Arrange
        String token = jwtUtil.generateToken(testUserDetails);
        UserDetails wrongUser = new User("wrong@example.com", "password", Collections.emptyList());

        // Act
        boolean isValid = jwtUtil.validateToken(token, wrongUser);

        // Assert
        assertFalse(isValid);
    }

    @Test
    @DisplayName("Валидация просроченного токена")
    void validateToken_ExpiredToken_Fails() {
        // Arrange
        JwtUtil expiredJwtUtil = new JwtUtil(testSecret, 1); // 1ms expiration
        String token = expiredJwtUtil.generateToken(testUserDetails);

        // Даем токену время истечь
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Act & Assert
        assertFalse(expiredJwtUtil.validateToken(token, testUserDetails));
    }

    @Test
    @DisplayName("Извлечение всех claims из токена успешно")
    void extractAllClaims_Success() {
        // Arrange
        String token = jwtUtil.generateToken(testUserDetails);

        // Act
        Date expiration = jwtUtil.extractExpiration(token);
        String subject = jwtUtil.extractUsername(token);

        // Assert
        assertNotNull(expiration);
        assertEquals("test@example.com", subject);
    }

    @Test
    @DisplayName("Токен с разным secret ключом не валидируется")
    void validateToken_DifferentSecret_Fails() {
        // Arrange
        String token = jwtUtil.generateToken(testUserDetails);
        JwtUtil differentJwtUtil = new JwtUtil("different-secret-key-for-testing", testExpirationMs);

        // Act & Assert
        assertThrows(Exception.class, () -> differentJwtUtil.validateToken(token, testUserDetails));
    }

    @Test
    @DisplayName("Извлечение username из невалидного токена выбрасывает исключение")
    void extractUsername_InvalidToken_ThrowsException() {
        // Arrange
        String invalidToken = "invalid.token.here";

        // Act & Assert
        assertThrows(Exception.class, () -> jwtUtil.extractUsername(invalidToken));
    }
}
