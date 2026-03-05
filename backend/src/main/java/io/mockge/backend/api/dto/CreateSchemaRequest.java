package io.mockge.backend.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSchemaRequest {

    @NotBlank(message = "Название схемы не может быть пустым")
    private String name;

    @NotNull(message = "Список сущностей не может быть пустым")
    private List<EntitySchema> entities;

    private SettingsSchema settings;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntitySchema {
        private String id;
        private String name;
        private List<FieldSchema> fields;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldSchema {
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
    public static class SettingsSchema {
        private Integer defaultLatency;
        private Double errorRate;
        private Boolean stateful;
        private Integer maxItems;
    }
}
