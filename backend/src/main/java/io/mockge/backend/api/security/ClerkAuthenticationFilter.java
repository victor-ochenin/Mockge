package io.mockge.backend.api.security;

import io.jsonwebtoken.Claims;
import io.mockge.backend.api.entity.UserEntity;
import io.mockge.backend.api.repository.UserRepository;
import io.mockge.backend.api.service.ClerkService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Фильтр аутентификации Clerk для обработки JWT токенов.
 * 
 * Интегрируется с Spring Security через стандартный механизм фильтров.
 * Для каждого запроса проверяет наличие Bearer токена и валидирует его через Clerk.
 */
@Component
public class ClerkAuthenticationFilter extends OncePerRequestFilter {

    private final ClerkService clerkService;
    private final UserRepository userRepository;

    public ClerkAuthenticationFilter(ClerkService clerkService, UserRepository userRepository) {
        this.clerkService = clerkService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        try {
            // Проверяем токен через Clerk и получаем claims
            Claims claims = clerkService.verifyToken(jwt);

            if (claims != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String email = clerkService.extractEmail(claims);

                if (email != null) {
                    // Находим или создаём пользователя в нашей БД
                    UserEntity userEntity = findOrCreateUser(claims, email);

                    // Создаём UserDetails с минимальными правами
                    UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                            email,
                            "",
                            Collections.emptyList()
                    );

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    
                    logger.debug("Successfully authenticated user: " + email);
                }
            }
        } catch (Exception e) {
            // Токен невалиден - продолжаем без аутентификации
            logger.warn("Invalid Clerk token: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Находит пользователя в БД или создаёт нового на основе данных из Clerk
     */
    private UserEntity findOrCreateUser(Claims claims, String email) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> {
                    UserEntity newUser = new UserEntity();
                    newUser.setEmail(email);
                    newUser.setName(clerkService.extractName(claims));
                    newUser.setPasswordHash(""); // Пароль не нужен, т.к. аутентификация через Clerk
                    return userRepository.save(newUser);
                });
    }
}
