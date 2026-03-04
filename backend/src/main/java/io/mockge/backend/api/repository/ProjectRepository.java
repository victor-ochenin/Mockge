package io.mockge.backend.api.repository;

import io.mockge.backend.api.entity.ProjectEntity;
import io.mockge.backend.api.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, UUID> {
    List<ProjectEntity> findByOwnerId(UUID ownerId);
    List<ProjectEntity> findByOwner(UserEntity owner);
}
