package io.mockge.backend;

import io.mockge.backend.api.entity.ProjectEntity;
import io.mockge.backend.api.entity.UserEntity;

import java.time.Instant;
import java.util.UUID;

public class TestFixtures {

    public static UserEntity createUserEntity(UUID id, String email, String passwordHash, String name) {
        UserEntity user = new UserEntity();
        user.setId(id != null ? id : UUID.randomUUID());
        user.setEmail(email);
        user.setPasswordHash(passwordHash);
        user.setName(name);
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        return user;
    }

    public static UserEntity createUserEntity(String email, String passwordHash, String name) {
        return createUserEntity(null, email, passwordHash, name);
    }

    public static ProjectEntity createProjectEntity(
            UUID id, String name, String description, UserEntity owner) {
        ProjectEntity project = new ProjectEntity();
        project.setId(id != null ? id : UUID.randomUUID());
        project.setName(name);
        project.setDescription(description);
        project.setOwner(owner);
        project.setCreatedAt(Instant.now());
        project.setUpdatedAt(Instant.now());
        return project;
    }

    public static ProjectEntity createProjectEntity(String name, String description, UserEntity owner) {
        return createProjectEntity(null, name, description, owner);
    }
}
