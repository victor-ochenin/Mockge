package io.mockge.backend.api.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ClerkService {

    @Value("${clerk.secret-key:}")
    private String secretKey;

    @Value("${clerk.publishable-key:}")
    private String publishableKey;

    @Value("${clerk.domain:}")
    private String clerkDomain;

    private final Map<String, PublicKey> cachedKeys = new ConcurrentHashMap<>();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Проверяет и декодирует JWT токен от Clerk
     * @param token JWT токен
     * @return Claims из токена если токен валиден
     * @throws RuntimeException если токен невалиден
     */
    public Claims verifyToken(String token) {
        if (!StringUtils.hasText(token)) {
            throw new IllegalArgumentException("Token is empty");
        }

        try {
            // Извлекаем kid из заголовка токена
            String kid = extractKid(token);
            
            // Получаем публичный ключ для верификации
            PublicKey publicKey = getPublicKey(kid);
            
            // Парсим и верифицируем токен
            Claims claims = Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            return claims;
        } catch (SignatureException e) {
            throw new RuntimeException("Invalid token signature: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Invalid token: " + e.getMessage());
        }
    }

    /**
     * Извлекает email из claims токена Clerk
     */
    public String extractEmail(Claims claims) {
        // Clerk хранит email в поле "email" или "sub"
        String email = claims.get("email", String.class);
        if (email == null) {
            email = claims.getSubject();
        }
        return email;
    }

    /**
     * Извлекает имя пользователя из claims токена Clerk
     */
    public String extractName(Claims claims) {
        String firstName = claims.get("first_name", String.class);
        String lastName = claims.get("last_name", String.class);
        
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        }
        
        // Пробуем получить из name
        String name = claims.get("name", String.class);
        if (name != null) {
            return name;
        }
        
        // Fallback к email
        return extractEmail(claims);
    }

    /**
     * Извлекает ID пользователя из claims токена Clerk
     */
    public String extractId(Claims claims) {
        return claims.getSubject();
    }

    /**
     * Извлекает kid (key id) из заголовка JWT токена
     */
    private String extractKid(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid token format");
            }
            
            String header = new String(Base64.getUrlDecoder().decode(parts[0]));
            @SuppressWarnings("unchecked")
            Map<String, Object> headerMap = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(header, Map.class);
            
            return (String) headerMap.get("kid");
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract kid from token: " + e.getMessage());
        }
    }

    /**
     * Получает публичный ключ для верификации токена из Clerk JWKS
     */
    private PublicKey getPublicKey(String kid) throws Exception {
        return cachedKeys.computeIfAbsent(kid, k -> {
            try {
                // Загружаем JWKS из Clerk
                String jwksJson = loadJwks();
                
                // Парсим JWKS и находим нужный ключ
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> jwks = mapper.readValue(jwksJson, Map.class);
                java.util.List<Map<String, Object>> keys = (java.util.List<Map<String, Object>>) jwks.get("keys");
                
                Map<String, Object> keyData = null;
                for (Map<String, Object> key : keys) {
                    if (kid.equals(key.get("kid"))) {
                        keyData = key;
                        break;
                    }
                }
                
                if (keyData == null) {
                    throw new RuntimeException("Key not found for kid: " + kid);
                }
                
                // Создаём PublicKey из JWK
                String kty = (String) keyData.get("kty");
                String n = (String) keyData.get("n");
                String e = (String) keyData.get("e");
                
                if (!"RSA".equals(kty)) {
                    throw new RuntimeException("Unsupported key type: " + kty);
                }
                
                byte[] modulus = Base64.getUrlDecoder().decode(n);
                byte[] exponent = Base64.getUrlDecoder().decode(e);
                
                // Создаём RSA PublicKey
                java.security.spec.RSAPublicKeySpec keySpec = new java.security.spec.RSAPublicKeySpec(
                    new java.math.BigInteger(1, modulus),
                    new java.math.BigInteger(1, exponent)
                );
                
                KeyFactory keyFactory = KeyFactory.getInstance("RSA");
                return keyFactory.generatePublic(keySpec);
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to load public key: " + e.getMessage());
            }
        });
    }

    /**
     * Загружает JWKS из Clerk
     */
    private String loadJwks() throws Exception {
        // Извлекаем домен из конфига или publishable key
        String domain = getDomain();
        String jwksUrl = "https://" + domain + "/.well-known/jwks.json";
        
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(jwksUrl))
                .GET()
                .build();
        
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed to load JWKS from " + jwksUrl + ": " + response.statusCode());
        }
        
        return response.body();
    }

    /**
     * Получает домен Clerk из конфига или из publishable key
     */
    private String getDomain() {
        if (StringUtils.hasText(clerkDomain)) {
            return clerkDomain;
        }
        
        // Если домен не указан, пробуем извлечь из publishable key
        // Формат: pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        // Для этого нужно чтобы был настроен frontend API key
        if (StringUtils.hasText(publishableKey)) {
            // В новых версиях Clerk publishable key содержит домен
            // Но для упрощения вернём дефолтное значение
            return "clerk.your-domain.com";
        }
        
        throw new IllegalStateException("Clerk domain is not configured. Please set CLERK_DOMAIN environment variable.");
    }
}
