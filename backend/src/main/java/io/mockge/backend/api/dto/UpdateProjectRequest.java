package io.mockge.backend.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProjectRequest {

    @Size(max = 200, message = "Название проекта не должно превышать 200 символов")
    private String name;

    @Size(max = 1000, message = "Описание не должно превышать 1000 символов")
    private String description;

    @Pattern(regexp = "^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$", message = "Поддомен должен содержать только строчные латинские буквы, цифры и дефисы")
    private String subdomain;
}
