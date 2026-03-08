package io.mockge.backend.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class SchemaDto {

    private UUID id;
    private UUID projectId;
    private String projectSubdomain;
    private String name;
    private Integer version;
    private Object schemaJson;
    private Boolean isActive;
    private Instant createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public String getProjectSubdomain() {
        return projectSubdomain;
    }

    public void setProjectSubdomain(String projectSubdomain) {
        this.projectSubdomain = projectSubdomain;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public Object getSchemaJson() {
        return schemaJson;
    }

    public void setSchemaJson(Object schemaJson) {
        this.schemaJson = schemaJson;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
