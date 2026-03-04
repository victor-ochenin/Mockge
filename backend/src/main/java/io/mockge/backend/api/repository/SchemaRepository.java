package io.mockge.backend.api.repository;

import io.mockge.backend.api.entity.SchemaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SchemaRepository extends JpaRepository<SchemaEntity, UUID> {
    List<SchemaEntity> findByProjectId(UUID projectId);
    Optional<SchemaEntity> findByProjectIdAndIsActive(UUID projectId, Boolean isActive);
    Optional<SchemaEntity> findByProjectIdAndVersion(UUID projectId, Integer version);
}
