package io.mockge.backend.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CreateSchemaRequest {

    @NotBlank(message = "Название схемы не может быть пустым")
    private String name;

    @NotNull(message = "JSON схемы не может быть пустым")
    private Object schemaJson;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Object getSchemaJson() {
        return schemaJson;
    }

    public void setSchemaJson(Object schemaJson) {
        this.schemaJson = schemaJson;
    }
}
