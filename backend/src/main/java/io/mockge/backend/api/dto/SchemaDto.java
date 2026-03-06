package io.mockge.backend.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SchemaDto {

    private UUID id;
    private UUID projectId;
    private String name;
    private Integer version;
    private List<EntityDto> entities;
    private SettingsDto settings;
    private Boolean isActive;
    private Instant createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntityDto {
        private String id;
        private String name;
        private List<FieldDto> fields;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldDto {
        private String id;
        private String name;
        private String type;
        private Boolean primary;
        private Boolean generated;
        private Boolean required;
        private String faker;
        private Integer min;
        private Integer max;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SettingsDto {
        private Integer defaultLatency;
        private Double errorRate;
        private Boolean stateful;
        private Integer maxItems;
    }
}
