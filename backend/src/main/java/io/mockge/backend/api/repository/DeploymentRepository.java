package io.mockge.backend.api.repository;

import io.mockge.backend.api.entity.DeploymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DeploymentRepository extends JpaRepository<DeploymentEntity, UUID> {
    Optional<DeploymentEntity> findBySubdomain(String subdomain);
}
