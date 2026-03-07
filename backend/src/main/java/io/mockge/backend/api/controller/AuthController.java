package io.mockge.backend.api.controller;

import io.mockge.backend.api.dto.AuthResponse;
import io.mockge.backend.api.entity.UserEntity;
import io.mockge.backend.api.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Возвращает информацию о текущем пользователе
     * Используется для синхронизации состояния после входа через Clerk
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        UserEntity user = userService.findByEmail(userDetails.getUsername());

        AuthResponse.UserDto userDto = new AuthResponse.UserDto(
                user.getId().toString(),
                user.getEmail(),
                user.getName()
        );

        return ResponseEntity.ok(new AuthResponse(null, null, userDto));
    }
}
