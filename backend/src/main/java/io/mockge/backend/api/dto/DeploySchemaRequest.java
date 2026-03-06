package io.mockge.backend.api.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class DeploySchemaRequest {
    private String subdomain;
    private DeploymentSettings settings;

    @Data
    public static class DeploymentSettings {
        private Integer defaultLatency;
        private Double errorRate;
    }
}
