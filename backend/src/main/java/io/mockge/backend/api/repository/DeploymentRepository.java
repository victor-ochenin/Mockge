package io.mockge.backend.api.repository;

import io.mockge.backend.api.entity.DeploymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeploymentRepository extends JpaRepository<DeploymentEntity, UUID> {
    Optional<DeploymentEntity> findBySubdomain(String subdomain);

    @Query("SELECT d FROM DeploymentEntity d JOIN d.schema s WHERE s.project.id = :projectId")
    List<DeploymentEntity> findByProjectId(@Param("projectId") UUID projectId);
}
