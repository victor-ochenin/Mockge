package io.mockge.backend.api.repository;

import io.mockge.backend.api.entity.SchemaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SchemaRepository extends JpaRepository<SchemaEntity, UUID> {
    List<SchemaEntity> findByProjectId(UUID projectId);
    Optional<SchemaEntity> findByProjectIdAndIsActive(UUID projectId, Boolean isActive);
    Optional<SchemaEntity> findByProjectIdAndVersion(UUID projectId, Integer version);

    @Query("SELECT COALESCE(MAX(s.version), 0) FROM SchemaEntity s WHERE s.project.id = :projectId")
    Integer findMaxVersionByProjectId(@Param("projectId") UUID projectId);

    @Modifying
    @Query("DELETE FROM SchemaEntity s WHERE s.project.id = :projectId AND s.isActive = false")
    void deleteInactiveByProjectId(@Param("projectId") UUID projectId);
}
