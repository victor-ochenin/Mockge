package io.mockge.backend.api.dto;

public class DeploySchemaRequest {
    private String subdomain;
    private DeploymentSettings settings;

    public String getSubdomain() {
        return subdomain;
    }

    public void setSubdomain(String subdomain) {
        this.subdomain = subdomain;
    }

    public DeploymentSettings getSettings() {
        return settings;
    }

    public void setSettings(DeploymentSettings settings) {
        this.settings = settings;
    }

    public static class DeploymentSettings {
        private Integer defaultLatency;
        private Double errorRate;

        public Integer getDefaultLatency() {
            return defaultLatency;
        }

        public void setDefaultLatency(Integer defaultLatency) {
            this.defaultLatency = defaultLatency;
        }

        public Double getErrorRate() {
            return errorRate;
        }

        public void setErrorRate(Double errorRate) {
            this.errorRate = errorRate;
        }
    }
}
