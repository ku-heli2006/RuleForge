package com.ruleforge.domain;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record RuleDefinition(
        @NotBlank @Size(max = 64) String id,
        @NotBlank @Size(max = 120) String name,
        @Size(max = 500) String description,
        @Min(0) @Max(100000) int priority,
        @NotBlank @Size(max = 4000) String condition,
        @NotNull @Valid Action action,
        boolean enabled) {
    public record Action(@DecimalMin("0") @DecimalMax("100") BigDecimal discountPercentage,
                         Boolean eligible, Boolean freeShipping, Boolean priorityProcessing,
                         List<@Size(max=64) String> customTags, @Size(max=300) String message) {
        public Action { customTags = customTags == null ? List.of() : List.copyOf(customTags); }
    }
}
