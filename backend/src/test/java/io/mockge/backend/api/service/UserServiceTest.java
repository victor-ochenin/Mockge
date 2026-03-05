package io.mockge.backend.api.service;

import io.mockge.backend.TestFixtures;
import io.mockge.backend.api.entity.UserEntity;
import io.mockge.backend.api.repository.UserRepository;
import io.mockge.backend.api.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Юнит-тесты UserService")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    private UserService userService;

    private UserEntity testUser;
    private final UUID testUserId = UUID.randomUUID();
    private final String testEmail = "test@example.com";
    private final String testPasswordHash = "hashedPassword";
    private final String testName = "Test User";

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository);
        testUser = TestFixtures.createUserEntity(testUserId, testEmail, testPasswordHash, testName);
    }

    @Test
    @DisplayName("Загрузка пользователя по email успешна")
    void loadUserByUsername_Success() {
        // Arrange
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));

        // Act
        UserDetails userDetails = userService.loadUserByUsername(testEmail);

        // Assert
        assertNotNull(userDetails);
        assertTrue(userDetails instanceof CustomUserDetails);
        assertEquals(testEmail, userDetails.getUsername());
        assertEquals(testPasswordHash, userDetails.getPassword());
        assertTrue(userDetails.isEnabled());
        assertTrue(userDetails.isAccountNonExpired());
        assertTrue(userDetails.isAccountNonLocked());
        assertTrue(userDetails.isCredentialsNonExpired());

        CustomUserDetails customUserDetails = (CustomUserDetails) userDetails;
        assertEquals(testUser, customUserDetails.getUser());
    }

    @Test
    @DisplayName("Загрузка несуществующего пользователя выбрасывает исключение")
    void loadUserByUsername_NotFound_ThrowsException() {
        // Arrange
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.empty());

        // Act & Assert
        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> userService.loadUserByUsername(testEmail)
        );
        assertTrue(exception.getMessage().contains("Пользователь не найден"));
        assertTrue(exception.getMessage().contains(testEmail));
    }

    @Test
    @DisplayName("Поиск пользователя по email успешен")
    void findByEmail_Success() {
        // Arrange
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));

        // Act
        UserEntity result = userService.findByEmail(testEmail);

        // Assert
        assertNotNull(result);
        assertEquals(testUserId, result.getId());
        assertEquals(testEmail, result.getEmail());
        assertEquals(testName, result.getName());
    }

    @Test
    @DisplayName("Поиск несуществующего пользователя по email выбрасывает исключение")
    void findByEmail_NotFound_ThrowsException() {
        // Arrange
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.empty());

        // Act & Assert
        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> userService.findByEmail(testEmail)
        );
        assertTrue(exception.getMessage().contains("Пользователь не найден"));
    }

    @Test
    @DisplayName("Поиск пользователя по ID успешен")
    void findById_Success() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // Act
        UserEntity result = userService.findById(testUserId);

        // Assert
        assertNotNull(result);
        assertEquals(testUserId, result.getId());
        assertEquals(testEmail, result.getEmail());
        assertEquals(testName, result.getName());
    }

    @Test
    @DisplayName("Поиск несуществующего пользователя по ID выбрасывает исключение")
    void findById_NotFound_ThrowsException() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // Act & Assert
        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> userService.findById(testUserId)
        );
        assertTrue(exception.getMessage().contains("Пользователь не найден"));
    }
}
