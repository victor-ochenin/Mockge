package io.mockge.backend.api.dto;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class DeploymentDto {
    private UUID id;
    private UUID schemaId;
    private String subdomain;
    private String status;
    private String url;
    private Instant createdAt;
}
